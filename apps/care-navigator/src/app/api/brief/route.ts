export const maxDuration = 60;
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { fetchPatientBundle } from '@plumly/smart-fhir';
import { isTokenExpired } from '@plumly/smart-fhir';
import { getSession } from '@/lib/auth';
import { generateVisitBrief } from '@/lib/brief-generator';
import { appendAuditEntry } from '@/lib/audit';

export async function POST() {
  const session = await getSession();

  if (!session.launchContext) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!session.consentGiven) {
    return NextResponse.json({ error: 'Consent required' }, { status: 403 });
  }

  const { launchContext } = session;

  if (isTokenExpired(launchContext.expiresAt)) {
    return NextResponse.json({ error: 'Session expired. Please reconnect.' }, { status: 401 });
  }

  const patientId = launchContext.patientId;
  if (!patientId) {
    return NextResponse.json({ error: 'No patient context in session' }, { status: 400 });
  }

  try {
    const bundle = await fetchPatientBundle(
      launchContext.iss,
      patientId,
      launchContext.tokenResponse.access_token,
      { timeout: 30_000 }
    );

    const brief = await generateVisitBrief(bundle);

    appendAuditEntry({
      action: 'brief-generated',
      patientId,
      metadata: {
        processingTime: brief.metadata.processingTime,
        model: brief.metadata.model,
      },
    });

    return NextResponse.json({ success: true, brief });
  } catch (error) {
    // Log the full error object so Vercel logs show the real cause
    console.error('[Brief API] Error:', error instanceof Error ? error.message : error);
    if (error && typeof error === 'object' && 'error' in error) {
      console.error('[Brief API] Raw API body:', JSON.stringify((error as any).error));
    }
    return NextResponse.json(
      { error: 'Failed to generate brief', details: String(error instanceof Error ? error.message : error) },
      { status: 500 }
    );
  }
}
