import { SummaryResponse, SectionSummary, PersonaType, Claim } from '@plumly/summarizer'

// Unified interface for evaluation that supports both SummaryResponse and SectionSummary formats
export interface SummaryResult {
  summary: string;
  sections?: {
    id: string;
    title: string;
    content: string;
    claims?: Claim[];
    sources?: {
      resourceType: string;
      resourceId: string;
      reference: string;
      relevanceScore: number;
    }[] | string[];
    confidence: number;
    metadata?: {
      generatedAt: string;
      persona: PersonaType;
      template: string;
      processingTime: number;
    };
  }[];
  metadata?: {
    timestamp?: string;
    options?: {
      persona: PersonaType;
      includeRecommendations?: boolean;
    };
    resourceCounts?: Record<string, number>;
  };
}

export interface ProvenanceMetrics {
  coverage: number  // % sentences with >=1 ref
  totalSentences: number
  referencedSentences: number
  provenanceMissing: string[]  // list of sentences without refs
}

/**
 * Extract sentences from text content, handling various punctuation
 */
function extractSentences(text: string): string[] {
  if (!text || typeof text !== 'string') return []

  return text
    // Split on sentence-ending punctuation followed by space/newline
    .split(/[.!?]+\s+/)
    // Clean up each sentence
    .map(sentence => sentence.trim())
    // Filter out empty sentences and very short fragments
    .filter(sentence => sentence.length > 10)
    // Ensure sentences end with proper punctuation for consistency
    .map(sentence => {
      const trimmed = sentence.trim()
      if (!/[.!?]$/.test(trimmed)) {
        return trimmed + '.'
      }
      return trimmed
    })
}

/**
 * Calculate coverage: % sentences with >=1 reference
 */
export function coverage(summary: SummaryResult): number {
  const metrics = analyzeSummaryProvenance(summary)
  return metrics.coverage
}

/**
 * Get list of sentences without references
 */
export function provenanceMissing(summary: SummaryResult): string[] {
  const metrics = analyzeSummaryProvenance(summary)
  return metrics.provenanceMissing
}

/**
 * Comprehensive analysis of summary provenance
 */
export function analyzeSummaryProvenance(summary: SummaryResult): ProvenanceMetrics {
  if (!summary) {
    return {
      coverage: 0,
      totalSentences: 0,
      referencedSentences: 0,
      provenanceMissing: []
    }
  }

  const allSentences: string[] = []
  const referencedSentences: string[] = []
  const unreferencedSentences: string[] = []

  // Analyze sections if available (structured summaries)
  if (summary.sections && summary.sections.length > 0) {
    for (const section of summary.sections) {
      if (section.content) {
        const sentences = extractSentences(section.content)
        allSentences.push(...sentences)

        // Check if section has references
        const hasReferences = section.sources && section.sources.length > 0

        if (hasReferences) {
          referencedSentences.push(...sentences)
        } else {
          unreferencedSentences.push(...sentences)
        }
      }
    }
  }

  // Fallback to plain summary text if no sections
  if (allSentences.length === 0 && summary.summary) {
    const sentences = extractSentences(summary.summary)
    allSentences.push(...sentences)

    // For plain summaries, we can't easily determine which sentences have references
    // So we assume none have specific references
    unreferencedSentences.push(...sentences)
  }

  // Handle claims-based analysis if available
  if (summary.sections) {
    const claimsWithRefs: Set<string> = new Set()
    const claimsWithoutRefs: Set<string> = new Set()

    for (const section of summary.sections) {
      if (section.claims && section.claims.length > 0) {
        for (const claim of section.claims) {
          if (claim.refs && claim.refs.length > 0) {
            claimsWithRefs.add(claim.text)
          } else {
            claimsWithoutRefs.add(claim.text)
          }
        }
      }
    }

    // Update referenced/unreferenced based on claims analysis
    if (claimsWithRefs.size > 0 || claimsWithoutRefs.size > 0) {
      const claimsBasedReferenced = Array.from(claimsWithRefs)
      const claimsBasedUnreferenced = Array.from(claimsWithoutRefs)

      // If we have claims data, prefer it over section-level analysis
      const claimsTotal = claimsBasedReferenced.length + claimsBasedUnreferenced.length
      const claimsCoverage = claimsTotal > 0
        ? Math.round((claimsBasedReferenced.length / claimsTotal) * 10000) / 100
        : 0
      return {
        coverage: claimsCoverage,
        totalSentences: claimsBasedReferenced.length + claimsBasedUnreferenced.length,
        referencedSentences: claimsBasedReferenced.length,
        provenanceMissing: claimsBasedUnreferenced
      }
    }
  }

  const totalSentences = allSentences.length
  const coveragePercent = totalSentences > 0
    ? (referencedSentences.length / totalSentences) * 100
    : 0

  return {
    coverage: Math.round(coveragePercent * 100) / 100, // Round to 2 decimal places
    totalSentences,
    referencedSentences: referencedSentences.length,
    provenanceMissing: unreferencedSentences
  }
}

/**
 * Generate a human-readable provenance report
 */
export function generateProvenanceReport(summary: SummaryResult): string {
  const metrics = analyzeSummaryProvenance(summary)

  const report = [
    '# Provenance Analysis Report',
    '',
    `**Total Sentences:** ${metrics.totalSentences}`,
    `**Referenced Sentences:** ${metrics.referencedSentences}`,
    `**Coverage:** ${metrics.coverage.toFixed(2)}%`,
    '',
    '## Coverage Status',
    metrics.coverage >= 80 ? '✅ **GOOD** - High provenance coverage' :
    metrics.coverage >= 60 ? '⚠️ **MODERATE** - Acceptable provenance coverage' :
    '❌ **POOR** - Low provenance coverage',
    ''
  ]

  if (metrics.provenanceMissing.length > 0) {
    report.push('## Sentences Missing References')
    report.push('')
    metrics.provenanceMissing.forEach((sentence, index) => {
      report.push(`${index + 1}. ${sentence}`)
    })
    report.push('')
  }

  report.push('---')
  report.push(`*Generated at ${new Date().toISOString()}*`)

  return report.join('\n')
}