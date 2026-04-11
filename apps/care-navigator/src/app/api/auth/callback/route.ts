// OAuth2 PKCE callback — exchanges code for token, stores LaunchContext in session
import { type NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, discoverSMARTEndpoints } from '@plumly/smart-fhir';
import { getSession } from '@/lib/auth';
import { getSmartConfig } from '@/lib/smart-client';
import { appendAuditEntry } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
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

  // Use the same redirect URI derivation as the launch route so they always match
  const redirectUri =
    process.env.NEXT_PUBLIC_SMART_REDIRECT_URI?.trim() ?? `${origin}/api/auth/callback`;

  try {
    const config = getSmartConfig({ redirectUri });
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
    // Auto-grant consent so the brief page is immediately reachable after auth
    session.consentGiven = true;
    await session.save();

    appendAuditEntry({
      action: 'auth-success',
      patientId: tokenResponse.patient ?? 'unknown',
      metadata: { scope: tokenResponse.scope },
    });

    // Redirect straight to the brief — SMART flow is now complete end-to-end
    const locale = session.locale ?? 'es';
    return NextResponse.redirect(new URL(`/${locale}/patient/brief`, request.url));
  } catch (err) {
    console.error('[SMART Callback] Token exchange error:', err);
    appendAuditEntry({ action: 'auth-failed', patientId: 'unknown', metadata: { error: String(err) } });
    return NextResponse.redirect(
      new URL('/es/patient/launch?error=token_exchange_failed', request.url)
    );
  }
}
