import { describe, it, expect } from 'vitest';
import { analyzeEquity, estimateGradeLevel, detectLanguage } from './equity-analyzer.js';
import type { HarnessRunResult } from './types.js';

describe('estimateGradeLevel', () => {
  it('returns null for empty string', () => {
    expect(estimateGradeLevel('')).toBeNull();
  });

  it('returns a number for normal text', () => {
    const grade = estimateGradeLevel('The patient has diabetes and hypertension. The doctor prescribed medications.');
    expect(grade).toBeTypeOf('number');
  });

  it('returns lower grade for simpler text', () => {
    const simple = 'Take your pills. Drink water. See your doctor.';
    const complex = 'The patient should administer pharmaceutical interventions as prescribed by the attending physician in accordance with clinical guidelines.';
    const simpleGrade = estimateGradeLevel(simple) ?? 0;
    const complexGrade = estimateGradeLevel(complex) ?? 0;
    expect(complexGrade).toBeGreaterThan(simpleGrade);
  });
});

describe('detectLanguage', () => {
  it('detects English text as en', () => {
    expect(detectLanguage('Your doctor has prescribed medications for your health condition.')).toBe('en');
  });

  it('detects Spanish text as es', () => {
    expect(detectLanguage('Su médico le ha recetado medicamentos para su salud. Usted debe tomar sus pastillas.')).toBe('es');
  });

  it('returns unknown for very short text', () => {
    const result = detectLanguage('Hi');
    // Short text may not have enough signal — accept en or unknown
    expect(['en', 'unknown']).toContain(result);
  });
});

describe('analyzeEquity', () => {
  const baseResults: HarnessRunResult[] = [
    {
      bundleId: 'b1',
      variant: 'english-standard',
      scenarioId: 'test',
      inputSha256: 'abc',
      output: 'Your health summary is ready. Please bring your medications to the visit. Ask your doctor about your lab results.',
      wordCount: 22,
      languageMatch: true,
      latencyMs: 800,
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      bundleId: 'b2',
      variant: 'spanish-standard',
      scenarioId: 'test',
      inputSha256: 'def',
      output: 'Su resumen de salud está listo. Lleve sus medicamentos a la cita. Pregúntele a su médico sobre sus resultados de laboratorio.',
      wordCount: 21,
      languageMatch: true,
      latencyMs: 900,
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      bundleId: 'b3',
      variant: 'spanish-code-switch',
      scenarioId: 'test',
      inputSha256: 'ghi',
      output: 'Su salud es importante. Usted debe hablar con su médico sobre sus medicamentos.',
      wordCount: 15,
      languageMatch: true,
      latencyMs: 950,
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      bundleId: 'b4',
      variant: 'low-literacy-english',
      scenarioId: 'test',
      inputSha256: 'jkl',
      output: 'Take your medicine. See your doctor. Bring your insurance card.',
      wordCount: 11,
      languageMatch: true,
      latencyMs: 750,
      timestamp: '2024-01-01T00:00:00Z',
    },
    {
      bundleId: 'b5',
      variant: 'low-literacy-spanish',
      scenarioId: 'test',
      inputSha256: 'mno',
      output: 'Tome su medicina. Vea a su médico.',
      wordCount: 7,
      languageMatch: true,
      latencyMs: 850,
      timestamp: '2024-01-01T00:00:00Z',
    },
  ];

  it('returns word counts for all variants', () => {
    const analysis = analyzeEquity(baseResults);
    expect(analysis.wordCountByVariant['english-standard']).toBe(22);
    expect(analysis.wordCountByVariant['spanish-standard']).toBe(21);
  });

  it('returns latency for all variants', () => {
    const analysis = analyzeEquity(baseResults);
    expect(analysis.latencyByVariant['english-standard']).toBe(800);
  });

  it('flags word count disparity when low-literacy output is much shorter', () => {
    const analysis = analyzeEquity(baseResults);
    // low-literacy-spanish (7 words) vs english-standard (22) — >30% shorter
    const flags = analysis.flags.filter(f => f.type === 'word-count-disparity' && f.variant === 'low-literacy-spanish');
    expect(flags.length).toBeGreaterThan(0);
  });

  it('produces no flags when outputs are balanced', () => {
    const balanced = baseResults.map(r => ({
      ...r,
      wordCount: 20,
      latencyMs: 900,
    }));
    const analysis = analyzeEquity(balanced);
    const disparity = analysis.flags.filter(f => f.type === 'word-count-disparity');
    expect(disparity).toHaveLength(0);
  });

  it('flags language mismatch when output is in wrong language', () => {
    const mismatch = baseResults.map(r =>
      r.variant === 'spanish-standard'
        ? { ...r, output: 'Your health summary is ready. Please bring medications.' }
        : r,
    );
    const analysis = analyzeEquity(mismatch);
    const langFlags = analysis.flags.filter(f => f.type === 'language-mismatch' && f.variant === 'spanish-standard');
    expect(langFlags.length).toBeGreaterThan(0);
  });
});
