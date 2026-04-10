// Equity analysis — detects disparities across language/literacy variants

import type {
  HarnessRunResult,
  EquityAnalysis,
  EquityFlag,
  PatientVariant,
} from './types.js';

/** Heuristic Flesch-Kincaid Reading Ease → grade level approximation */
function estimateGradeLevel(text: string): number | null {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  if (sentences === 0 || wordCount === 0) return null;

  // Count syllables heuristically (vowel group count)
  const syllables = words.reduce((acc, word) => {
    const groups = word.toLowerCase().match(/[aeiou]+/g);
    return acc + Math.max(1, groups?.length ?? 1);
  }, 0);

  const avgSentenceLength = wordCount / sentences;
  const avgSyllablesPerWord = syllables / wordCount;

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/** Detect output language via Spanish word ratio heuristic */
function detectLanguage(text: string): 'en' | 'es' | 'unknown' {
  const spanishWords = [
    'de', 'la', 'el', 'en', 'es', 'los', 'las', 'su', 'sus', 'que',
    'para', 'con', 'por', 'una', 'un', 'del', 'al', 'se', 'le', 'me',
    'su', 'usted', 'médico', 'salud', 'pregunta', 'medicamento', 'traer',
    'próxima', 'cita', 'visita', 'doctor',
  ];
  const words = text.toLowerCase().split(/\s+/);
  const spanishCount = words.filter(w => spanishWords.includes(w)).length;
  const ratio = spanishCount / Math.max(1, words.length);
  if (ratio > 0.08) return 'es';
  if (ratio < 0.02) return 'en';
  return 'unknown';
}

const EXPECTED_LANGUAGE: Record<PatientVariant, 'en' | 'es'> = {
  'english-standard': 'en',
  'spanish-standard': 'es',
  'spanish-code-switch': 'es',
  'low-literacy-english': 'en',
  'low-literacy-spanish': 'es',
};

const TARGET_READING_LEVEL: Record<PatientVariant, number> = {
  'english-standard': 8,
  'spanish-standard': 6,
  'spanish-code-switch': 6,
  'low-literacy-english': 6,
  'low-literacy-spanish': 5,
};

const READING_LEVEL_TOLERANCE = 2;
const WORD_COUNT_DISPARITY_THRESHOLD = 0.3; // 30% fewer words = flag
const LATENCY_DISPARITY_THRESHOLD = 2000; // 2s difference = flag

export function analyzeEquity(results: HarnessRunResult[]): EquityAnalysis {
  const wordCountByVariant = {} as Record<PatientVariant, number>;
  const readingLevelByVariant = {} as Record<PatientVariant, number | null>;
  const languageMatchByVariant = {} as Record<PatientVariant, boolean>;
  const latencyByVariant = {} as Record<PatientVariant, number>;

  for (const result of results) {
    const variant = result.variant;
    const gradeLevel = result.output ? estimateGradeLevel(result.output) : null;
    const detectedLang = result.output ? detectLanguage(result.output) : 'unknown';
    const expectedLang = EXPECTED_LANGUAGE[variant];

    wordCountByVariant[variant] = result.wordCount;
    readingLevelByVariant[variant] = gradeLevel;
    languageMatchByVariant[variant] = detectedLang === expectedLang || detectedLang === 'unknown';
    latencyByVariant[variant] = result.latencyMs;
  }

  const flags: EquityFlag[] = [];

  // Check word count disparity: compare each variant vs english-standard
  const enWordCount = wordCountByVariant['english-standard'] ?? 0;
  for (const result of results) {
    const v = result.variant;
    if (v === 'english-standard') continue;
    const count = wordCountByVariant[v] ?? 0;
    if (enWordCount > 0 && count < enWordCount * (1 - WORD_COUNT_DISPARITY_THRESHOLD)) {
      flags.push({
        type: 'word-count-disparity',
        severity: 'warning',
        variant: v,
        message: `Output word count for "${v}" is ${count} vs ${enWordCount} for english-standard — ${Math.round((1 - count / enWordCount) * 100)}% shorter`,
        value: count,
        threshold: enWordCount * (1 - WORD_COUNT_DISPARITY_THRESHOLD),
      });
    }
  }

  // Check language match
  for (const result of results) {
    const v = result.variant;
    if (!languageMatchByVariant[v]) {
      flags.push({
        type: 'language-mismatch',
        severity: 'error',
        variant: v,
        message: `Output for "${v}" does not appear to be in the expected language (${EXPECTED_LANGUAGE[v]})`,
        value: 0,
        threshold: 1,
      });
    }
  }

  // Check reading level
  for (const result of results) {
    const v = result.variant;
    const grade = readingLevelByVariant[v];
    const target = TARGET_READING_LEVEL[v];
    if (grade !== null && grade > target + READING_LEVEL_TOLERANCE) {
      flags.push({
        type: 'reading-level-too-high',
        severity: 'warning',
        variant: v,
        message: `Detected reading level ${grade} for "${v}" exceeds target of ${target} (tolerance: ±${READING_LEVEL_TOLERANCE})`,
        value: grade,
        threshold: target + READING_LEVEL_TOLERANCE,
      });
    }
  }

  // Check latency disparity
  const enLatency = latencyByVariant['english-standard'] ?? 0;
  for (const result of results) {
    const v = result.variant;
    if (v === 'english-standard') continue;
    const latency = latencyByVariant[v] ?? 0;
    if (latency - enLatency > LATENCY_DISPARITY_THRESHOLD) {
      flags.push({
        type: 'latency-disparity',
        severity: 'warning',
        variant: v,
        message: `Latency for "${v}" is ${latency}ms vs ${enLatency}ms for english-standard — ${latency - enLatency}ms above threshold`,
        value: latency,
        threshold: enLatency + LATENCY_DISPARITY_THRESHOLD,
      });
    }
  }

  return {
    wordCountByVariant,
    readingLevelByVariant,
    languageMatchByVariant,
    latencyByVariant,
    flags,
  };
}

export { estimateGradeLevel, detectLanguage };
