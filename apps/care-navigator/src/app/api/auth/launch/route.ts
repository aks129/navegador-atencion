// SMART App Launch initiation — generates PKCE, stores in session, redirects to auth server
import { type NextRequest, NextResponse } from 'next/server';
import { generatePKCEParams, buildAuthorizationUrl } from '@plumly/smart-fhir';
import { getSession } from '@/lib/auth';
import { getSmartConfig } from '@/lib/smart-client';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const iss = searchParams.get('iss') ?? process.env.NEXT_PUBLIC_SMART_ISS ?? 'https://launch.smarthealthit.org/v/r4/fhir';
  const launch = searchParams.get('launch') ?? undefined;
  const locale = (searchParams.get('locale') ?? 'es') as 'en' | 'es';

  // Derive redirect URI from the incoming request origin when env var is not set.
  // This ensures the deployed URL works automatically without manual env var configuration.
  const redirectUri =
    process.env.NEXT_PUBLIC_SMART_REDIRECT_URI?.trim() ?? `${origin}/api/auth/callback`;

  try {
    const pkce = await generatePKCEParams();

    const config = getSmartConfig({ iss, launch, redirectUri });
    const { url } = await buildAuthorizationUrl(config, pkce);

    // Store PKCE, locale, and redirectUri in session before redirecting
    const session = await getSession();
    session.pkce = { codeVerifier: pkce.codeVerifier, state: pkce.state };
    session.locale = locale;
    await session.save();

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('[SMART Launch] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate SMART launch' },
      { status: 500 }
    );
  }
}
