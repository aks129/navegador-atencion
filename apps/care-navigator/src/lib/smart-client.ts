// Thin wrapper that builds SMARTConfig from environment variables
import type { SMARTConfig } from '@plumly/smart-fhir';

// Trim whitespace/newlines that can sneak in from env var editors
const trim = (v: string | undefined) => v?.trim();

export function getSmartConfig(overrides: Partial<SMARTConfig> = {}): SMARTConfig {
  const iss = trim(process.env.NEXT_PUBLIC_SMART_ISS);
  const clientId = trim(process.env.NEXT_PUBLIC_SMART_CLIENT_ID);
  const redirectUri = trim(process.env.NEXT_PUBLIC_SMART_REDIRECT_URI);
  const scope = trim(process.env.NEXT_PUBLIC_SMART_SCOPE);

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
