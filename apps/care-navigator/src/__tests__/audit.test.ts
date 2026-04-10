import { describe, it, expect, beforeEach } from 'vitest';
import { appendAuditEntry, getAuditLog, clearAuditLog } from '../lib/audit';

describe('audit log', () => {
  beforeEach(() => {
    clearAuditLog();
  });

  it('starts empty after clear', () => {
    expect(getAuditLog()).toHaveLength(0);
  });

  it('appendAuditEntry returns a full entry with id and timestamp', () => {
    const entry = appendAuditEntry({
      action: 'brief-generated',
      patientId: 'p123',
      actorId: 'nav1',
    });
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.action).toBe('brief-generated');
    expect(entry.patientId).toBe('p123');
    expect(entry.actorId).toBe('nav1');
  });

  it('getAuditLog returns newest entries first (reverse-chronological)', () => {
    appendAuditEntry({ action: 'consent-given', patientId: 'p1' });
    appendAuditEntry({ action: 'brief-generated', patientId: 'p2' });
    appendAuditEntry({ action: 'sms-sent', patientId: 'p3' });

    const log = getAuditLog();
    expect(log[0].action).toBe('sms-sent');
    expect(log[1].action).toBe('brief-generated');
    expect(log[2].action).toBe('consent-given');
  });

  it('respects the limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      appendAuditEntry({ action: 'patient-viewed', patientId: `p${i}` });
    }
    expect(getAuditLog(3)).toHaveLength(3);
    expect(getAuditLog(100)).toHaveLength(10);
  });

  it('generates unique ids for each entry', () => {
    appendAuditEntry({ action: 'auth-success', patientId: 'p1' });
    appendAuditEntry({ action: 'auth-success', patientId: 'p1' });
    const log = getAuditLog();
    expect(log[0].id).not.toBe(log[1].id);
  });

  it('accepts optional metadata', () => {
    appendAuditEntry({
      action: 'sms-sent',
      patientId: 'p1',
      metadata: { to: '+15551234567', body: 'Hello' },
    });
    const [entry] = getAuditLog();
    expect(entry.metadata).toEqual({ to: '+15551234567', body: 'Hello' });
  });
});
