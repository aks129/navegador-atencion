// Synthetic FHIR Bundle generator with language/literacy variant support
// Generates reproducible bundles using a seeded approach for equity testing

import { createHash } from 'node:crypto';
import type {
  PatientVariant,
  SyntheticBundle,
  SyntheticResource,
  ClinicalScenario,
  HarnessMetadata,
} from './types.js';

const HARNESS_VERSION = '0.1.0';

// Patient name pools per variant (realistic names for each demographic)
const NAMES: Record<PatientVariant, { given: string[]; family: string }> = {
  'english-standard': { given: ['James', 'Robert'], family: 'Wilson' },
  'spanish-standard': { given: ['Maria', 'Elena'], family: 'Gonzalez' },
  'spanish-code-switch': { given: ['Julio', 'César'], family: 'Ramírez-Torres' },
  'low-literacy-english': { given: ['Bobby', 'Ray'], family: 'Johnson' },
  'low-literacy-spanish': { given: ['Rosa', 'Luz'], family: 'Hernández' },
};

const LANG_CODE: Record<PatientVariant, string> = {
  'english-standard': 'en',
  'spanish-standard': 'es',
  'spanish-code-switch': 'es',
  'low-literacy-english': 'en',
  'low-literacy-spanish': 'es',
};

/** Simple deterministic ID from seed + index */
function makeId(prefix: string, seed: number, index: number): string {
  return `${prefix}-${seed.toString(16)}-${index.toString(16)}`;
}

/** Canonical JSON → SHA-256 hex */
function sha256(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export function generateSyntheticBundle(
  scenario: ClinicalScenario,
  variant: PatientVariant,
  seed: number = Date.now(),
): SyntheticBundle {
  const name = NAMES[variant];
  const lang = LANG_CODE[variant];
  const patientId = makeId('pat', seed, 1);

  const resources: SyntheticResource[] = [];

  // Patient resource
  const patient: SyntheticResource = {
    resourceType: 'Patient',
    id: patientId,
    name: [
      {
        use: 'official',
        given: name.given,
        family: name.family,
      },
    ],
    birthDate: '1968-04-15',
    gender: variant.includes('spanish') ? 'female' : 'male',
    communication: [
      {
        language: {
          coding: [{ system: 'urn:ietf:bcp:47', code: lang }],
        },
        preferred: true,
      },
    ],
  };
  resources.push(patient);

  // Conditions
  scenario.conditions.forEach((display, i) => {
    resources.push({
      resourceType: 'Condition',
      id: makeId('cond', seed, i + 1),
      subject: { reference: `Patient/${patientId}` },
      code: {
        coding: [{ system: 'http://snomed.info/sct', display }],
        text: display,
      },
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
          },
        ],
      },
      onsetDateTime: '2020-01-01',
    });
  });

  // Medications
  scenario.medications.forEach((display, i) => {
    resources.push({
      resourceType: 'MedicationRequest',
      id: makeId('med', seed, i + 1),
      subject: { reference: `Patient/${patientId}` },
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', display }],
        text: display,
      },
      dosageInstruction: [{ text: display }],
    });
  });

  // Lab values (Observations)
  scenario.labValues.forEach((lab, i) => {
    resources.push({
      resourceType: 'Observation',
      id: makeId('obs', seed, i + 1),
      subject: { reference: `Patient/${patientId}` },
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
          ],
        },
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: lab.code, display: lab.display }],
        text: lab.display,
      },
      valueQuantity: {
        value: lab.value,
        unit: lab.unit,
        system: 'http://unitsofmeasure.org',
      },
      interpretation: lab.isAbnormal
        ? [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: 'H',
                  display: 'High',
                },
              ],
            },
          ]
        : undefined,
      effectiveDateTime: new Date().toISOString().substring(0, 10),
    });
  });

  const entryList = resources.map(r => ({ resource: r }));
  const bundleId = makeId('bundle', seed, 0);

  const metadata: HarnessMetadata = {
    variant,
    scenarioId: scenario.id,
    seed,
    generatedAt: new Date().toISOString(),
    description: scenario.description,
  };

  return {
    resourceType: 'Bundle',
    id: bundleId,
    type: 'collection',
    sha256: sha256(entryList),
    meta: {
      lastUpdated: new Date().toISOString(),
      source: 'equity-audit-harness',
      version: HARNESS_VERSION,
    },
    entry: entryList,
    _harness: metadata,
  };
}

/** Generate all 5 variants for a single scenario */
export function generateVariantSet(
  scenario: ClinicalScenario,
  seed: number = Date.now(),
): SyntheticBundle[] {
  const variants: PatientVariant[] = [
    'english-standard',
    'spanish-standard',
    'spanish-code-switch',
    'low-literacy-english',
    'low-literacy-spanish',
  ];
  return variants.map(v => generateSyntheticBundle(scenario, v, seed));
}
