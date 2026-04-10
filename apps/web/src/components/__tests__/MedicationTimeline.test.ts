import { describe, it, expect, beforeEach } from 'vitest'
import { detectMedicationOverlaps, segmentMedicationTimeline } from '../MedicationTimeline'
import type { ProcessedMedication } from '@plumly/fhir-utils'

// Mock ProcessedMedication data for testing
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
    id: 'med-123',
    reference: 'MedicationRequest/med-123'
  },
  ...overrides
})

describe('MedicationTimeline Utilities', () => {
  describe('detectMedicationOverlaps', () => {
    it('should detect no overlaps when medications have different RxNorm codes', () => {
      const segments = [
        {
          medicationId: 'med-1',
          name: 'Medication A',
          rxNormCode: '12345',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-1'
        },
        {
          medicationId: 'med-2',
          name: 'Medication B',
          rxNormCode: '67890',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-2'
        }
      ]

      const result = detectMedicationOverlaps(segments)

      expect(result[0].hasOverlap).toBeFalsy()
      expect(result[1].hasOverlap).toBeFalsy()
    })

    it('should detect overlaps when medications have same RxNorm code and overlapping dates', () => {
      const segments = [
        {
          medicationId: 'med-1',
          name: 'Medication A',
          rxNormCode: '12345',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-1'
        },
        {
          medicationId: 'med-2',
          name: 'Medication A (refill)',
          rxNormCode: '12345',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-2'
        }
      ]

      const result = detectMedicationOverlaps(segments)

      expect(result[0].hasOverlap).toBe(true)
      expect(result[0].overlapWith).toContain('med-2')
      expect(result[1].hasOverlap).toBe(true)
      expect(result[1].overlapWith).toContain('med-1')
    })

    it('should handle ongoing medications (null end date)', () => {
      const segments = [
        {
          medicationId: 'med-1',
          name: 'Medication A',
          rxNormCode: '12345',
          startDate: new Date('2024-01-01'),
          endDate: null,
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-1'
        },
        {
          medicationId: 'med-2',
          name: 'Medication A (duplicate)',
          rxNormCode: '12345',
          startDate: new Date('2024-02-01'),
          endDate: null,
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-2'
        }
      ]

      const result = detectMedicationOverlaps(segments)

      expect(result[0].hasOverlap).toBe(true)
      expect(result[1].hasOverlap).toBe(true)
    })

    it('should not detect overlap for sequential medications', () => {
      const segments = [
        {
          medicationId: 'med-1',
          name: 'Medication A',
          rxNormCode: '12345',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          status: 'completed' as const,
          resourceRef: 'MedicationRequest/med-1'
        },
        {
          medicationId: 'med-2',
          name: 'Medication A (refill)',
          rxNormCode: '12345',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-2'
        }
      ]

      const result = detectMedicationOverlaps(segments)

      expect(result[0].hasOverlap).toBeFalsy()
      expect(result[1].hasOverlap).toBeFalsy()
    })

    it('should detect boundary overlap (same end/start date)', () => {
      const segments = [
        {
          medicationId: 'med-1',
          name: 'Medication A',
          rxNormCode: '12345',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          status: 'completed' as const,
          resourceRef: 'MedicationRequest/med-1'
        },
        {
          medicationId: 'med-2',
          name: 'Medication A (overlap)',
          rxNormCode: '12345',
          startDate: new Date('2024-01-31'),
          endDate: new Date('2024-02-28'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-2'
        }
      ]

      const result = detectMedicationOverlaps(segments)

      expect(result[0].hasOverlap).toBe(true)
      expect(result[1].hasOverlap).toBe(true)
    })

    it('should handle multiple overlapping medications', () => {
      const segments = [
        {
          medicationId: 'med-1',
          name: 'Medication A',
          rxNormCode: '12345',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-01'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-1'
        },
        {
          medicationId: 'med-2',
          name: 'Medication A (duplicate)',
          rxNormCode: '12345',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-2'
        },
        {
          medicationId: 'med-3',
          name: 'Medication A (third)',
          rxNormCode: '12345',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
          status: 'active' as const,
          resourceRef: 'MedicationRequest/med-3'
        }
      ]

      const result = detectMedicationOverlaps(segments)

      expect(result[0].hasOverlap).toBe(true)
      expect(result[0].overlapWith).toHaveLength(2)
      expect(result[1].hasOverlap).toBe(true)
      expect(result[2].hasOverlap).toBe(true)
    })
  })

  describe('segmentMedicationTimeline', () => {
    it('should create timeline segments from medication data', () => {
      const medications = [
        createMockMedication({
          name: 'Aspirin',
          authoredDate: '2024-01-01',
          status: 'active',
          source: { id: 'med-1', reference: 'MedicationRequest/med-1' },
          rxNormCode: '1191'
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments).toHaveLength(1)
      expect(segments[0].name).toBe('Aspirin')
      expect(segments[0].startDate).toEqual(new Date('2024-01-01'))
      expect(segments[0].endDate).toBeNull() // active medication
      expect(segments[0].rxNormCode).toBe('1191')
    })

    it('should estimate end dates for completed medications', () => {
      const medications = [
        createMockMedication({
          name: 'Completed Medication',
          authoredDate: '2024-01-01',
          status: 'completed',
          source: { id: 'med-1', reference: 'MedicationRequest/med-1' }
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments[0].endDate).not.toBeNull()
      expect(segments[0].endDate!.getTime()).toBeGreaterThan(segments[0].startDate.getTime())
    })

    it('should handle medications without authored date', () => {
      const medications = [
        createMockMedication({
          name: 'No Date Medication',
          authoredDate: undefined,
          source: { id: 'med-1', reference: 'MedicationRequest/med-1' }
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments).toHaveLength(1)
      expect(segments[0].startDate).toBeDefined()
      expect(segments[0].startDate.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should detect overlaps in processed segments', () => {
      const medications = [
        createMockMedication({
          name: 'Metformin',
          authoredDate: '2024-01-01',
          status: 'active',
          rxNormCode: '6809',
          source: { id: 'med-1', reference: 'MedicationRequest/med-1' }
        }),
        createMockMedication({
          name: 'Metformin (duplicate prescription)',
          authoredDate: '2024-01-15',
          status: 'active',
          rxNormCode: '6809',
          source: { id: 'med-2', reference: 'MedicationRequest/med-2' }
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments.some(seg => seg.hasOverlap)).toBe(true)
    })

    it('should handle mixed medication statuses', () => {
      const medications = [
        createMockMedication({
          name: 'Active Med',
          authoredDate: '2024-01-01',
          status: 'active',
          source: { id: 'med-1', reference: 'MedicationRequest/med-1' }
        }),
        createMockMedication({
          name: 'Stopped Med',
          authoredDate: '2024-01-15',
          status: 'stopped',
          source: { id: 'med-2', reference: 'MedicationRequest/med-2' }
        }),
        createMockMedication({
          name: 'On Hold Med',
          authoredDate: '2024-02-01',
          status: 'on-hold',
          source: { id: 'med-3', reference: 'MedicationRequest/med-3' }
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments).toHaveLength(3)
      expect(segments[0].status).toBe('active')
      expect(segments[1].status).toBe('stopped')
      expect(segments[2].status).toBe('on-hold')

      // Active medication should have no end date
      expect(segments[0].endDate).toBeNull()

      // Stopped medication should have estimated end date
      expect(segments[1].endDate).not.toBeNull()
    })

    it('should generate unique medication IDs when source ID is missing', () => {
      const medications = [
        createMockMedication({
          name: 'No ID Med',
          source: { reference: 'MedicationRequest/unknown' }
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments).toHaveLength(1)
      expect(segments[0].medicationId).toBeDefined()
      expect(segments[0].medicationId).toMatch(/med-\d+/)
    })
  })

  describe('Timeline Integration', () => {
    it('should correctly process complex medication scenarios', () => {
      const medications = [
        // Long-term diabetes medication
        createMockMedication({
          name: 'Metformin ER',
          authoredDate: '2023-06-01',
          status: 'active',
          rxNormCode: '6809',
          dosage: '500 mg twice daily',
          source: { id: 'met-1', reference: 'MedicationRequest/met-1' }
        }),
        // Overlapping metformin prescription (potential duplicate)
        createMockMedication({
          name: 'Metformin',
          authoredDate: '2024-01-01',
          status: 'active',
          rxNormCode: '6809',
          dosage: '1000 mg daily',
          source: { id: 'met-2', reference: 'MedicationRequest/met-2' }
        }),
        // Temporary antibiotic
        createMockMedication({
          name: 'Amoxicillin',
          authoredDate: '2024-01-15',
          status: 'completed',
          rxNormCode: '723',
          dosage: '500 mg three times daily',
          source: { id: 'amox-1', reference: 'MedicationRequest/amox-1' }
        })
      ]

      const segments = segmentMedicationTimeline(medications)

      expect(segments).toHaveLength(3)

      // Should detect metformin overlap
      const metforminSegments = segments.filter(seg => seg.rxNormCode === '6809')
      expect(metforminSegments.some(seg => seg.hasOverlap)).toBe(true)

      // Amoxicillin should not overlap with metformin
      const amoxSegment = segments.find(seg => seg.rxNormCode === '723')
      expect(amoxSegment?.hasOverlap).toBeFalsy()
    })
  })
})