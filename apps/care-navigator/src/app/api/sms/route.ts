import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendSMSMock } from '@/lib/sms-mock';
import { appendAuditEntry } from '@/lib/audit';

const SMSSchema = z.object({
  to: z.string().min(10, 'Phone number required'),
  body: z.string().min(1).max(1600, 'Message too long'),
  patientId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SMSSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { to, body: message, patientId } = parsed.data;

  const result = sendSMSMock({ to, body: message });

  appendAuditEntry({
    action: 'sms-sent',
    patientId,
    metadata: { mockId: result.mockId, to, segments: result.twilioShape.numSegments },
  });

  return NextResponse.json({ success: true, ...result });
}
