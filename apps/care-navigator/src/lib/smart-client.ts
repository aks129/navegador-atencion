// Thin wrapper that builds SMARTConfig from environment variables
import type { SMARTConfig } from '@plumly/smart-fhir';

export function getSmartConfig(overrides: Partial<SMARTConfig> = {}): SMARTConfig {
  const iss = process.env.NEXT_PUBLIC_SMART_ISS;
  const clientId = process.env.NEXT_PUBLIC_SMART_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SMART_REDIRECT_URI;
  const scope = process.env.NEXT_PUBLIC_SMART_SCOPE;

  if (!iss || !clientId || !redirectUri || !scope) {
    throw new Error(
      'Missing required SMART env vars: NEXT_PUBLIC_SMART_ISS, NEXT_PUBLIC_SMART_CLIENT_ID, NEXT_PUBLIC_SMART_REDIRECT_URI, NEXT_PUBLIC_SMART_SCOPE'
    );
  }

  return {
    iss,
    clientId,
    redirectUri,
    scope,
    ...overrides,
  };
}
