import { describe, it, expect } from 'vitest';
import { generateSyntheticBundle, generateVariantSet } from './bundle-generator.js';
import { CLINICAL_SCENARIOS } from './scenarios.js';

const SCENARIO = CLINICAL_SCENARIOS[0]!;
const SEED = 12345;

describe('generateSyntheticBundle', () => {
  it('returns a valid FHIR Bundle structure', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    expect(bundle.resourceType).toBe('Bundle');
    expect(bundle.type).toBe('collection');
    expect(bundle.entry.length).toBeGreaterThan(0);
  });

  it('includes a Patient resource', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'spanish-standard', SEED);
    const patient = bundle.entry.find(e => e.resource.resourceType === 'Patient');
    expect(patient).toBeDefined();
  });

  it('generates Condition resources for each scenario condition', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    const conditions = bundle.entry.filter(e => e.resource.resourceType === 'Condition');
    expect(conditions.length).toBe(SCENARIO.conditions.length);
  });

  it('generates Observation resources for each lab value', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    const obs = bundle.entry.filter(e => e.resource.resourceType === 'Observation');
    expect(obs.length).toBe(SCENARIO.labValues.length);
  });

  it('attaches harness metadata with correct variant', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'low-literacy-spanish', SEED);
    expect(bundle._harness.variant).toBe('low-literacy-spanish');
    expect(bundle._harness.scenarioId).toBe(SCENARIO.id);
    expect(bundle._harness.seed).toBe(SEED);
  });

  it('produces a non-empty SHA-256 hash', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    expect(bundle.sha256).toHaveLength(64);
  });

  it('is reproducible — same seed produces same SHA-256', () => {
    const b1 = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    const b2 = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    expect(b1.sha256).toBe(b2.sha256);
  });

  it('different seeds produce different bundles', () => {
    const b1 = generateSyntheticBundle(SCENARIO, 'english-standard', SEED);
    const b2 = generateSyntheticBundle(SCENARIO, 'english-standard', SEED + 1);
    expect(b1.id).not.toBe(b2.id);
  });

  it('spanish variant sets preferred language to es', () => {
    const bundle = generateSyntheticBundle(SCENARIO, 'spanish-standard', SEED);
    const patient = bundle.entry.find(e => e.resource.resourceType === 'Patient')?.resource;
    const comm = (patient as Record<string, unknown>)['communication'] as {
      language: { coding: { code: string }[] };
    }[];
    expect(comm?.[0]?.language?.coding?.[0]?.code).toBe('es');
  });
});

describe('generateVariantSet', () => {
  it('generates 5 bundles — one per variant', () => {
    const bundles = generateVariantSet(SCENARIO, SEED);
    expect(bundles).toHaveLength(5);
  });

  it('each variant appears exactly once', () => {
    const bundles = generateVariantSet(SCENARIO, SEED);
    const variants = bundles.map(b => b._harness.variant);
    expect(variants).toContain('english-standard');
    expect(variants).toContain('spanish-standard');
    expect(variants).toContain('spanish-code-switch');
    expect(variants).toContain('low-literacy-english');
    expect(variants).toContain('low-literacy-spanish');
  });
});
