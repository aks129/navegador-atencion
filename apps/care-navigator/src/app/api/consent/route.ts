import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { appendAuditEntry } from '@/lib/audit';

export async function POST() {
  const session = await getSession();

  if (!session.launchContext) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  session.consentGiven = true;
  await session.save();

  appendAuditEntry({
    action: 'consent-given',
    patientId: session.launchContext.patientId ?? 'unknown',
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getSession();

  if (session.launchContext) {
    appendAuditEntry({
      action: 'opt-out',
      patientId: session.launchContext.patientId ?? 'unknown',
    });
  }

  session.optedOut = true;
  session.consentGiven = false;
  await session.save();

  return NextResponse.json({ success: true });
}
