// Thin wrapper that builds SMARTConfig from environment variables
import type { SMARTConfig } from '@plumly/smart-fhir';

// Trim whitespace/newlines that can sneak in from env var editors
const trim = (v: string | undefined) => v?.trim();

// Sensible defaults so the sandbox flow works without env vars being set
const DEFAULT_ISS = 'https://launch.smarthealthit.org/v/r4/fhir';
const DEFAULT_CLIENT_ID = 'demo_client';
const DEFAULT_SCOPE = 'openid fhirUser launch/patient patient/*.read';

export function getSmartConfig(overrides: Partial<SMARTConfig> = {}): SMARTConfig {
  const iss = trim(process.env.NEXT_PUBLIC_SMART_ISS) ?? DEFAULT_ISS;
  const clientId = trim(process.env.NEXT_PUBLIC_SMART_CLIENT_ID) ?? DEFAULT_CLIENT_ID;
  // redirectUri can come from env var OR from the overrides (derived from request URL at runtime)
  const redirectUri = overrides.redirectUri ?? trim(process.env.NEXT_PUBLIC_SMART_REDIRECT_URI);
  const scope = trim(process.env.NEXT_PUBLIC_SMART_SCOPE) ?? DEFAULT_SCOPE;

  if (!redirectUri) {
    throw new Error(
      'Cannot determine redirect URI. Set NEXT_PUBLIC_SMART_REDIRECT_URI or pass it as an override.'
    );
  }

  return {
    iss,
    clientId,
    scope,
    ...overrides,
    // Always use the pre-resolved redirectUri (env var or caller-supplied origin derivation)
    redirectUri,
  };
}
