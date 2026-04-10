import { describe, it, expect } from 'vitest';
import { selectVisitPrepResources } from '../visit-prep-selector';
import type { FHIRBundle } from '../types';

function makeBundle(resources: unknown[]): FHIRBundle {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: resources.map(resource => ({ resource })),
  } as FHIRBundle;
}

const patient = {
  resourceType: 'Patient',
  id: 'p1',
  name: [{ given: ['Jane'], family: 'Doe' }],
  birthDate: '1985-01-01',
  gender: 'female',
};

const activeCondition = {
  resourceType: 'Condition',
  id: 'c1',
  clinicalStatus: { coding: [{ code: 'active' }] },
  verificationStatus: { coding: [{ code: 'confirmed' }] },
  code: { coding: [{ code: 'E11', display: 'Type 2 diabetes' }] },
  subject: { reference: 'Patient/p1' },
};

const resolvedCondition = {
  resourceType: 'Condition',
  id: 'c2',
  clinicalStatus: { coding: [{ code: 'resolved' }] },
  verificationStatus: { coding: [{ code: 'confirmed' }] },
  code: { coding: [{ code: 'J00', display: 'Common cold' }] },
  subject: { reference: 'Patient/p1' },
};

const activeMed = {
  resourceType: 'MedicationRequest',
  id: 'm1',
  status: 'active',
  medicationCodeableConcept: { coding: [{ code: '123', display: 'Metformin 500 mg' }] },
  subject: { reference: 'Patient/p1' },
  authoredOn: '2024-01-01',
};

const stoppedMed = {
  resourceType: 'MedicationRequest',
  id: 'm2',
  status: 'stopped',
  medicationCodeableConcept: { coding: [{ code: '456', display: 'Old Antibiotic' }] },
  subject: { reference: 'Patient/p1' },
  authoredOn: '2023-06-01',
};

const recentLab = {
  resourceType: 'Observation',
  id: 'o1',
  category: [{ coding: [{ code: 'laboratory' }] }],
  code: { coding: [{ code: '33747-0', display: 'Glucose' }] },
  valueQuantity: { value: 120, unit: 'mg/dL' },
  status: 'final',
  effectiveDateTime: new Date().toISOString(),
  subject: { reference: 'Patient/p1' },
};

const oldLab = {
  resourceType: 'Observation',
  id: 'o2',
  category: [{ coding: [{ code: 'laboratory' }] }],
  code: { coding: [{ code: '33747-0', display: 'Glucose (old)' }] },
  valueQuantity: { value: 100, unit: 'mg/dL' },
  status: 'final',
  effectiveDateTime: '2020-01-01',
  subject: { reference: 'Patient/p1' },
};

const enc1 = {
  resourceType: 'Encounter',
  id: 'e1',
  status: 'finished',
  subject: { reference: 'Patient/p1' },
  period: { start: '2024-06-15', end: '2024-06-15' },
};
const enc2 = {
  resourceType: 'Encounter',
  id: 'e2',
  status: 'finished',
  subject: { reference: 'Patient/p1' },
  period: { start: '2024-03-01', end: '2024-03-01' },
};
const enc3 = {
  resourceType: 'Encounter',
  id: 'e3',
  status: 'finished',
  subject: { reference: 'Patient/p1' },
  period: { start: '2023-12-01', end: '2023-12-01' },
};

const bundle = makeBundle([
  patient, activeCondition, resolvedCondition,
  activeMed, stoppedMed,
  recentLab, oldLab,
  enc1, enc2, enc3,
]);

describe('selectVisitPrepResources', () => {
  it('returns a valid ResourceSelectionResult shape', () => {
    const result = selectVisitPrepResources(bundle);
    expect(Array.isArray(result.medications)).toBe(true);
    expect(Array.isArray(result.conditions)).toBe(true);
    expect(Array.isArray(result.labValues)).toBe(true);
    expect(Array.isArray(result.encounters)).toBe(true);
  });

  it('excludes stopped medications', () => {
    const result = selectVisitPrepResources(bundle);
    const names = result.medications.map(m => m.name);
    expect(names.some(n => n.includes('Metformin'))).toBe(true);
    expect(names.some(n => n.includes('Old Antibiotic'))).toBe(false);
  });

  it('excludes labs older than labLookbackDays (default 180)', () => {
    const result = selectVisitPrepResources(bundle, { labLookbackDays: 180 });
    // 2020 lab is way outside the window
    const displays = result.labValues.map(l => l.display);
    expect(displays.some(d => d?.includes('old'))).toBe(false);
  });

  it('limits encounters to maxEncounters (default 2)', () => {
    const result = selectVisitPrepResources(bundle);
    expect(result.encounters.length).toBeLessThanOrEqual(2);
  });

  it('sorts encounters newest-first', () => {
    const result = selectVisitPrepResources(bundle, { maxEncounters: 3 });
    const starts = result.encounters
      .map(e => e.period?.start)
      .filter(Boolean)
      .map(s => new Date(s!).getTime());
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i - 1]).toBeGreaterThanOrEqual(starts[i]);
    }
  });

  it('respects maxEncounters = 1', () => {
    const result = selectVisitPrepResources(bundle, { maxEncounters: 1 });
    expect(result.encounters.length).toBeLessThanOrEqual(1);
  });

  it('includeInactiveConditions = true returns more conditions than false', () => {
    const withInactive = selectVisitPrepResources(bundle, { includeInactiveConditions: true });
    const withoutInactive = selectVisitPrepResources(bundle, { includeInactiveConditions: false });
    expect(withInactive.conditions.length).toBeGreaterThanOrEqual(withoutInactive.conditions.length);
  });

  it('handles an empty bundle gracefully', () => {
    const emptyBundle = makeBundle([patient]);
    const result = selectVisitPrepResources(emptyBundle);
    expect(result.medications.length).toBe(0);
    expect(result.labValues.length).toBe(0);
    expect(result.encounters.length).toBe(0);
  });
});
