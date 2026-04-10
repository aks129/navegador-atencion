// Realistic demo data for a typical FQHC (~2,400 active patients)
// Based on HRSA UDS national averages with slight underperformance (common for new FQHCs)

import type { GapPatient, MeasureScore, QualityReport } from './types.js';
import { getPerformanceLevel, getTrendDirection } from './measures.js';
import { MEASURE_DEFINITIONS } from './measures.js';

const NOW = new Date('2024-12-31');
const PERIOD_START = '2024-01-01';
const PERIOD_END = '2024-12-31';

function months(back: number): string {
  const d = new Date(NOW);
  d.setMonth(d.getMonth() - back);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const DEMO_SCORES: MeasureScore[] = [
  {
    measureId: 'cms122-hba1c-poor-control',
    reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
    numerator: 86,
    denominator: 298,
    rate: 28.9,
    performanceLevel: getPerformanceLevel(MEASURE_DEFINITIONS['cms122-hba1c-poor-control'], 28.9),
    trend: getTrendDirection(28.9, 31.4, false),
    trendDelta: -2.5,
    history: [
      { month: months(11), rate: 33.1, numerator: 96, denominator: 290 },
      { month: months(10), rate: 32.5, numerator: 94, denominator: 289 },
      { month: months(9), rate: 31.4, numerator: 92, denominator: 293 },
      { month: months(8), rate: 31.0, numerator: 91, denominator: 294 },
      { month: months(7), rate: 30.5, numerator: 90, denominator: 295 },
      { month: months(6), rate: 30.1, numerator: 89, denominator: 296 },
      { month: months(5), rate: 30.3, numerator: 89, denominator: 294 },
      { month: months(4), rate: 29.8, numerator: 88, denominator: 295 },
      { month: months(3), rate: 29.5, numerator: 87, denominator: 295 },
      { month: months(2), rate: 29.1, numerator: 86, denominator: 295 },
      { month: months(1), rate: 28.9, numerator: 86, denominator: 298 },
      { month: months(0), rate: 28.9, numerator: 86, denominator: 298 },
    ],
    lastUpdated: '2024-12-31T00:00:00Z',
  },

  {
    measureId: 'cms165-hypertension-control',
    reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
    numerator: 381,
    denominator: 547,
    rate: 69.7,
    performanceLevel: getPerformanceLevel(MEASURE_DEFINITIONS['cms165-hypertension-control'], 69.7),
    trend: getTrendDirection(69.7, 66.9, true),
    trendDelta: 2.8,
    history: [
      { month: months(11), rate: 66.9, numerator: 359, denominator: 537 },
      { month: months(10), rate: 67.0, numerator: 362, denominator: 540 },
      { month: months(9), rate: 67.4, numerator: 365, denominator: 542 },
      { month: months(8), rate: 67.8, numerator: 368, denominator: 543 },
      { month: months(7), rate: 68.1, numerator: 371, denominator: 545 },
      { month: months(6), rate: 68.3, numerator: 373, denominator: 546 },
      { month: months(5), rate: 68.5, numerator: 374, denominator: 546 },
      { month: months(4), rate: 68.6, numerator: 375, denominator: 547 },
      { month: months(3), rate: 68.8, numerator: 376, denominator: 547 },
      { month: months(2), rate: 69.1, numerator: 378, denominator: 547 },
      { month: months(1), rate: 69.5, numerator: 380, denominator: 547 },
      { month: months(0), rate: 69.7, numerator: 381, denominator: 547 },
    ],
    lastUpdated: '2024-12-31T00:00:00Z',
  },

  {
    measureId: 'cms124-cervical-cancer-screening',
    reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
    numerator: 298,
    denominator: 463,
    rate: 64.4,
    performanceLevel: getPerformanceLevel(
      MEASURE_DEFINITIONS['cms124-cervical-cancer-screening'],
      64.4,
    ),
    trend: getTrendDirection(64.4, 62.0, true),
    trendDelta: 2.4,
    history: [
      { month: months(11), rate: 62.0, numerator: 281, denominator: 453 },
      { month: months(10), rate: 62.2, numerator: 284, denominator: 456 },
      { month: months(9), rate: 62.5, numerator: 286, denominator: 457 },
      { month: months(8), rate: 62.8, numerator: 288, denominator: 458 },
      { month: months(7), rate: 63.0, numerator: 289, denominator: 459 },
      { month: months(6), rate: 63.2, numerator: 290, denominator: 459 },
      { month: months(5), rate: 63.5, numerator: 292, denominator: 460 },
      { month: months(4), rate: 63.7, numerator: 294, denominator: 461 },
      { month: months(3), rate: 63.9, numerator: 295, denominator: 462 },
      { month: months(2), rate: 64.0, numerator: 296, denominator: 462 },
      { month: months(1), rate: 64.2, numerator: 297, denominator: 462 },
      { month: months(0), rate: 64.4, numerator: 298, denominator: 463 },
    ],
    lastUpdated: '2024-12-31T00:00:00Z',
  },

  {
    measureId: 'cms2-depression-screening',
    reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
    numerator: 1520,
    denominator: 1918,
    rate: 79.2,
    performanceLevel: getPerformanceLevel(MEASURE_DEFINITIONS['cms2-depression-screening'], 79.2),
    trend: getTrendDirection(79.2, 74.6, true),
    trendDelta: 4.6,
    history: [
      { month: months(11), rate: 74.6, numerator: 1401, denominator: 1878 },
      { month: months(10), rate: 75.2, numerator: 1418, denominator: 1886 },
      { month: months(9), rate: 75.8, numerator: 1436, denominator: 1894 },
      { month: months(8), rate: 76.4, numerator: 1451, denominator: 1899 },
      { month: months(7), rate: 77.0, numerator: 1466, denominator: 1904 },
      { month: months(6), rate: 77.5, numerator: 1478, denominator: 1907 },
      { month: months(5), rate: 77.9, numerator: 1487, denominator: 1909 },
      { month: months(4), rate: 78.2, numerator: 1495, denominator: 1912 },
      { month: months(3), rate: 78.5, numerator: 1503, denominator: 1914 },
      { month: months(2), rate: 78.7, numerator: 1509, denominator: 1916 },
      { month: months(1), rate: 79.0, numerator: 1517, denominator: 1920 },
      { month: months(0), rate: 79.2, numerator: 1520, denominator: 1918 },
    ],
    lastUpdated: '2024-12-31T00:00:00Z',
  },

  {
    measureId: 'cms138-tobacco-cessation',
    reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
    numerator: 1721,
    denominator: 1980,
    rate: 86.9,
    performanceLevel: getPerformanceLevel(MEASURE_DEFINITIONS['cms138-tobacco-cessation'], 86.9),
    trend: getTrendDirection(86.9, 85.1, true),
    trendDelta: 1.8,
    history: [
      { month: months(11), rate: 85.1, numerator: 1672, denominator: 1965 },
      { month: months(10), rate: 85.3, numerator: 1676, denominator: 1965 },
      { month: months(9), rate: 85.5, numerator: 1682, denominator: 1968 },
      { month: months(8), rate: 85.7, numerator: 1688, denominator: 1970 },
      { month: months(7), rate: 86.0, numerator: 1696, denominator: 1972 },
      { month: months(6), rate: 86.1, numerator: 1699, denominator: 1973 },
      { month: months(5), rate: 86.2, numerator: 1702, denominator: 1975 },
      { month: months(4), rate: 86.3, numerator: 1706, denominator: 1977 },
      { month: months(3), rate: 86.5, numerator: 1711, denominator: 1978 },
      { month: months(2), rate: 86.6, numerator: 1714, denominator: 1979 },
      { month: months(1), rate: 86.8, numerator: 1718, denominator: 1979 },
      { month: months(0), rate: 86.9, numerator: 1721, denominator: 1980 },
    ],
    lastUpdated: '2024-12-31T00:00:00Z',
  },

  {
    measureId: 'cms117-childhood-immunization',
    reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
    numerator: 58,
    denominator: 113,
    rate: 51.3,
    performanceLevel: getPerformanceLevel(
      MEASURE_DEFINITIONS['cms117-childhood-immunization'],
      51.3,
    ),
    trend: getTrendDirection(51.3, 48.7, true),
    trendDelta: 2.6,
    history: [
      { month: months(11), rate: 48.7, numerator: 55, denominator: 113 },
      { month: months(10), rate: 49.0, numerator: 55, denominator: 112 },
      { month: months(9), rate: 49.1, numerator: 55, denominator: 112 },
      { month: months(8), rate: 49.5, numerator: 56, denominator: 113 },
      { month: months(7), rate: 49.6, numerator: 56, denominator: 113 },
      { month: months(6), rate: 50.0, numerator: 56, denominator: 112 },
      { month: months(5), rate: 50.0, numerator: 57, denominator: 114 },
      { month: months(4), rate: 50.4, numerator: 57, denominator: 113 },
      { month: months(3), rate: 50.9, numerator: 57, denominator: 112 },
      { month: months(2), rate: 51.0, numerator: 57, denominator: 112 },
      { month: months(1), rate: 51.2, numerator: 58, denominator: 113 },
      { month: months(0), rate: 51.3, numerator: 58, denominator: 113 },
    ],
    lastUpdated: '2024-12-31T00:00:00Z',
  },
];

export const DEMO_GAP_PATIENTS: GapPatient[] = [
  {
    id: 'pt-001',
    name: 'Maria Gonzalez',
    dob: '1968-03-15',
    preferredLanguage: 'es',
    phone: '(555) 234-5678',
    lastContactDate: '2024-10-12',
    riskScore: 87,
    measures: [
      {
        measureId: 'cms122-hba1c-poor-control',
        status: 'not-met',
        gapReason: 'Last HbA1c: 10.2% (2024-09-15)',
        nextAction: 'Schedule endocrinology referral; reinforce medication adherence',
      },
      {
        measureId: 'cms165-hypertension-control',
        status: 'not-met',
        gapReason: 'Last BP: 148/94 (2024-11-03)',
        nextAction: 'Medication adjustment — contact Dr. Patel',
      },
    ],
  },
  {
    id: 'pt-002',
    name: 'James Washington',
    dob: '1975-07-22',
    preferredLanguage: 'en',
    phone: '(555) 345-6789',
    lastContactDate: '2024-08-30',
    riskScore: 74,
    measures: [
      {
        measureId: 'cms165-hypertension-control',
        status: 'not-met',
        gapReason: 'Last BP: 156/98 (2024-08-30). No follow-up since.',
        nextAction: 'Outreach call — missed 2 appointments',
      },
      {
        measureId: 'cms138-tobacco-cessation',
        status: 'not-met',
        gapReason: 'Active smoker, no cessation counseling documented this year',
        nextAction: 'Provide NRT resources at next visit; warm referral to quit line',
      },
    ],
  },
  {
    id: 'pt-003',
    name: 'Anh Nguyen',
    dob: '1989-11-08',
    preferredLanguage: 'other',
    phone: '(555) 456-7890',
    lastContactDate: '2024-07-14',
    riskScore: 62,
    measures: [
      {
        measureId: 'cms124-cervical-cancer-screening',
        status: 'not-met',
        gapReason: 'Last Pap smear: 2021-04 (overdue)',
        nextAction: 'Send reminder letter + SMS; offer interpreter for Vietnamese',
      },
    ],
  },
  {
    id: 'pt-004',
    name: 'Roberto Esparza',
    dob: '1961-05-30',
    preferredLanguage: 'es',
    phone: '(555) 567-8901',
    lastContactDate: '2024-09-20',
    riskScore: 91,
    measures: [
      {
        measureId: 'cms122-hba1c-poor-control',
        status: 'not-met',
        gapReason: 'HbA1c: 11.4% (2024-09-20). Insulin non-adherent.',
        nextAction: 'Spanish-language diabetes education; CHW visit',
      },
      {
        measureId: 'cms165-hypertension-control',
        status: 'not-met',
        gapReason: 'Average BP: 151/96 over last 3 readings',
        nextAction: 'Telehealth visit for medication titration',
      },
      {
        measureId: 'cms2-depression-screening',
        status: 'not-met',
        gapReason: 'PHQ-9 not completed in 2024',
        nextAction: 'Administer PHQ-9 at next visit',
      },
    ],
  },
  {
    id: 'pt-005',
    name: 'Sharon Delacroix',
    dob: '1995-02-18',
    preferredLanguage: 'en',
    phone: '(555) 678-9012',
    lastContactDate: '2024-11-05',
    riskScore: 55,
    measures: [
      {
        measureId: 'cms124-cervical-cancer-screening',
        status: 'not-met',
        gapReason: 'No cervical cancer screening on file',
        nextAction: 'Schedule well-woman exam',
      },
      {
        measureId: 'cms2-depression-screening',
        status: 'not-met',
        gapReason: 'PHQ-9 overdue (last done 2022)',
        nextAction: 'Screen at next visit; patient reported recent stressors',
      },
    ],
  },
  {
    id: 'pt-006',
    name: 'Destiny Johnson',
    dob: '2022-06-10',
    preferredLanguage: 'en',
    phone: '(555) 789-0123',
    lastContactDate: '2024-04-22',
    riskScore: 68,
    measures: [
      {
        measureId: 'cms117-childhood-immunization',
        status: 'not-met',
        gapReason: 'Missing: 2nd influenza, 3rd HepB, 4th PCV',
        nextAction: 'Outreach to mother (Carmen Johnson); offer Saturday clinic',
      },
    ],
  },
  {
    id: 'pt-007',
    name: 'Carlos Medina Ruiz',
    dob: '1953-09-03',
    preferredLanguage: 'es',
    phone: '(555) 890-1234',
    lastContactDate: '2024-06-11',
    riskScore: 79,
    measures: [
      {
        measureId: 'cms165-hypertension-control',
        status: 'not-met',
        gapReason: 'BP 144/91 at last visit. Patient ran out of lisinopril.',
        nextAction: '90-day supply sent to pharmacy; follow-up call in 2 weeks',
      },
      {
        measureId: 'cms138-tobacco-cessation',
        status: 'not-met',
        gapReason: 'Current smoker. Declined counseling at last visit.',
        nextAction: 'Brief motivational interviewing at next encounter',
      },
    ],
  },
  {
    id: 'pt-008',
    name: 'Linda Park',
    dob: '1978-12-25',
    preferredLanguage: 'en',
    phone: '(555) 901-2345',
    lastContactDate: '2024-10-30',
    riskScore: 48,
    measures: [
      {
        measureId: 'cms124-cervical-cancer-screening',
        status: 'not-met',
        gapReason: 'HPV co-test due (last test 2019)',
        nextAction: 'Patient prefers telehealth pre-visit; order lab order in advance',
      },
    ],
  },
];

export const DEMO_REPORT: QualityReport = {
  facilityName: 'Community Health Center — Riverside',
  reportingPeriod: { start: PERIOD_START, end: PERIOD_END },
  scores: DEMO_SCORES,
  totalPatients: 2418,
  generatedAt: '2024-12-31T12:00:00Z',
};
