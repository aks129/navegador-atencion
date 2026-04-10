// 6 UDS quality measure definitions per HRSA UDS Table 6B (2023 specifications)

import type { MeasureDefinition, MeasureId } from './types.js';

export const MEASURE_DEFINITIONS: Record<MeasureId, MeasureDefinition> = {
  'cms122-hba1c-poor-control': {
    id: 'cms122-hba1c-poor-control',
    cmsId: 'CMS122v10',
    shortName: 'HbA1c Poor Control',
    fullName: 'Diabetes: Hemoglobin A1c (HbA1c) Poor Control (> 9%)',
    description:
      'Percentage of patients 18–75 years of age with diabetes whose most recent HbA1c level is greater than 9% (poor control). Lower rate is better.',
    higherIsBetter: false,
    numeratorLabel: 'Patients with HbA1c > 9% (poorly controlled)',
    denominatorLabel: 'Patients 18–75 with a diabetes diagnosis',
    udsColumn: '6B-1',
    nationalAverage: 28.5,
    // For inverse: green = low rate, amber = medium
    greenThreshold: 25,
    amberThreshold: 35,
    target: 22,
  },

  'cms165-hypertension-control': {
    id: 'cms165-hypertension-control',
    cmsId: 'CMS165v10',
    shortName: 'Hypertension Control',
    fullName: 'Controlling High Blood Pressure',
    description:
      'Percentage of patients 18–85 years of age who had a diagnosis of hypertension and whose blood pressure was adequately controlled (<140/90 mmHg) during the measurement period.',
    higherIsBetter: true,
    numeratorLabel: 'Patients with BP < 140/90 mmHg',
    denominatorLabel: 'Patients 18–85 with hypertension diagnosis',
    udsColumn: '6B-2',
    nationalAverage: 68.4,
    greenThreshold: 75,
    amberThreshold: 60,
    target: 78,
  },

  'cms124-cervical-cancer-screening': {
    id: 'cms124-cervical-cancer-screening',
    cmsId: 'CMS124v10',
    shortName: 'Cervical Cancer Screening',
    fullName: 'Cervical Cancer Screening',
    description:
      'Percentage of women 21–64 years of age who were screened for cervical cancer using either of the following criteria: women 21–64 who had cervical cytology performed within the last 3 years, or women 30–64 who had cervical high-risk HPV testing performed within the last 5 years.',
    higherIsBetter: true,
    numeratorLabel: 'Women with up-to-date cervical cancer screening',
    denominatorLabel: 'Women 21–64 years of age',
    udsColumn: '6B-3',
    nationalAverage: 64.2,
    greenThreshold: 70,
    amberThreshold: 55,
    target: 72,
  },

  'cms2-depression-screening': {
    id: 'cms2-depression-screening',
    cmsId: 'CMS2v11',
    shortName: 'Depression Screening',
    fullName: 'Preventive Care and Screening: Screening for Depression and Follow-Up Plan',
    description:
      'Percentage of patients aged 12 years and older screened for depression on the date of the encounter using an age-appropriate standardized depression screening tool AND if positive, a follow-up plan is documented on the date of the positive screen.',
    higherIsBetter: true,
    numeratorLabel: 'Patients screened for depression with follow-up plan if positive',
    denominatorLabel: 'Patients 12 years and older at any visit',
    udsColumn: '6B-4',
    nationalAverage: 72.8,
    greenThreshold: 78,
    amberThreshold: 65,
    target: 80,
  },

  'cms138-tobacco-cessation': {
    id: 'cms138-tobacco-cessation',
    cmsId: 'CMS138v10',
    shortName: 'Tobacco Cessation',
    fullName: 'Preventive Care and Screening: Tobacco Use: Screening and Cessation Intervention',
    description:
      'Three rates: (1) Percentage of patients screened for tobacco use, (2) Percentage of tobacco users who received cessation intervention, (3) Overall rate. Reports the overall rate.',
    higherIsBetter: true,
    numeratorLabel: 'Patients who received tobacco cessation screening and/or intervention',
    denominatorLabel: 'Patients 12 years and older',
    udsColumn: '6B-5',
    nationalAverage: 84.1,
    greenThreshold: 85,
    amberThreshold: 72,
    target: 87,
  },

  'cms117-childhood-immunization': {
    id: 'cms117-childhood-immunization',
    cmsId: 'CMS117v10',
    shortName: 'Childhood Immunization',
    fullName: 'Childhood Immunization Status',
    description:
      "Percentage of children 2 years of age who had four diphtheria, tetanus and acellular pertussis (DTaP); three polio (IPV); one measles, mumps and rubella (MMR); three haemophilus influenza type B (HiB); three hepatitis B (HepB); one chicken pox (VZV); four pneumococcal conjugate (PCV); one hepatitis A (HepA); two or three rotavirus (RV); and two influenza (flu) vaccines by their second birthday.",
    higherIsBetter: true,
    numeratorLabel: 'Children with all recommended immunizations by age 2',
    denominatorLabel: 'Children who turned 2 during the measurement period',
    udsColumn: '6B-6',
    nationalAverage: 51.3,
    greenThreshold: 60,
    amberThreshold: 45,
    target: 65,
  },
};

export const MEASURE_IDS: MeasureId[] = Object.keys(MEASURE_DEFINITIONS) as MeasureId[];

export function getMeasureDefinition(id: MeasureId): MeasureDefinition {
  return MEASURE_DEFINITIONS[id];
}

export function getPerformanceLevel(
  definition: MeasureDefinition,
  rate: number,
): 'high' | 'medium' | 'low' {
  if (definition.higherIsBetter) {
    if (rate >= definition.greenThreshold) return 'high';
    if (rate >= definition.amberThreshold) return 'medium';
    return 'low';
  } else {
    // Inverse: lower rate is better
    if (rate <= definition.greenThreshold) return 'high';
    if (rate <= definition.amberThreshold) return 'medium';
    return 'low';
  }
}

export function getTrendDirection(
  currentRate: number,
  previousRate: number,
  higherIsBetter: boolean,
): 'up' | 'down' | 'stable' {
  const delta = currentRate - previousRate;
  if (Math.abs(delta) < 1) return 'stable';
  if (higherIsBetter) return delta > 0 ? 'up' : 'down';
  // For inverse measures: lower rate = improvement = "up"
  return delta < 0 ? 'up' : 'down';
}
