import { NextRequest, NextResponse } from 'next/server'
import { ClaudeClient } from '@plumly/summarizer'
import {
  ResourceSelector,
  deidentifyFHIRBundle,
  deidentifyFHIRResource,
  validateFHIRBundle as validateBundle,
  validateFHIRResource,
  parseCSV
} from '@plumly/fhir-utils'
import { validateFHIRBundle } from '@/lib/fhir-validator'
import type { FHIRBundle } from '@/types/fhir'
import type { SummaryRequest, PersonaType, TemplateOptions } from '@plumly/summarizer'
import type { DeidentificationOptions } from '@plumly/fhir-utils'

// For Next.js App Router - set max duration for serverless function
export const maxDuration = 60 // seconds

// Runtime configuration
export const runtime = 'nodejs'

// Enable dynamic rendering (not static)
export const dynamic = 'force-dynamic'

interface RequestBody {
  bundle?: FHIRBundle
  /** Pre-flattened clinical text summary (for very large bundles) */
  clinicalTextSummary?: string
  /** Raw CSV/TSV content for conversion */
  csvContent?: string
  /** CSV parsing options */
  csvOptions?: {
    delimiter?: string
    hasHeaders?: boolean
  }
  options?: {
    targetAudience?: 'patient' | 'provider' | 'payer'
    outputFormat?: 'narrative' | 'structured' | 'composition'
    includeRecommendations?: boolean
    focusAreas?: string[]
    persona?: PersonaType
    templateOptions?: TemplateOptions
    abTestVariant?: string
    /** Enable de-identification before processing (default: true) */
    deidentify?: boolean
    /** Custom de-identification options */
    deidentificationOptions?: DeidentificationOptions
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[Summarize API] Request received')

  // Track de-identification for response metadata
  let deidentificationApplied = false
  let deidentificationStats = { phiElementsProcessed: 0, modifiedFields: [] as string[] }

  try {
    const body: RequestBody = await request.json()
    const { csvContent, csvOptions, clinicalTextSummary, options = {} } = body
    let { bundle } = body

    console.log('[Summarize API] Bundle received with', bundle?.entry?.length || 0, 'entries')
    console.log('[Summarize API] Clinical text summary provided:', !!clinicalTextSummary)
    console.log('[Summarize API] API key configured:', !!process.env.ANTHROPIC_API_KEY)

    // Check API key early
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'Claude API key not configured',
          errorType: 'configuration'
        },
        { status: 500 }
      )
    }

    // Initialize Claude client
    const claudeClient = new ClaudeClient(process.env.ANTHROPIC_API_KEY)

    // Handle pre-flattened clinical text summary (for very large bundles)
    if (clinicalTextSummary && !bundle) {
      console.log('[Summarize API] Using clinical text summary mode')

      // Map persona
      const persona: PersonaType = options.persona ||
        (options.targetAudience === 'provider' ? 'provider' :
         options.targetAudience === 'payer' ? 'caregiver' : 'patient')

      // Generate summary directly from clinical text
      const result = await claudeClient.summarizeFromText(clinicalTextSummary, {
        persona,
        focusAreas: options.focusAreas
      })

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        summary: result.summary,
        sections: result.sections,
        metadata: {
          ...result.metadata,
          totalProcessingTime: processingTime,
          endpoint: '/api/summarize',
          inputMode: 'clinical-text-summary',
          deidentification: {
            applied: true,
            note: 'Data was pre-flattened and de-identified on the client before transmission.'
          },
          dataRetention: 'none',
          processingNote: 'All data was processed in-memory and discarded after summary generation.'
        }
      })
    }

    // Handle CSV input - convert to FHIR Bundle
    if (csvContent && !bundle) {
      const csvResult = parseCSV(csvContent, csvOptions)
      if (!csvResult.success || !csvResult.bundle) {
        return NextResponse.json(
          {
            error: 'Failed to parse CSV content',
            errorType: 'validation',
            details: csvResult.errors.join(', ')
          },
          { status: 400 }
        )
      }
      bundle = csvResult.bundle as FHIRBundle
    }

    // Validate FHIR bundle - must exist at this point
    if (!bundle) {
      return NextResponse.json(
        {
          error: 'No FHIR Bundle provided',
          errorType: 'validation',
          details: 'Either bundle, csvContent, or clinicalTextSummary is required'
        },
        { status: 400 }
      )
    }

    const isValid = validateFHIRBundle(bundle)
    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Invalid FHIR Bundle format',
          errorType: 'validation',
          details: 'Bundle validation failed'
        },
        { status: 400 }
      )
    }

    // Apply de-identification if enabled (default: true for security)
    const shouldDeidentify = options.deidentify !== false
    if (shouldDeidentify) {
      const deidentResult = deidentifyFHIRBundle(
        bundle as unknown as Record<string, unknown>,
        options.deidentificationOptions
      )
      bundle = deidentResult.data as unknown as FHIRBundle
      deidentificationApplied = true
      deidentificationStats = {
        phiElementsProcessed: deidentResult.phiElementsProcessed,
        modifiedFields: deidentResult.modifiedFields
      }
    }

    // Process FHIR data for resource selection
    const resourceSelector = new ResourceSelector(bundle)
    const resourceData = resourceSelector.selectRelevantResources()

    // Map legacy options to new structured format
    const persona: PersonaType = options.persona ||
      (options.targetAudience === 'provider' ? 'provider' :
       options.targetAudience === 'payer' ? 'caregiver' : 'patient')

    const templateOptions: TemplateOptions = {
      focusAreas: options.focusAreas,
      ...options.templateOptions
    }

    // Create structured request
    const summaryRequest: SummaryRequest = {
      resourceData,
      persona,
      templateOptions,
      abTestVariant: options.abTestVariant
    }

    // Generate summary using new ClaudeClient
    console.log('[Summarize API] Calling Claude API...')
    const result = await claudeClient.summarize(summaryRequest)
    console.log('[Summarize API] Summary generated successfully')

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      summary: result.summary,
      sections: result.sections,
      metadata: {
        ...result.metadata,
        totalProcessingTime: processingTime,
        endpoint: '/api/summarize',
        // Include de-identification metadata
        deidentification: deidentificationApplied ? {
          applied: true,
          phiElementsProcessed: deidentificationStats.phiElementsProcessed,
          note: 'Data was de-identified before processing. No PHI was stored or transmitted to the AI.'
        } : {
          applied: false,
          note: 'De-identification was disabled for this request.'
        },
        // Confirm stateless processing
        dataRetention: 'none',
        processingNote: 'All data was processed in-memory and discarded after summary generation.'
      }
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error('Error generating summary:', error)

    // Enhanced error handling using ClaudeClient error analysis
    let userFriendlyError = 'Failed to generate summary'
    let errorType = 'unknown'
    let statusCode = 500
    let retryable = false

    // Use enhanced error information from ClaudeClient if available
    if (error.type) {
      errorType = error.type
      retryable = error.retryable || false

      switch (error.type) {
        case 'capacity':
          userFriendlyError = 'Claude AI is currently experiencing high demand. Please try again in a few minutes.'
          statusCode = 503
          break
        case 'rate_limit':
          userFriendlyError = 'Rate limit exceeded. Please wait a moment before trying again.'
          statusCode = 429
          break
        case 'auth':
          userFriendlyError = 'Claude API authentication failed. Please check API key configuration.'
          statusCode = 401
          break
        case 'invalid_request':
          userFriendlyError = 'Invalid request format. Please check your FHIR bundle and try again.'
          statusCode = 400
          break
        case 'network':
          userFriendlyError = 'Network connection error. Please check your internet connection and try again.'
          statusCode = 503
          retryable = true
          break
        default:
          userFriendlyError = error.message || 'An unexpected error occurred'
      }
    } else {
      // Fallback error parsing
      const errorMessage = error.message || ''
      if (errorMessage.includes('overloaded') || errorMessage.includes('capacity')) {
        userFriendlyError = 'Claude AI is currently experiencing high demand. Please try again in a few minutes.'
        errorType = 'capacity'
        statusCode = 503
        retryable = true
      } else if (errorMessage.includes('rate_limit')) {
        userFriendlyError = 'Rate limit exceeded. Please wait a moment before trying again.'
        errorType = 'rate_limit'
        statusCode = 429
        retryable = true
      }
    }

    return NextResponse.json(
      {
        error: userFriendlyError,
        errorType,
        details: error.message || 'Unknown error',
        retryable,
        processingTime,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'FHIR Summarization API',
    endpoints: {
      POST: 'Generate AI summary from FHIR Bundle or CSV data'
    },
    inputFormats: {
      bundle: 'FHIR Bundle (JSON)',
      csvContent: 'Raw CSV/TSV content (will be converted to FHIR Bundle)'
    },
    options: {
      targetAudience: ['patient', 'provider', 'payer'],
      outputFormat: ['narrative', 'structured', 'composition'],
      includeRecommendations: 'boolean',
      focusAreas: 'array of strings',
      deidentify: 'boolean (default: true) - Remove PHI before processing',
      deidentificationOptions: {
        removeNames: 'boolean',
        maskDates: 'boolean',
        removeGeographicData: 'boolean',
        removePhoneNumbers: 'boolean',
        removeEmails: 'boolean',
        removeIdentifiers: 'boolean',
        removeNetworkIdentifiers: 'boolean',
        maskAccountNumbers: 'boolean',
        usePlaceholders: 'boolean'
      }
    },
    security: {
      deidentification: 'PHI is removed/masked by default before AI processing',
      dataRetention: 'No data is stored - all processing is stateless',
      note: 'Original data is never persisted; only de-identified summaries are generated'
    }
  })
}