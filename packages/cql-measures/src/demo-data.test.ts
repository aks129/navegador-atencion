import { describe, it, expect } from 'vitest';
import { DEMO_SCORES, DEMO_GAP_PATIENTS, DEMO_REPORT } from './demo-data.js';
import { MEASURE_IDS } from './measures.js';

describe('DEMO_SCORES', () => {
  it('has a score for each of the 6 measures', () => {
    expect(DEMO_SCORES).toHaveLength(6);
    const ids = DEMO_SCORES.map(s => s.measureId);
    for (const id of MEASURE_IDS) {
      expect(ids).toContain(id);
    }
  });

  it('each score has 12 months of history', () => {
    for (const score of DEMO_SCORES) {
      expect(score.history).toHaveLength(12);
    }
  });

  it('rates are between 0 and 100', () => {
    for (const score of DEMO_SCORES) {
      expect(score.rate).toBeGreaterThan(0);
      expect(score.rate).toBeLessThan(100);
      for (const h of score.history) {
        expect(h.rate).toBeGreaterThan(0);
        expect(h.rate).toBeLessThan(100);
      }
    }
  });

  it('numerator is always <= denominator', () => {
    for (const score of DEMO_SCORES) {
      expect(score.numerator).toBeLessThanOrEqual(score.denominator);
    }
  });

  it('computed rate matches numerator/denominator to 1 decimal', () => {
    for (const score of DEMO_SCORES) {
      const computed = (score.numerator / score.denominator) * 100;
      expect(Math.abs(computed - score.rate)).toBeLessThan(0.5);
    }
  });
});

describe('DEMO_GAP_PATIENTS', () => {
  it('has at least 5 gap patients', () => {
    expect(DEMO_GAP_PATIENTS.length).toBeGreaterThanOrEqual(5);
  });

  it('every patient has at least one not-met measure', () => {
    for (const patient of DEMO_GAP_PATIENTS) {
      const notMet = patient.measures.filter(m => m.status === 'not-met');
      expect(notMet.length).toBeGreaterThan(0);
    }
  });

  it('all measure IDs reference valid measures', () => {
    for (const patient of DEMO_GAP_PATIENTS) {
      for (const m of patient.measures) {
        expect(MEASURE_IDS).toContain(m.measureId);
      }
    }
  });

  it('risk scores are between 0 and 100 when present', () => {
    for (const patient of DEMO_GAP_PATIENTS) {
      if (patient.riskScore !== undefined) {
        expect(patient.riskScore).toBeGreaterThanOrEqual(0);
        expect(patient.riskScore).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('DEMO_REPORT', () => {
  it('contains all 6 scores', () => {
    expect(DEMO_REPORT.scores).toHaveLength(6);
  });

  it('totalPatients is a positive number', () => {
    expect(DEMO_REPORT.totalPatients).toBeGreaterThan(0);
  });
});
