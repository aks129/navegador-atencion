// SMART on FHIR type definitions

export interface SMARTConfig {
  /** FHIR server base URL (issuer) */
  iss: string;
  clientId: string;
  redirectUri: string;
  /** Space-separated scopes, e.g. "openid fhirUser launch/patient patient/*.read" */
  scope: string;
  /** Opaque launch token for EHR launch; omit for standalone patient launch */
  launch?: string;
}

export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
}

export interface SMARTEndpoints {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  introspectionEndpoint?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  /** FHIR patient resource id if patient-level scope granted */
  patient?: string;
  /** OpenID Connect id_token if openid scope granted */
  id_token?: string;
  refresh_token?: string;
}

export interface LaunchContext {
  iss: string;
  patientId?: string;
  tokenResponse: TokenResponse;
  /** Unix timestamp (ms) when token expires: Date.now() + expires_in * 1000 */
  expiresAt: number;
  tokenEndpoint: string;
}

export interface TokenIntrospection {
  active: boolean;
  scope?: string;
  exp?: number;
  sub?: string;
}

export class SMARTError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'SMARTError';
  }
}
