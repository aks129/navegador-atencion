import { describe, it, expect } from 'vitest'
import { coverage, provenanceMissing, analyzeSummaryProvenance } from '../provenance'
import { SummaryResult } from '../provenance'

describe('Provenance Analysis', () => {
  const mockSummaryWithSections: SummaryResult = {
    summary: 'Patient has elevated glucose levels.',
    sections: [
      {
        id: 'section-1',
        title: 'Demographics',
        content: 'Patient is a 45-year-old male. He lives in Boston.',
        claims: [],
        sources: [
          {
            resourceType: 'Patient',
            resourceId: 'patient-1',
            reference: 'Patient/patient-1',
            relevanceScore: 0.95
          }
        ],
        confidence: 0.9,
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          persona: 'provider',
          template: 'comprehensive',
          processingTime: 1000
        }
      },
      {
        id: 'section-2',
        title: 'Lab Results',
        content: 'Glucose level is 180 mg/dL which is elevated.',
        claims: [],
        sources: [], // No sources - should be flagged
        confidence: 0.85,
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          persona: 'provider',
          template: 'comprehensive',
          processingTime: 1000
        }
      }
    ],
    metadata: {
      timestamp: '2024-01-01T00:00:00Z',
      options: {
        persona: 'provider',
        includeRecommendations: true
      },
      resourceCounts: {
        Patient: 1,
        Observation: 1
      }
    }
  }

  const mockSummaryWithClaims: SummaryResult = {
    summary: 'Summary with claims',
    sections: [
      {
        id: 'section-1',
        title: 'Clinical Analysis',
        content: 'Multiple clinical findings noted.',
        claims: [
          {
            text: 'Patient has type 2 diabetes',
            refs: ['Condition/condition-1'],
            confidence: 'high',
            category: 'diagnosis'
          },
          {
            text: 'Blood pressure is normal',
            refs: ['Observation/bp-1', 'Observation/bp-2'],
            confidence: 'med',
            category: 'assessment'
          },
          {
            text: 'Patient should exercise more', // No refs - should be flagged
            refs: [],
            confidence: 'low',
            category: 'recommendation'
          }
        ],
        sources: [],
        confidence: 0.8,
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          persona: 'provider',
          template: 'comprehensive',
          processingTime: 1000
        }
      }
    ],
    metadata: {
      timestamp: '2024-01-01T00:00:00Z',
      options: {
        persona: 'provider',
        includeRecommendations: true
      },
      resourceCounts: {
        Patient: 1,
        Condition: 1,
        Observation: 2
      }
    }
  }

  const mockPlainSummary: SummaryResult = {
    summary: 'Patient is a 65-year-old male with diabetes. His last HbA1c was elevated at 8.2%. He should consider lifestyle modifications.',
    metadata: {
      timestamp: '2024-01-01T00:00:00Z',
      options: {
        persona: 'patient'
      },
      resourceCounts: {
        Patient: 1,
        Observation: 1
      }
    }
  }

  describe('coverage function', () => {
    it('should calculate coverage for section-based summary', () => {
      const result = coverage(mockSummaryWithSections)
      // section-1 has 2 sentences (referenced), section-2 has 1 sentence (unreferenced) = 2/3 = 66.67%
      expect(result).toBe(66.67)
    })

    it('should calculate coverage for claims-based summary', () => {
      const result = coverage(mockSummaryWithClaims)
      expect(result).toBe(66.67) // 2 out of 3 claims have refs
    })

    it('should return 0 coverage for plain summary', () => {
      const result = coverage(mockPlainSummary)
      expect(result).toBe(0) // Plain summaries have no provenance info
    })

    it('should return 0 for null/undefined input', () => {
      expect(coverage(null as any)).toBe(0)
      expect(coverage(undefined as any)).toBe(0)
    })
  })

  describe('provenanceMissing function', () => {
    it('should identify sentences without references in section-based summary', () => {
      const missing = provenanceMissing(mockSummaryWithSections)
      expect(missing).toHaveLength(1)
      expect(missing[0]).toContain('Glucose level is 180 mg/dL')
    })

    it('should identify claims without references', () => {
      const missing = provenanceMissing(mockSummaryWithClaims)
      expect(missing).toHaveLength(1)
      expect(missing[0]).toBe('Patient should exercise more')
    })

    it('should return all sentences for plain summary', () => {
      const missing = provenanceMissing(mockPlainSummary)
      expect(missing.length).toBeGreaterThan(0)
      expect(missing[0]).toContain('Patient is a 65-year-old male')
    })

    it('should return empty array for fully referenced summary', () => {
      const fullySourced: SummaryResult = {
        ...mockSummaryWithSections,
        sections: mockSummaryWithSections.sections!.map((section: any) => ({
          ...section,
          sources: [
            {
              resourceType: 'Patient',
              resourceId: 'patient-1',
              reference: 'Patient/patient-1',
              relevanceScore: 0.9
            }
          ]
        }))
      }

      const missing = provenanceMissing(fullySourced)
      expect(missing).toHaveLength(0)
    })
  })

  describe('analyzeSummaryProvenance function', () => {
    it('should provide comprehensive analysis for section-based summary', () => {
      const analysis = analyzeSummaryProvenance(mockSummaryWithSections)

      // section-1: 2 sentences (referenced), section-2: 1 sentence (unreferenced)
      expect(analysis.coverage).toBe(66.67)
      expect(analysis.totalSentences).toBe(3)
      expect(analysis.referencedSentences).toBe(2)
      expect(analysis.provenanceMissing).toHaveLength(1)
    })

    it('should provide analysis for claims-based summary', () => {
      const analysis = analyzeSummaryProvenance(mockSummaryWithClaims)

      expect(analysis.coverage).toBe(66.67)
      expect(analysis.totalSentences).toBe(3) // 3 claims
      expect(analysis.referencedSentences).toBe(2) // 2 claims with refs
      expect(analysis.provenanceMissing).toHaveLength(1)
    })

    it('should handle empty input gracefully', () => {
      const analysis = analyzeSummaryProvenance(null as any)

      expect(analysis.coverage).toBe(0)
      expect(analysis.totalSentences).toBe(0)
      expect(analysis.referencedSentences).toBe(0)
      expect(analysis.provenanceMissing).toHaveLength(0)
    })

    it('should extract sentences correctly from content', () => {
      const testSummary: SummaryResult = {
        summary: 'Test summary',
        sections: [
          {
            id: 'test',
            title: 'Test Section',
            content: 'First sentence. Second sentence! Third sentence? Short.',
            claims: [],
            sources: [],
            confidence: 0.8,
            metadata: {
              generatedAt: '2024-01-01T00:00:00Z',
              persona: 'provider',
              template: 'test',
              processingTime: 100
            }
          }
        ],
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          options: { persona: 'provider' },
          resourceCounts: {}
        }
      }

      const analysis = analyzeSummaryProvenance(testSummary)
      // Sentence splitter: "First sentence", "Second sentence", "Third sentence" (all >10 chars); "Short." filtered (<10)
      expect(analysis.totalSentences).toBe(3)
      expect(analysis.provenanceMissing).toHaveLength(3) // no sources
    })
  })

  describe('edge cases', () => {
    it('should handle summary with empty sections', () => {
      const emptySummary: SummaryResult = {
        summary: 'Empty sections test',
        sections: [],
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          options: { persona: 'provider' },
          resourceCounts: {}
        }
      }

      const analysis = analyzeSummaryProvenance(emptySummary)
      expect(analysis.coverage).toBe(0)
      // Falls back to plain summary: 'Empty sections test' → 1 sentence
      expect(analysis.totalSentences).toBe(1)
    })

    it('should handle sections without content', () => {
      const noContentSummary: SummaryResult = {
        summary: 'No content test',
        sections: [
          {
            id: 'empty',
            title: 'Empty Section',
            content: '',
            claims: [],
            sources: [],
            confidence: 0,
            metadata: {
              generatedAt: '2024-01-01T00:00:00Z',
              persona: 'provider',
              template: 'test',
              processingTime: 0
            }
          }
        ],
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          options: { persona: 'provider' },
          resourceCounts: {}
        }
      }

      const analysis = analyzeSummaryProvenance(noContentSummary)
      // Section has no content → allSentences empty → falls back to plain summary
      // 'No content test' → 1 sentence (15 chars > 10)
      expect(analysis.totalSentences).toBe(1)
    })
  })
})
