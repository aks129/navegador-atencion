import { describe, it, expect, beforeEach } from 'vitest'
import {
  computeReviewItems,
  analyzeLabs,
  analyzeMedications,
  analyzeCareGaps,
  calculateAge,
  CARE_GAP_RULES,
  MEDICATION_INTERACTIONS
} from '../reviewItemsAnalyzer'
import type { ResourceSelectionResult, ProcessedLabValue, ProcessedMedication } from '@plumly/fhir-utils'

// Mock data helpers
const createMockLabValue = (overrides: Partial<ProcessedLabValue> = {}): ProcessedLabValue => ({
  display: 'Test Lab',
  loincCode: '1234-5',
  value: '100',
  normalizedValue: 100,
  unit: 'mg/dL',
  normalizedUnit: 'mg/dL',
  isAbnormal: false,
  date: '2024-01-01',
  relevanceScore: 0.8,
  source: {
    id: 'lab-1',
    reference: 'Observation/lab-1'
  },
  ...overrides
})

const createMockMedication = (overrides: Partial<ProcessedMedication> = {}): ProcessedMedication => ({
  name: 'Test Medication',
  status: 'active',
  isActive: true,
  dosage: '10 mg daily',
  frequency: 'daily',
  route: 'oral',
  authoredDate: '2024-01-01',
  rxNormCode: '12345',
  relevanceScore: 0.8,
  source: {
    id: 'med-1',
    reference: 'MedicationRequest/med-1'
  },
  ...overrides
})

const createMockSelection = (overrides: Partial<ResourceSelectionResult> = {}): ResourceSelectionResult => ({
  patient: {
    resourceType: 'Patient',
    name: [{ given: ['John'], family: 'Doe' }],
    gender: 'male',
    birthDate: '1980-01-01',
    id: 'patient-1'
  },
  labValues: [],
  medications: [],
  conditions: [],
  encounters: [],
  processingStats: {
    totalObservations: 0,
    totalMedications: 0,
    totalConditions: 0,
    selectedLabValues: 0,
    activeMedications: 0,
    chronicConditions: 0,
    processingTime: 100
  },
  ...overrides
})

describe('reviewItemsAnalyzer', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = '1980-06-15'
      const age = calculateAge(birthDate)

      // Should be around 44 years old (as of 2024)
      expect(age).toBeGreaterThanOrEqual(43)
      expect(age).toBeLessThanOrEqual(45)
    })

    it('should handle edge cases around birthdays', () => {
      // Test with today's date
      const today = new Date()
      const birthDateThisYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      expect(calculateAge(birthDateThisYear)).toBe(0)
    })
  })

  describe('analyzeLabs', () => {
    it('should identify abnormal lab values', () => {
      const labs = [
        createMockLabValue({
          display: 'HbA1c',
          loincCode: '4548-4',
          value: '12.5',
          normalizedValue: 12.5,
          unit: '%',
          isAbnormal: true,
          referenceRange: { low: 4.0, high: 6.0 },
          date: '2024-01-15'
        })
      ]

      const items = analyzeLabs(labs)

      expect(items).toHaveLength(1)
      expect(items[0].type).toBe('lab-abnormal')
      expect(items[0].severity).toBe('medium')
      expect(items[0].title).toBe('Abnormal HbA1c')
      expect(items[0].description).toContain('12.5 %')
      expect(items[0].description).toContain('4-6')
      expect(items[0].chartLink?.tab).toBe('lab-trends')
      expect(items[0].chartLink?.code).toBe('4548-4')
      expect(items[0].actionRequired).toBe(true)
    })

    it('should detect significant lab value deltas', () => {
      const labs = [
        createMockLabValue({
          display: 'Glucose',
          loincCode: '2345-7',
          value: '100',
          normalizedValue: 100,
          date: '2024-01-01',
          source: { id: 'lab-1', reference: 'Observation/lab-1' }
        }),
        createMockLabValue({
          display: 'Glucose',
          loincCode: '2345-7',
          value: '200',
          normalizedValue: 200,
          date: '2024-01-15',
          source: { id: 'lab-2', reference: 'Observation/lab-2' }
        })
      ]

      const items = analyzeLabs(labs)

      expect(items).toHaveLength(1)
      expect(items[0].type).toBe('lab-delta')
      expect(items[0].severity).toBe('high') // >50% change
      expect(items[0].title).toBe('Significant Glucose Change')
      expect(items[0].description).toContain('increased 100.0%')
      expect(items[0].actionRequired).toBe(true)
    })

    it('should handle labs without reference ranges gracefully', () => {
      const labs = [
        createMockLabValue({
          display: 'Custom Lab',
          isAbnormal: true,
          referenceRange: undefined
        })
      ]

      const items = analyzeLabs(labs)

      // Should not create abnormal item without reference range
      expect(items).toHaveLength(0)
    })

    it('should ignore small lab value changes', () => {
      const labs = [
        createMockLabValue({
          loincCode: '1234-5',
          normalizedValue: 100,
          date: '2024-01-01'
        }),
        createMockLabValue({
          loincCode: '1234-5',
          normalizedValue: 105, // Only 5% change
          date: '2024-01-15'
        })
      ]

      const items = analyzeLabs(labs)

      expect(items).toHaveLength(0) // Should not flag <30% changes
    })
  })

  describe('analyzeMedications', () => {
    it('should detect known medication interactions', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10) // 10 days ago, won't trigger adherence
      const medications = [
        createMockMedication({
          name: 'Aspirin',
          rxNormCode: '1191',
          authoredDate: recentDate.toISOString(),
          source: { id: 'med-1', reference: 'MedicationRequest/med-1' }
        }),
        createMockMedication({
          name: 'Aspirin 325mg',
          rxNormCode: '1191', // Same RxNorm = duplicate
          authoredDate: recentDate.toISOString(),
          source: { id: 'med-2', reference: 'MedicationRequest/med-2' }
        })
      ]

      const items = analyzeMedications(medications)

      expect(items).toHaveLength(2) // One interaction + one duplicate

      const duplicate = items.find(item => item.title === 'Duplicate Medication')
      expect(duplicate).toBeDefined()
      expect(duplicate?.type).toBe('med-interaction')
      expect(duplicate?.description).toContain('Multiple prescriptions for Aspirin')
    })

    it('should flag potential adherence issues', () => {
      const oldMedDate = new Date()
      oldMedDate.setDate(oldMedDate.getDate() - 100) // 100 days ago

      const medications = [
        createMockMedication({
          name: 'Long-term Medication',
          authoredDate: oldMedDate.toISOString(),
          isActive: true
        })
      ]

      const items = analyzeMedications(medications)

      expect(items).toHaveLength(1)
      expect(items[0].type).toBe('med-adherence')
      expect(items[0].severity).toBe('low')
      expect(items[0].title).toBe('Long-term Active Medication')
      expect(items[0].description).toContain('100 days')
      expect(items[0].actionRequired).toBe(false)
    })

    it('should detect complex medication interactions', () => {
      const medications = [
        createMockMedication({
          name: 'Metformin',
          rxNormCode: '6809',
          source: { id: 'met-1', reference: 'MedicationRequest/met-1' }
        }),
        createMockMedication({
          name: 'Insulin',
          rxNormCode: '4821',
          source: { id: 'ins-1', reference: 'MedicationRequest/ins-1' }
        })
      ]

      const items = analyzeMedications(medications)

      const interaction = items.find(item =>
        item.description.includes('Metformin and insulin')
      )
      expect(interaction).toBeDefined()
      expect(interaction?.severity).toBe('low')
      expect(interaction?.details).toContain('Monitor blood glucose')
    })

    it('should ignore inactive medications for interactions', () => {
      const medications = [
        createMockMedication({
          name: 'Aspirin',
          rxNormCode: '1191',
          isActive: false,
          status: 'completed'
        }),
        createMockMedication({
          name: 'Aspirin 325mg',
          rxNormCode: '1191',
          isActive: true
        })
      ]

      const items = analyzeMedications(medications)

      // Should not detect interaction with inactive medication
      expect(items.filter(item => item.type === 'med-interaction')).toHaveLength(0)
    })
  })

  describe('analyzeCareGaps', () => {
    it('should identify mammography screening gap for eligible women', () => {
      const selection = createMockSelection({
        patient: {
          resourceType: 'Patient',
          name: [{ given: ['Jane'], family: 'Doe' }],
          gender: 'female',
          birthDate: '1970-01-01', // 54 years old
          id: 'patient-1'
        },
        labValues: [] // No mammograms
      })

      const items = analyzeCareGaps(selection)

      const mammographyGap = items.find(item => item.id === 'care-gap-mammography-screening')
      expect(mammographyGap).toBeDefined()
      expect(mammographyGap?.type).toBe('care-gap')
      expect(mammographyGap?.severity).toBe('medium')
      expect(mammographyGap?.title).toBe('Care Gap: Mammography Screening')
      expect(mammographyGap?.actionRequired).toBe(true)
    })

    it('should not flag mammography for men or ineligible age groups', () => {
      const selection = createMockSelection({
        patient: {
          resourceType: 'Patient',
          name: [{ given: ['John'], family: 'Doe' }],
          gender: 'male',
          birthDate: '1970-01-01',
          id: 'patient-1'
        }
      })

      const items = analyzeCareGaps(selection)

      const mammographyGap = items.find(item => item.id === 'care-gap-mammography-screening')
      expect(mammographyGap).toBeUndefined()
    })

    it('should identify HbA1c monitoring gap for diabetic patients', () => {
      const oldDate = new Date()
      oldDate.setMonth(oldDate.getMonth() - 8) // 8 months ago

      const selection = createMockSelection({
        conditions: [{
          name: 'Type 2 Diabetes Mellitus',
          clinicalStatus: 'active',
          isActive: true,
          isChronic: true,
          code: 'E11',
          id: 'condition-1',
          relevanceScore: 0.9,
          source: { id: 'cond-1' }
        }],
        labValues: [
          createMockLabValue({
            display: 'HbA1c',
            loincCode: '4548-4',
            date: oldDate.toISOString() // Too old
          })
        ]
      })

      const items = analyzeCareGaps(selection)

      const hba1cGap = items.find(item => item.id === 'care-gap-hba1c-diabetic')
      expect(hba1cGap).toBeDefined()
      expect(hba1cGap?.title).toBe('Care Gap: HbA1c Monitoring for Diabetes')
      expect(hba1cGap?.details).toBe('Order HbA1c test for diabetes monitoring')
    })

    it('should not flag HbA1c gap for non-diabetic patients', () => {
      const selection = createMockSelection({
        conditions: [], // No diabetes
        labValues: []
      })

      const items = analyzeCareGaps(selection)

      const hba1cGap = items.find(item => item.id === 'care-gap-hba1c-diabetic')
      expect(hba1cGap).toBeUndefined()
    })

    it('should identify colonoscopy screening gap for eligible adults', () => {
      const selection = createMockSelection({
        patient: {
          resourceType: 'Patient',
          name: [{ given: ['John'], family: 'Doe' }],
          gender: 'male',
          birthDate: '1970-01-01', // 54 years old
          id: 'patient-1'
        },
        labValues: [] // No colonoscopies
      })

      const items = analyzeCareGaps(selection)

      const colonoscopyGap = items.find(item => item.id === 'care-gap-colonoscopy-screening')
      expect(colonoscopyGap).toBeDefined()
      expect(colonoscopyGap?.title).toBe('Care Gap: Colorectal Cancer Screening')
    })
  })

  describe('computeReviewItems', () => {
    it('should combine all analysis types and sort by severity', () => {
      const selection = createMockSelection({
        patient: {
          resourceType: 'Patient',
          name: [{ given: ['Jane'], family: 'Doe' }],
          gender: 'female',
          birthDate: '1970-01-01',
          id: 'patient-1'
        },
        labValues: [
          createMockLabValue({
            display: 'HbA1c',
            loincCode: '4548-4',
            value: '12.0',
            isAbnormal: true,
            referenceRange: { low: 4.0, high: 6.0 },
            date: '2024-01-01'
          })
        ],
        medications: [
          createMockMedication({
            name: 'Aspirin',
            rxNormCode: '1191',
            source: { id: 'med-1', reference: 'MedicationRequest/med-1' }
          }),
          createMockMedication({
            name: 'Aspirin 325mg',
            rxNormCode: '1191',
            source: { id: 'med-2', reference: 'MedicationRequest/med-2' }
          })
        ],
        conditions: []
      })

      const items = computeReviewItems(selection)

      expect(items.length).toBeGreaterThan(0)

      // Should have lab abnormal item
      expect(items.some(item => item.type === 'lab-abnormal')).toBe(true)

      // Should have medication interaction
      expect(items.some(item => item.type === 'med-interaction')).toBe(true)

      // Should have care gaps (mammography)
      expect(items.some(item => item.type === 'care-gap')).toBe(true)

      // Should be sorted by severity (high -> medium -> low)
      for (let i = 1; i < items.length; i++) {
        const severityOrder = { high: 0, medium: 1, low: 2 }
        expect(severityOrder[items[i-1].severity]).toBeLessThanOrEqual(severityOrder[items[i].severity])
      }
    })

    it('should return empty array for null selection', () => {
      const items = computeReviewItems(null as any)
      expect(items).toEqual([])
    })

    it('should handle selection without patient data', () => {
      const selection = createMockSelection({
        patient: null as any
      })

      const items = computeReviewItems(selection)

      // Should still analyze labs and medications, but no care gaps
      const careGaps = items.filter(item => item.type === 'care-gap')
      expect(careGaps).toHaveLength(0)
    })
  })

  describe('CARE_GAP_RULES', () => {
    it('should have valid rule definitions', () => {
      CARE_GAP_RULES.forEach(rule => {
        expect(rule.id).toBeDefined()
        expect(rule.name).toBeDefined()
        expect(rule.description).toBeDefined()
        expect(typeof rule.applies).toBe('function')
        expect(typeof rule.checkGap).toBe('function')
        expect(rule.recommendation).toBeDefined()
      })
    })
  })

  describe('MEDICATION_INTERACTIONS', () => {
    it('should have valid interaction definitions', () => {
      MEDICATION_INTERACTIONS.forEach(interaction => {
        expect(interaction.rxNormCodes).toBeDefined()
        expect(Array.isArray(interaction.rxNormCodes)).toBe(true)
        expect(['high', 'medium', 'low']).toContain(interaction.severity)
        expect(interaction.description).toBeDefined()
        expect(interaction.action).toBeDefined()
      })
    })
  })
})