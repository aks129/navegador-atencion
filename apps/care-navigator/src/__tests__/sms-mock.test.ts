import { describe, it, expect } from 'vitest';
import { sendSMSMock } from '../lib/sms-mock';

describe('sendSMSMock', () => {
  it('returns queued: true', () => {
    const result = sendSMSMock({ to: '+15551234567', body: 'Hello patient' });
    expect(result.queued).toBe(true);
  });

  it('returns a unique mockId (UUID format)', () => {
    const r1 = sendSMSMock({ to: '+15551234567', body: 'Msg 1' });
    const r2 = sendSMSMock({ to: '+15551234567', body: 'Msg 2' });
    expect(r1.mockId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(r1.mockId).not.toBe(r2.mockId);
  });

  it('twilioShape.sid starts with SM and is uppercase', () => {
    const { twilioShape } = sendSMSMock({ to: '+15551234567', body: 'Test' });
    expect(twilioShape.sid).toMatch(/^SM[A-F0-9]+$/);
  });

  it('mirrors the to/body/from in twilioShape', () => {
    const { twilioShape } = sendSMSMock({ to: '+15559876543', body: 'Hola' });
    expect(twilioShape.to).toBe('+15559876543');
    expect(twilioShape.body).toBe('Hola');
    expect(twilioShape.from).toBe('+15005550006'); // Twilio magic number
  });

  it('uses custom from when provided', () => {
    const { twilioShape } = sendSMSMock({
      to: '+15551234567',
      body: 'Test',
      from: '+15551110000',
    });
    expect(twilioShape.from).toBe('+15551110000');
  });

  it('calculates numSegments correctly (160 chars per segment)', () => {
    const shortMsg = sendSMSMock({ to: '+1555', body: 'Short' });
    expect(shortMsg.twilioShape.numSegments).toBe('1');

    const longBody = 'x'.repeat(161);
    const longMsg = sendSMSMock({ to: '+1555', body: longBody });
    expect(longMsg.twilioShape.numSegments).toBe('2');
  });

  it('twilioShape has the expected Twilio shape fields', () => {
    const { twilioShape } = sendSMSMock({ to: '+15551234567', body: 'Hi' });
    expect(twilioShape.status).toBe('queued');
    expect(twilioShape.direction).toBe('outbound-api');
    expect(twilioShape.price).toBeNull();
    expect(twilioShape.priceUnit).toBe('USD');
    expect(twilioShape.uri).toContain('/Accounts/ACMOCK/Messages/');
  });
});
