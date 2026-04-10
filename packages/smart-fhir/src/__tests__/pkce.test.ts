import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEParams,
} from '../pkce';

describe('PKCE utilities', () => {
  describe('generateCodeVerifier', () => {
    it('returns a base64url-encoded string (no +, /, = chars)', () => {
      const verifier = generateCodeVerifier();
      expect(typeof verifier).toBe('string');
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('returns different values on successive calls', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });

    it('returns a string of at least 43 chars (RFC 7636 minimum)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
    });
  });

  describe('generateCodeChallenge', () => {
    it('returns a non-empty base64url string', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(typeof challenge).toBe('string');
      expect(challenge.length).toBeGreaterThan(0);
      expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    });

    it('is deterministic — same verifier produces same challenge', async () => {
      const verifier = 'test-code-verifier-fixed-value';
      const c1 = await generateCodeChallenge(verifier);
      const c2 = await generateCodeChallenge(verifier);
      expect(c1).toBe(c2);
    });

    it('differs from the original verifier', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).not.toBe(verifier);
    });
  });

  describe('generateState', () => {
    it('returns a 64-char lowercase hex string (32 bytes)', () => {
      const state = generateState();
      expect(state).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns different values on successive calls', () => {
      const s1 = generateState();
      const s2 = generateState();
      expect(s1).not.toBe(s2);
    });
  });

  describe('generatePKCEParams', () => {
    it('returns all required PKCE fields', async () => {
      const params = await generatePKCEParams();
      expect(params).toHaveProperty('codeVerifier');
      expect(params).toHaveProperty('codeChallenge');
      expect(params).toHaveProperty('codeChallengeMethod', 'S256');
      expect(params).toHaveProperty('state');
    });

    it('codeChallenge is derived from codeVerifier (not equal)', async () => {
      const { codeVerifier, codeChallenge } = await generatePKCEParams();
      expect(codeChallenge).not.toBe(codeVerifier);
    });

    it('produces unique state on each call', async () => {
      const p1 = await generatePKCEParams();
      const p2 = await generatePKCEParams();
      expect(p1.state).not.toBe(p2.state);
    });
  });
});
