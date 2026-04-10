// OAuth2 PKCE callback — exchanges code for token, stores LaunchContext in session
import { type NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, discoverSMARTEndpoints } from '@plumly/smart-fhir';
import { getSession } from '@/lib/auth';
import { getSmartConfig } from '@/lib/smart-client';
import { appendAuditEntry } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // Handle authorization errors
  if (error) {
    console.error(`[SMART Callback] Auth error: ${error} — ${errorDesc}`);
    return NextResponse.redirect(
      new URL(`/es/patient/launch?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/es/patient/launch?error=missing_params', request.url)
    );
  }

  const session = await getSession();
  const sessionLocale = session.locale ?? 'es';

  // Validate state matches PKCE params
  if (!session.pkce || session.pkce.state !== state) {
    appendAuditEntry({ action: 'auth-failed', patientId: 'unknown', metadata: { reason: 'state_mismatch' } });
    return NextResponse.redirect(
      new URL(`/${sessionLocale}/patient/launch?error=state_mismatch`, request.url)
    );
  }

  try {
    const config = getSmartConfig();
    const endpoints = await discoverSMARTEndpoints(config.iss);

    const tokenResponse = await exchangeCodeForToken(
      endpoints.tokenEndpoint,
      code,
      session.pkce.codeVerifier,
      config.clientId,
      config.redirectUri
    );

    // Store launch context in session
    session.launchContext = {
      iss: config.iss,
      patientId: tokenResponse.patient,
      tokenResponse,
      expiresAt: Date.now() + (tokenResponse.expires_in ?? 3600) * 1000,
      tokenEndpoint: endpoints.tokenEndpoint,
    };
    session.pkce = undefined; // Clear PKCE params — no longer needed
    session.consentGiven = false;
    await session.save();

    appendAuditEntry({
      action: 'auth-success',
      patientId: tokenResponse.patient ?? 'unknown',
      metadata: { scope: tokenResponse.scope },
    });

    // Use locale stored in session during launch (preserves user's language choice through OAuth redirect)
    const locale = session.locale ?? 'es';

    return NextResponse.redirect(new URL(`/${locale}/patient/consent`, request.url));
  } catch (err) {
    console.error('[SMART Callback] Token exchange error:', err);
    appendAuditEntry({ action: 'auth-failed', patientId: 'unknown', metadata: { error: String(err) } });
    return NextResponse.redirect(
      new URL('/es/patient/launch?error=token_exchange_failed', request.url)
    );
  }
}
