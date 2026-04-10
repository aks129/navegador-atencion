// In-memory audit log (prototype only — replace with persistent store for production)
import { randomUUID } from 'crypto';

export type AuditAction =
  | 'brief-generated'
  | 'brief-viewed'
  | 'sms-sent'
  | 'consent-given'
  | 'opt-out'
  | 'patient-viewed'
  | 'auth-success'
  | 'auth-failed';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  patientId: string;
  actorId?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
}

// Module-level in-memory store (survives within server process lifetime)
const auditLog: AuditEntry[] = [];

export function appendAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>
): AuditEntry {
  const full: AuditEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLog.push(full);
  // Keep last 1000 entries in memory
  if (auditLog.length > 1000) auditLog.shift();
  return full;
}

export function getAuditLog(limit = 100): AuditEntry[] {
  return [...auditLog].reverse().slice(0, limit);
}

/** Clear the audit log — intended for testing only */
export function clearAuditLog(): void {
  auditLog.length = 0;
}
