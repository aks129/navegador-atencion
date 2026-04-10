// SMART App Launch authorization URL builder and endpoint discovery

import type { SMARTConfig, PKCEParams, SMARTEndpoints } from './types';
import { SMARTError } from './types';

/** Discover SMART authorization and token endpoints from the FHIR server */
export async function discoverSMARTEndpoints(iss: string): Promise<SMARTEndpoints> {
  const base = iss.replace(/\/$/, '');

  // Try SMART well-known endpoint first (preferred)
  const wellKnownUrl = `${base}/.well-known/smart-configuration`;
  try {
    const res = await fetch(wellKnownUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      if (data.authorization_endpoint && data.token_endpoint) {
        return {
          authorizationEndpoint: String(data.authorization_endpoint),
          tokenEndpoint: String(data.token_endpoint),
          revocationEndpoint: data.revocation_endpoint ? String(data.revocation_endpoint) : undefined,
          introspectionEndpoint: data.introspection_endpoint ? String(data.introspection_endpoint) : undefined,
        };
      }
    }
  } catch {
    // Fall through to FHIR metadata
  }

  // Fallback: FHIR capability statement
  const metadataUrl = `${base}/metadata`;
  try {
    const res = await fetch(metadataUrl, {
      headers: { Accept: 'application/fhir+json, application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const metadata = await res.json() as Record<string, unknown>;
      const rest = (metadata.rest as any[])?.[0];
      const security = rest?.security;
      const extensions: any[] = security?.extension ?? [];

      let authEndpoint = '';
      let tokenEndpoint = '';

      for (const ext of extensions) {
        if (ext.url === 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris') {
          for (const inner of ext.extension ?? []) {
            if (inner.url === 'authorize') authEndpoint = inner.valueUri;
            if (inner.url === 'token') tokenEndpoint = inner.valueUri;
          }
        }
      }

      if (authEndpoint && tokenEndpoint) {
        return { authorizationEndpoint: authEndpoint, tokenEndpoint };
      }
    }
  } catch {
    // Fall through
  }

  throw new SMARTError(
    `Could not discover SMART endpoints for issuer: ${iss}`,
    'DISCOVERY_FAILED'
  );
}

/** Build the SMART authorization redirect URL */
export async function buildAuthorizationUrl(
  config: SMARTConfig,
  pkce: PKCEParams
): Promise<{ url: string; endpoints: SMARTEndpoints }> {
  const endpoints = await discoverSMARTEndpoints(config.iss);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    state: pkce.state,
    code_challenge: pkce.codeChallenge,
    code_challenge_method: pkce.codeChallengeMethod,
    aud: config.iss,
  });

  if (config.launch) {
    params.set('launch', config.launch);
  }

  const url = `${endpoints.authorizationEndpoint}?${params.toString()}`;
  return { url, endpoints };
}
