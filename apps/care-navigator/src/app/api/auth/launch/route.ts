// SMART App Launch initiation — generates PKCE, stores in session, redirects to auth server
import { type NextRequest, NextResponse } from 'next/server';
import { generatePKCEParams, buildAuthorizationUrl } from '@plumly/smart-fhir';
import { getSession } from '@/lib/auth';
import { getSmartConfig } from '@/lib/smart-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const iss = searchParams.get('iss') ?? process.env.NEXT_PUBLIC_SMART_ISS ?? '';
  const launch = searchParams.get('launch') ?? undefined;

  if (!iss) {
    return NextResponse.json({ error: 'Missing iss parameter' }, { status: 400 });
  }

  try {
    const pkce = await generatePKCEParams();

    const config = getSmartConfig({ iss, launch });
    const { url } = await buildAuthorizationUrl(config, pkce);

    // Store PKCE in session before redirecting
    const session = await getSession();
    session.pkce = { codeVerifier: pkce.codeVerifier, state: pkce.state };
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
