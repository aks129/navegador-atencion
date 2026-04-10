// Equity Audit Harness — type definitions
// Per Vestel-Magan JV Technical Build Plan, Phase 1

/** Patient language/literacy variant to test for equity disparities */
export type PatientVariant =
  | 'english-standard'
  | 'spanish-standard'
  | 'spanish-code-switch'
  | 'low-literacy-english'
  | 'low-literacy-spanish';

/** FHIR resource types used in synthetic bundles */
export type SyntheticResourceType =
  | 'Patient'
  | 'Condition'
  | 'MedicationRequest'
  | 'Observation'
  | 'Encounter'
  | 'Practitioner';

/** A minimal synthetic FHIR R4 resource (subset) */
export interface SyntheticResource {
  resourceType: SyntheticResourceType;
  id: string;
  [key: string]: unknown;
}

/** A complete synthetic FHIR Bundle with provenance */
export interface SyntheticBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  /** SHA-256 of the canonical JSON of entry resources (for reproducibility) */
  sha256: string;
  meta: {
    lastUpdated: string;
    source: 'equity-audit-harness';
    version: string;
  };
  entry: { resource: SyntheticResource }[];
  /** Harness metadata — not part of FHIR spec */
  _harness: HarnessMetadata;
}

export interface HarnessMetadata {
  variant: PatientVariant;
  scenarioId: string;
  seed: number;
  /** ISO timestamp when bundle was generated */
  generatedAt: string;
  /** Scenario description for human readers */
  description: string;
}

/** Clinical scenario for synthetic bundle generation */
export interface ClinicalScenario {
  id: string;
  description: string;
  conditions: string[];
  medications: string[];
  labValues: {
    code: string;
    display: string;
    value: number;
    unit: string;
    /** Flag as abnormal */
    isAbnormal: boolean;
  }[];
}

/** Result of running a single variant through the AI summarizer */
export interface HarnessRunResult {
  bundleId: string;
  variant: PatientVariant;
  scenarioId: string;
  /** SHA-256 of the input bundle (for reproducibility) */
  inputSha256: string;
  /** Output from the AI system being tested */
  output: string;
  /** Reading level detected via Flesch-Kincaid heuristic */
  detectedReadingLevel?: number;
  /** Word count of the output */
  wordCount: number;
  /** Whether the output is in the expected language */
  languageMatch: boolean;
  /** Latency in ms */
  latencyMs: number;
  /** Any error encountered */
  error?: string;
  timestamp: string;
}

/** Full harness run — one scenario × all variants */
export interface HarnessRun {
  id: string;
  scenarioId: string;
  /** ISO timestamp */
  startedAt: string;
  completedAt: string;
  results: HarnessRunResult[];
  /** Equity analysis derived from results */
  equityAnalysis: EquityAnalysis;
  /** Provenance block for reproducibility */
  provenance: ProvenanceBlock;
}

/** Equity disparity analysis across variants */
export interface EquityAnalysis {
  /** Average word count per variant — inequity signal if ES word count significantly lower than EN */
  wordCountByVariant: Record<PatientVariant, number>;
  /** Average reading level per variant */
  readingLevelByVariant: Record<PatientVariant, number | null>;
  /** Whether language matched expected per variant */
  languageMatchByVariant: Record<PatientVariant, boolean>;
  /** Average latency per variant */
  latencyByVariant: Record<PatientVariant, number>;
  /** Flags for disparities */
  flags: EquityFlag[];
}

export interface EquityFlag {
  type: 'word-count-disparity' | 'language-mismatch' | 'reading-level-too-high' | 'latency-disparity';
  severity: 'warning' | 'error';
  variant: PatientVariant;
  message: string;
  value: number;
  threshold: number;
}

/** SHA-256 provenance block for audit trail */
export interface ProvenanceBlock {
  /** SHA-256 of all input bundles */
  inputBundleHashes: Record<string, string>;
  /** Version of this harness */
  harnessVersion: string;
  /** Model/endpoint being tested */
  targetEndpoint: string;
  /** ISO timestamp */
  executedAt: string;
  /** Node.js version */
  nodeVersion: string;
}

/** CLI configuration */
export interface HarnessConfig {
  /** Endpoint URL to POST synthetic bundles to */
  targetEndpoint: string;
  /** Scenarios to run (default: all) */
  scenarioIds?: string[];
  /** Variants to run (default: all) */
  variants?: PatientVariant[];
  /** Output directory for run reports */
  outputDir?: string;
  /** API key for the target endpoint */
  apiKey?: string;
  /** Seed for reproducible random generation */
  seed?: number;
}
