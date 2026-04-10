// SMART token exchange and refresh

import type { TokenResponse } from './types';
import { SMARTError } from './types';

/** Exchange authorization code for tokens (PKCE flow) */
export async function exchangeCodeForToken(
  tokenEndpoint: string,
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error');
    throw new SMARTError(
      `Token exchange failed (${res.status}): ${text}`,
      'TOKEN_EXCHANGE_FAILED'
    );
  }

  const data = await res.json() as TokenResponse;

  if (!data.access_token) {
    throw new SMARTError('Token response missing access_token', 'INVALID_TOKEN_RESPONSE');
  }

  return data;
}

/** Refresh an access token using a refresh token (stub — full implementation for production) */
export async function refreshAccessToken(
  tokenEndpoint: string,
  refreshToken: string,
  clientId: string
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error');
    throw new SMARTError(
      `Token refresh failed (${res.status}): ${text}`,
      'TOKEN_REFRESH_FAILED'
    );
  }

  return res.json() as Promise<TokenResponse>;
}

/** Check whether a LaunchContext token is expired (with 30s buffer) */
export function isTokenExpired(expiresAt: number, bufferMs = 30_000): boolean {
  return Date.now() + bufferMs >= expiresAt;
}
