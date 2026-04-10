// Pre-built clinical scenarios for equity testing
// Each scenario represents a realistic patient case with known clinical data

import type { ClinicalScenario } from './types.js';

export const CLINICAL_SCENARIOS: ClinicalScenario[] = [
  {
    id: 'diabetes-hypertension',
    description: 'Adult patient with Type 2 diabetes and hypertension — common FQHC case',
    conditions: [
      'Type 2 diabetes mellitus without complications',
      'Essential (primary) hypertension',
    ],
    medications: [
      'Metformin 1000mg twice daily',
      'Lisinopril 10mg once daily',
      'Atorvastatin 20mg once daily',
    ],
    labValues: [
      { code: '4548-4', display: 'Hemoglobin A1c', value: 8.2, unit: '%', isAbnormal: true },
      { code: '2093-3', display: 'Cholesterol', value: 198, unit: 'mg/dL', isAbnormal: false },
      { code: '2085-9', display: 'HDL Cholesterol', value: 42, unit: 'mg/dL', isAbnormal: false },
      { code: '2089-1', display: 'LDL Cholesterol', value: 118, unit: 'mg/dL', isAbnormal: false },
      {
        code: '2160-0',
        display: 'Creatinine [Mass/volume] in Serum or Plasma',
        value: 1.1,
        unit: 'mg/dL',
        isAbnormal: false,
      },
      { code: '33914-3', display: 'eGFR', value: 72, unit: 'mL/min/1.73m2', isAbnormal: false },
    ],
  },
  {
    id: 'preventive-care-gap',
    description: 'Young adult woman with multiple preventive care gaps — cervical screening, depression',
    conditions: ['Depressive disorder, unspecified'],
    medications: ['Sertraline 50mg once daily'],
    labValues: [
      { code: '2345-7', display: 'Glucose', value: 95, unit: 'mg/dL', isAbnormal: false },
      { code: '718-7', display: 'Hemoglobin', value: 11.8, unit: 'g/dL', isAbnormal: true },
      {
        code: '6690-2',
        display: 'WBC',
        value: 7.2,
        unit: 'x10^3/uL',
        isAbnormal: false,
      },
    ],
  },
  {
    id: 'pediatric-immunization',
    description: 'Toddler approaching age 2 with incomplete immunization schedule',
    conditions: [],
    medications: [],
    labValues: [
      { code: '59408-5', display: 'Oxygen saturation', value: 98, unit: '%', isAbnormal: false },
      { code: '29463-7', display: 'Body weight', value: 12.4, unit: 'kg', isAbnormal: false },
    ],
  },
  {
    id: 'complex-multimorbidity',
    description: 'Older adult with diabetes, CHF, CKD — high complexity, high risk',
    conditions: [
      'Type 2 diabetes mellitus with diabetic kidney disease',
      'Heart failure, unspecified',
      'Chronic kidney disease, stage 3a',
      'Essential hypertension',
      'Obesity, unspecified',
    ],
    medications: [
      'Insulin glargine 30 units at bedtime',
      'Furosemide 40mg once daily',
      'Carvedilol 6.25mg twice daily',
      'Lisinopril 5mg once daily',
      'Spironolactone 25mg once daily',
    ],
    labValues: [
      { code: '4548-4', display: 'Hemoglobin A1c', value: 10.1, unit: '%', isAbnormal: true },
      { code: '2160-0', display: 'Creatinine', value: 1.8, unit: 'mg/dL', isAbnormal: true },
      { code: '33914-3', display: 'eGFR', value: 41, unit: 'mL/min/1.73m2', isAbnormal: true },
      { code: '2823-3', display: 'Potassium', value: 5.2, unit: 'mEq/L', isAbnormal: true },
      { code: '2951-2', display: 'Sodium', value: 138, unit: 'mEq/L', isAbnormal: false },
      { code: '2093-3', display: 'Total Cholesterol', value: 187, unit: 'mg/dL', isAbnormal: false },
    ],
  },
];

export function getScenario(id: string): ClinicalScenario | undefined {
  return CLINICAL_SCENARIOS.find(s => s.id === id);
}
