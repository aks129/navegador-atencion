import { describe, it, expect } from 'vitest';
import {
  MEASURE_DEFINITIONS,
  MEASURE_IDS,
  getMeasureDefinition,
  getPerformanceLevel,
  getTrendDirection,
} from './measures.js';

describe('MEASURE_DEFINITIONS', () => {
  it('contains exactly 6 UDS measures', () => {
    expect(MEASURE_IDS).toHaveLength(6);
  });

  it('each measure has required fields', () => {
    for (const id of MEASURE_IDS) {
      const def = MEASURE_DEFINITIONS[id];
      expect(def.cmsId).toBeTruthy();
      expect(def.shortName).toBeTruthy();
      expect(def.greenThreshold).toBeTypeOf('number');
      expect(def.amberThreshold).toBeTypeOf('number');
      expect(def.target).toBeTypeOf('number');
    }
  });

  it('HbA1c poor control is an inverse measure (lower = better)', () => {
    const def = getMeasureDefinition('cms122-hba1c-poor-control');
    expect(def.higherIsBetter).toBe(false);
  });

  it('Hypertension control is a direct measure (higher = better)', () => {
    const def = getMeasureDefinition('cms165-hypertension-control');
    expect(def.higherIsBetter).toBe(true);
  });
});

describe('getPerformanceLevel', () => {
  it('returns high for hypertension at 80% (above 75% green threshold)', () => {
    const def = getMeasureDefinition('cms165-hypertension-control');
    expect(getPerformanceLevel(def, 80)).toBe('high');
  });

  it('returns medium for hypertension at 65% (between 60–75%)', () => {
    const def = getMeasureDefinition('cms165-hypertension-control');
    expect(getPerformanceLevel(def, 65)).toBe('medium');
  });

  it('returns low for hypertension at 55% (below 60% amber threshold)', () => {
    const def = getMeasureDefinition('cms165-hypertension-control');
    expect(getPerformanceLevel(def, 55)).toBe('low');
  });

  it('returns high for HbA1c poor control at 20% (below 25% green threshold)', () => {
    const def = getMeasureDefinition('cms122-hba1c-poor-control');
    expect(getPerformanceLevel(def, 20)).toBe('high');
  });

  it('returns low for HbA1c poor control at 40% (above 35% amber threshold)', () => {
    const def = getMeasureDefinition('cms122-hba1c-poor-control');
    expect(getPerformanceLevel(def, 40)).toBe('low');
  });
});

describe('getTrendDirection', () => {
  it('higher rate with higherIsBetter=true returns up', () => {
    expect(getTrendDirection(72, 68, true)).toBe('up');
  });

  it('lower rate with higherIsBetter=true returns down', () => {
    expect(getTrendDirection(65, 70, true)).toBe('down');
  });

  it('small delta (<1) returns stable regardless of direction', () => {
    expect(getTrendDirection(70.4, 70.1, true)).toBe('stable');
  });

  it('lower rate with higherIsBetter=false (inverse) returns up (improvement)', () => {
    expect(getTrendDirection(26, 30, false)).toBe('up');
  });

  it('higher rate with higherIsBetter=false returns down (worse)', () => {
    expect(getTrendDirection(32, 28, false)).toBe('down');
  });
});
