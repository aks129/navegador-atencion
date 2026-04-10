// UDS Quality Measure type definitions

export type MeasureId =
  | 'cms122-hba1c-poor-control'
  | 'cms165-hypertension-control'
  | 'cms124-cervical-cancer-screening'
  | 'cms2-depression-screening'
  | 'cms138-tobacco-cessation'
  | 'cms117-childhood-immunization';

export type MeasureStatus = 'met' | 'not-met' | 'excluded' | 'unknown';
export type PerformanceLevel = 'high' | 'medium' | 'low';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface MeasureDefinition {
  id: MeasureId;
  cmsId: string;
  shortName: string;
  fullName: string;
  description: string;
  /** Higher rate is better (e.g. screening rates). False for inverse measures (e.g. poor HbA1c control). */
  higherIsBetter: boolean;
  /** Numerator description */
  numeratorLabel: string;
  /** Denominator description */
  denominatorLabel: string;
  /** UDS Table 6B column reference */
  udsColumn?: string;
  /** HRSA national average for comparison (most recent UDS data) */
  nationalAverage?: number;
  /** Threshold for "high performance" (green) */
  greenThreshold: number;
  /** Threshold for "medium performance" (amber) */
  amberThreshold: number;
  /** Target for next reporting period */
  target: number;
}

export interface MonthlyDataPoint {
  /** YYYY-MM */
  month: string;
  rate: number;
  numerator: number;
  denominator: number;
}

export interface MeasureScore {
  measureId: MeasureId;
  /** Period this score covers */
  reportingPeriod: {
    start: string;
    end: string;
  };
  numerator: number;
  denominator: number;
  /** 0–100 */
  rate: number;
  performanceLevel: PerformanceLevel;
  trend: TrendDirection;
  trendDelta: number;
  /** Historical monthly rates for sparkline */
  history: MonthlyDataPoint[];
  lastUpdated: string;
}

export interface GapPatient {
  id: string;
  name: string;
  dob: string;
  /** ISO 639-1 language code */
  preferredLanguage: 'en' | 'es' | 'other';
  phone?: string;
  measures: {
    measureId: MeasureId;
    status: MeasureStatus;
    /** Why patient is not meeting measure */
    gapReason?: string;
    /** Date care was last attempted */
    lastCareDate?: string;
    /** Next recommended action */
    nextAction?: string;
  }[];
  assignedNavigator?: string;
  lastContactDate?: string;
  riskScore?: number;
}

export interface QualityReport {
  facilityName: string;
  reportingPeriod: {
    start: string;
    end: string;
  };
  scores: MeasureScore[];
  totalPatients: number;
  generatedAt: string;
  /** AI-generated narrative explaining the quality data */
  narrative?: {
    en: string;
    generatedAt: string;
    model: string;
  };
}

export interface NarrativeRequest {
  scores: MeasureScore[];
  definitions: MeasureDefinition[];
  facilityName: string;
  reportingPeriod: { start: string; end: string };
  totalPatients: number;
}
