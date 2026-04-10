// PKCE (Proof Key for Code Exchange) utilities using Web Crypto API
// Works in Node 18+ and modern browsers without additional dependencies

import type { PKCEParams } from './types';

function base64UrlEncode(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateRandomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  // Works in both Node.js (18+) and browsers
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer);
  } else {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomBytes } = require('crypto') as typeof import('crypto');
    const bytes = randomBytes(length);
    buffer.set(bytes);
  }
  return buffer;
}

/** Generate a cryptographically random code verifier (128 bytes, base64url encoded) */
export function generateCodeVerifier(): string {
  return base64UrlEncode(generateRandomBytes(96).buffer);
}

/** SHA-256 hash the verifier and base64url encode it to produce the code challenge */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  }

  // Node.js fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  const hash = createHash('sha256').update(verifier).digest();
  return Buffer.from(hash)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** Generate a random state parameter (32 bytes, hex encoded) */
export function generateState(): string {
  const bytes = generateRandomBytes(32);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate all PKCE parameters in one call */
export async function generatePKCEParams(): Promise<PKCEParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256', state };
}
