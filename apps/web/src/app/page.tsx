'use client'

import React, { useState } from 'react'
import { FHIRUpload } from '@/components/FHIRUpload'
import { FHIRServerConnector } from '@/components/FHIRServerConnector'
import { ResourceSummary } from '@/components/ResourceSummary'
import { ReviewItemsCard } from '@/components/ReviewItemsCard'
import { PersonaTemplateSelector } from '@/components/PersonaTemplateSelector'
import { PersonaToggle } from '@/components/PersonaToggle'
import { SummaryRenderer } from '@/components/SummaryRenderer'
import { ShareButton } from '@/components/ShareButton'
import PromptConfiguration from '@/components/PromptConfiguration'
import SummaryOutput from '@/components/SummaryOutput'
import { FHIRBundle } from '@/types/fhir'
import { SummarizationOptions } from '@/lib/claude-client'
import { ResourceSelector } from '@plumly/fhir-utils'
import type { PersonaType, TemplateOptions } from '@plumly/summarizer'

interface SummaryResult {
  summary: string
  sections?: Array<{
    id: string
    title: string
    content: string
    claims: Array<{
      text: string
      refs: string[]
      confidence: 'low' | 'med' | 'high'
      category?: string
      timestamp?: string
    }>
    sources: Array<{
      resourceType: string
      resourceId: string
      reference: string
      relevanceScore: number
    }>
    confidence: number
    metadata: {
      generatedAt: string
      persona: PersonaType
      template: string
      processingTime: number
    }
  }>
  metadata: {
    timestamp: string
    options: SummarizationOptions
    resourceCounts: Record<string, number>
    persona?: PersonaType
    templateUsed?: string
    totalProcessingTime?: number
  }
}

interface ErrorResponse {
  error: string
  errorType?: string
  details?: string
  retryable?: boolean
}

export default function Home() {
  const [currentBundle, setCurrentBundle] = useState<FHIRBundle | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('patient')
  const [templateOptions, setTemplateOptions] = useState<TemplateOptions>({})
  const [resourceData, setResourceData] = useState<any>(null)
  const [promptConfig, setPromptConfig] = useState<SummarizationOptions & { templateId?: string }>({
    targetAudience: 'patient',
    outputFormat: 'narrative',
    includeRecommendations: false,
    focusAreas: []
  })
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<ErrorResponse | null>(null)
  const [highlightedResourceRef, setHighlightedResourceRef] = useState<string | null>(null)
  const [activeResourceTab, setActiveResourceTab] = useState<string>('labs')
  const [dataSourceTab, setDataSourceTab] = useState<'server' | 'upload'>('server')

  const handleFileUpload = (result: any) => {
    if (result.success && result.data) {
      setCurrentBundle(result.data)
      setSummaryResult(null)
      setError(null)

      // Generate resource selection data for persona templates
      try {
        const selector = new ResourceSelector(result.data)
        const resourceSelectionResult = selector.selectRelevantResources()
        setResourceData(resourceSelectionResult)
      } catch (error) {
        console.error('Resource selection failed:', error)
        setResourceData(null)
      }
    } else {
      setError({
        error: result.validation.errors.join(', ') || 'File upload failed',
        errorType: 'validation'
      })
    }
  }

  const handleServerData = (bundle: FHIRBundle) => {
    setCurrentBundle(bundle)
    setSummaryResult(null)
    setError(null)

    // Generate resource selection data for persona templates
    try {
      const selector = new ResourceSelector(bundle)
      const resourceSelectionResult = selector.selectRelevantResources()
      setResourceData(resourceSelectionResult)
    } catch (error) {
      console.error('Resource selection failed:', error)
      setResourceData(null)
    }
  }

  const handleServerError = (errorMessage: string) => {
    // Fall back to upload tab on server error
    setDataSourceTab('upload')
    setError({
      error: 'Server Connection Failed',
      details: errorMessage,
      errorType: 'server'
    } as any)
  }

  const handleTemplateChange = (persona: PersonaType, options: TemplateOptions) => {
    setSelectedPersona(persona)
    setTemplateOptions(options)
    // Update prompt config to match selected persona
    const mappedAudience = persona === 'caregiver' ? 'provider' : persona as 'patient' | 'provider' | 'payer'
    setPromptConfig(prev => ({
      ...prev,
      targetAudience: mappedAudience
    }))
  }

  const handlePersonaChange = (persona: PersonaType) => {
    setSelectedPersona(persona)
    setTemplateOptions({}) // Reset template options

    // Update prompt config to match selected persona
    const mappedAudience = persona === 'caregiver' ? 'provider' : persona as 'patient' | 'provider' | 'payer'
    setPromptConfig(prev => ({
      ...prev,
      targetAudience: mappedAudience,
      persona
    }))

    // Auto-regenerate summary if we have data
    if (currentBundle && summaryResult) {
      generateSummaryWithPersona(persona)
    }
  }

  // Handle navigation from ReviewItems to specific tabs/charts
  const handleNavigateToResource = (tab: string, options?: {
    code?: string
    medicationId?: string
    resourceRef?: string
  }) => {
    // Switch to the appropriate tab
    setActiveResourceTab(tab)

    // Highlight the specific resource if provided
    if (options?.resourceRef) {
      setHighlightedResourceRef(options.resourceRef)
    }

    // For now, just switch tabs - could add more specific navigation logic
    // like scrolling to specific chart or filtering data
  }

  const generateSummaryWithPersona = async (persona: PersonaType) => {
    if (!currentBundle) return

    setIsGenerating(true)
    setError(null)

    try {
      const updatedConfig = {
        ...promptConfig,
        targetAudience: persona === 'caregiver' ? 'provider' : persona as 'patient' | 'provider' | 'payer',
        persona
      }

      const requestBody = JSON.stringify({
        bundle: currentBundle,
        options: updatedConfig
      })

      // Check payload size
      const payloadSizeBytes = new Blob([requestBody]).size
      const payloadSizeMB = payloadSizeBytes / (1024 * 1024)

      if (payloadSizeMB > 4) {
        setError({
          error: `Bundle is too large (${payloadSizeMB.toFixed(1)}MB). Maximum size is ~4MB.`,
          errorType: 'validation',
          details: `The bundle contains ${currentBundle.entry?.length || 0} resources.`
        })
        setIsGenerating(false)
        return
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      // Handle 413 specifically
      if (response.status === 413) {
        setError({
          error: 'Bundle is too large for the server to process.',
          errorType: 'validation',
          details: `The bundle contains ${currentBundle.entry?.length || 0} resources.`
        })
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setError({
          error: data.error || 'Failed to generate summary',
          errorType: data.errorType,
          details: data.details,
          retryable: data.retryable
        })
        return
      }

      setSummaryResult({
        summary: data.summary,
        sections: data.sections,
        metadata: {
          ...data.metadata,
          persona,
          templateUsed: data.metadata?.templateUsed || 'default'
        }
      })
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'Failed to generate summary',
        errorType: 'network'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePromptConfigChange = (config: SummarizationOptions & { templateId?: string }) => {
    setPromptConfig(config)
  }

  const generateSummary = async () => {
    if (!currentBundle) {
      setError({ error: 'Please upload a FHIR bundle first' })
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Prepare the request body
      const requestBody = JSON.stringify({
        bundle: currentBundle,
        options: promptConfig
      })

      // Check payload size (Vercel limit is ~4.5MB for serverless functions)
      const payloadSizeBytes = new Blob([requestBody]).size
      const payloadSizeMB = payloadSizeBytes / (1024 * 1024)

      if (payloadSizeMB > 4) {
        setError({
          error: `Bundle is too large (${payloadSizeMB.toFixed(1)}MB). Please use a smaller bundle with fewer resources. Maximum size is ~4MB.`,
          errorType: 'validation',
          details: `The bundle contains ${currentBundle.entry?.length || 0} resources. Try filtering to the most relevant resources.`
        })
        setIsGenerating(false)
        return
      }

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      // Handle 413 specifically before trying to parse JSON
      if (response.status === 413) {
        setError({
          error: 'Bundle is too large for the server to process. Please use a smaller bundle.',
          errorType: 'validation',
          details: `The bundle contains ${currentBundle.entry?.length || 0} resources.`
        })
        return
      }

      const data = await response.json()

      if (!response.ok) {
        // Use the enhanced error response from the API
        setError({
          error: data.error || 'Failed to generate summary',
          errorType: data.errorType,
          details: data.details,
          retryable: data.retryable
        })
        return
      }

      setSummaryResult({
        summary: data.summary,
        sections: data.sections,
        metadata: {
          ...data.metadata,
          persona: selectedPersona,
          templateUsed: data.metadata?.templateUsed || 'default'
        }
      })
    } catch (err) {
      setError({
        error: err instanceof Error ? err.message : 'Failed to generate summary',
        errorType: 'network'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (format: 'txt' | 'json' | 'fhir') => {
    if (!summaryResult) return

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case 'txt':
        content = summaryResult.summary
        filename = `summary-${new Date().toISOString().split('T')[0]}.txt`
        mimeType = 'text/plain'
        break
      case 'json':
        content = JSON.stringify({
          summary: summaryResult.summary,
          metadata: summaryResult.metadata
        }, null, 2)
        filename = `summary-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
        break
      case 'fhir':
        try {
          const response = await fetch('/api/compose', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bundle: currentBundle,
              summary: summaryResult.summary,
              metadata: summaryResult.metadata,
              outputType: 'composition'
            })
          })

          const data = await response.json()

          if (response.ok) {
            content = JSON.stringify(data.resource, null, 2)
          } else {
            // Fallback to simple composition
            content = JSON.stringify({
              resourceType: 'Composition',
              status: 'final',
              type: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '11503-0',
                  display: 'Medical records'
                }]
              },
              date: summaryResult.metadata.timestamp,
              title: 'AI Generated Health Summary',
              section: [{
                title: 'Summary',
                text: {
                  status: 'generated',
                  div: `<div xmlns="http://www.w3.org/1999/xhtml">${summaryResult.summary.replace(/\n/g, '<br/>')}</div>`
                }
              }]
            }, null, 2)
          }
        } catch (error) {
          console.error('Failed to generate FHIR composition:', error)
          content = JSON.stringify({
            resourceType: 'Composition',
            status: 'final',
            type: {
              coding: [{
                system: 'http://loinc.org',
                code: '11503-0',
                display: 'Medical records'
              }]
            },
            date: summaryResult.metadata.timestamp,
            title: 'AI Generated Health Summary',
            section: [{
              title: 'Summary',
              text: {
                status: 'generated',
                div: `<div xmlns="http://www.w3.org/1999/xhtml">${summaryResult.summary.replace(/\n/g, '<br/>')}</div>`
              }
            }]
          }, null, 2)
        }
        filename = `composition-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/fhir+json'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plumly</h1>
              <p className="text-sm text-gray-600">FHIR Data Summarization with AI</p>
            </div>
            <div className="text-sm text-gray-500">
              Powered by Claude
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Data Source Section - Server or Upload */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">1. Load FHIR Data</h2>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setDataSourceTab('server')}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm
                    ${dataSourceTab === 'server'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  FHIR Server Connection
                </button>
                <button
                  onClick={() => setDataSourceTab('upload')}
                  className={`
                    py-2 px-1 border-b-2 font-medium text-sm
                    ${dataSourceTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  File Upload
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {dataSourceTab === 'server' ? (
              <FHIRServerConnector
                onDataLoaded={handleServerData}
                onError={handleServerError}
              />
            ) : (
              <FHIRUpload onFileProcessed={handleFileUpload} />
            )}

            {/* Success Message */}
            {currentBundle && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-green-800 text-sm">
                  ✅ Bundle loaded successfully ({currentBundle.entry?.length || 0} resources)
                </div>
              </div>
            )}

            {/* Error with fallback suggestion */}
            {error && dataSourceTab === 'upload' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-yellow-800 text-sm">
                  ⚠️ Server connection failed. Using file upload as fallback.
                </div>
              </div>
            )}
          </div>

          {/* Resource Summary Section */}
          {currentBundle && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-4">2. Clinical Data Analysis</h2>
              <ResourceSummary
                bundle={currentBundle}
                highlightedResourceRef={highlightedResourceRef}
                onChartPointClick={setHighlightedResourceRef}
                activeTab={activeResourceTab}
                onTabChange={setActiveResourceTab}
              />
            </div>
          )}

          {/* Clinical Review Items */}
          {resourceData && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Clinical Review Items</h2>
              <ReviewItemsCard
                selection={resourceData}
                onNavigate={handleNavigateToResource}
                onHighlight={setHighlightedResourceRef}
                className="mb-8"
              />
            </div>
          )}

          {/* Persona Template Configuration */}
          {resourceData && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-4">3. Persona Template Configuration</h2>
              <PersonaTemplateSelector
                resourceData={resourceData}
                selectedPersona={selectedPersona}
                onTemplateChange={handleTemplateChange}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-1 space-y-8">

            {/* Persona Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">4. Select Persona</h2>
              <PersonaToggle
                selectedPersona={selectedPersona}
                onPersonaChange={handlePersonaChange}
                disabled={isGenerating}
              />
            </div>

            {/* Prompt Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">5. Configure Prompt</h2>
              <PromptConfiguration onConfigChange={handlePromptConfigChange} />
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">6. Generate Summary</h2>
              <button
                onClick={generateSummary}
                disabled={!currentBundle || isGenerating}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  !currentBundle || isGenerating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {isGenerating ? 'Generating Summary...' : 'Generate AI Summary'}
              </button>

              {error && (
                <div className={`mt-4 p-4 border rounded-md ${
                  error.errorType === 'capacity' || error.errorType === 'rate_limit'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                      error.errorType === 'capacity' || error.errorType === 'rate_limit'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {error.errorType === 'capacity' || error.errorType === 'rate_limit' ? (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${
                        error.errorType === 'capacity' || error.errorType === 'rate_limit'
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}>
                        {error.errorType === 'capacity' ? 'Claude AI Temporarily Unavailable' :
                         error.errorType === 'rate_limit' ? 'Rate Limit Exceeded' :
                         error.errorType === 'auth' ? 'Authentication Error' :
                         error.errorType === 'invalid_request' ? 'Invalid Request' :
                         'Generation Error'}
                      </h4>
                      <div className={`mt-1 text-sm ${
                        error.errorType === 'capacity' || error.errorType === 'rate_limit'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {error.error}
                      </div>
                      {error.retryable && (
                        <div className="mt-3 flex items-center space-x-3">
                          <button
                            onClick={generateSummary}
                            disabled={isGenerating}
                            className="inline-flex items-center px-3 py-2 border border-yellow-300 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                          >
                            <svg className="-ml-0.5 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            {isGenerating ? 'Retrying...' : 'Try Again'}
                          </button>
                          <span className="text-xs text-yellow-600">
                            This is a temporary issue with Claude&apos;s servers, not the app.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">AI Generated Summary</h2>
              </div>
              <div className="p-6">
                {isGenerating ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Generating {selectedPersona}-focused summary...
                    </p>
                  </div>
                ) : summaryResult ? (
                  <div className="space-y-6">
                    {/* Enhanced Summary Renderer with Provenance */}
                    <SummaryRenderer
                      sections={summaryResult.sections}
                      bundleData={currentBundle}
                      onHighlight={setHighlightedResourceRef}
                      onUnhighlight={() => setHighlightedResourceRef(null)}
                    />

                    {/* Legacy Summary Display */}
                    {(!summaryResult.sections || summaryResult.sections.length === 0) && summaryResult.summary && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Legacy Summary</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{summaryResult.summary}</p>
                      </div>
                    )}

                    {/* Export Options */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Export Options</h3>
                        <ShareButton
                          summaryData={summaryResult}
                          reviewItems={[]}
                          bundleId={`bundle-${Date.now()}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload('txt')}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Download TXT
                        </button>
                        <button
                          onClick={() => handleDownload('json')}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Download JSON
                        </button>
                        <button
                          onClick={() => handleDownload('fhir')}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Download FHIR
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    {summaryResult.metadata && (
                      <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Generated: {new Date(summaryResult.metadata.timestamp).toLocaleString()}</div>
                          <div>Persona: {summaryResult.metadata.persona || selectedPersona}</div>
                          {summaryResult.metadata.totalProcessingTime && (
                            <div>Processing: {summaryResult.metadata.totalProcessingTime}ms</div>
                          )}
                          {summaryResult.metadata.templateUsed && (
                            <div>Template: {summaryResult.metadata.templateUsed}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Upload a FHIR bundle and generate a summary to see results</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-gray-500">
            <p>Built with Next.js, TypeScript, and Claude AI</p>
            <p className="mt-1">
              For demo purposes only. Do not use with real patient data.
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}