// Simulated SMS delivery — mirrors Twilio Messages API shape without making real API calls
import { randomUUID } from 'crypto';

export interface SMSMockPayload {
  to: string;
  body: string;
  /** Fixed mock sender number */
  from?: string;
}

export interface SMSMockResult {
  queued: true;
  mockId: string;
  sentAt: string;
  /** Twilio-shaped response so the integration contract is documented */
  twilioShape: {
    sid: string;
    status: 'queued';
    to: string;
    from: string;
    body: string;
    numSegments: string;
    direction: 'outbound-api';
    price: null;
    priceUnit: 'USD';
    dateCreated: string;
    uri: string;
  };
}

const MOCK_SENDER = '+15005550006'; // Twilio test magic number

export function sendSMSMock(payload: SMSMockPayload): SMSMockResult {
  const mockId = randomUUID();
  const sid = `SM${mockId.replace(/-/g, '').slice(0, 32).toUpperCase()}`;
  const sentAt = new Date().toISOString();

  const result: SMSMockResult = {
    queued: true,
    mockId,
    sentAt,
    twilioShape: {
      sid,
      status: 'queued',
      to: payload.to,
      from: payload.from ?? MOCK_SENDER,
      body: payload.body,
      numSegments: String(Math.ceil(payload.body.length / 160)),
      direction: 'outbound-api',
      price: null,
      priceUnit: 'USD',
      dateCreated: sentAt,
      uri: `/2010-04-01/Accounts/ACMOCK/Messages/${sid}.json`,
    },
  };

  console.log(`[SMS-MOCK] To: ${payload.to} | From: ${result.twilioShape.from}`);
  console.log(`[SMS-MOCK] Body: ${payload.body}`);
  console.log(`[SMS-MOCK] SID: ${sid}`);

  return result;
}
