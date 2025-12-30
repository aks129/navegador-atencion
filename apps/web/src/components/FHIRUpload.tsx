'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Upload, FileText, AlertCircle, CheckCircle, X, Shield, FileSpreadsheet } from 'lucide-react'
import {
  validateUploadedFile,
  validateFileSize,
  validateExtendedFileType,
  getAcceptedFileTypes,
  parseCSV,
  deidentifyFHIRBundle,
  deidentifyFHIRResource,
  validateFHIRBundle
} from '@plumly/fhir-utils'
import type { ValidationResult, FileUploadResult, SupportedFileType, DeidentificationOptions } from '@plumly/fhir-utils'

interface FHIRUploadProps {
  onFileProcessed?: (result: FileUploadResult) => void
  maxFileSizeMB?: number
  /** Enable de-identification before processing */
  enableDeidentification?: boolean
  /** Custom de-identification options */
  deidentificationOptions?: DeidentificationOptions
}

// Helper function outside component to avoid recreating on each render
function createErrorResult(error: string, startTime: number): FileUploadResult {
  return {
    success: false,
    validation: {
      isValid: false,
      isFHIRBundle: false,
      isIndividualResource: false,
      resourceCounts: {},
      totalResources: 0,
      errors: [error],
      warnings: []
    },
    processingTime: Date.now() - startTime
  }
}

export function FHIRUpload({
  onFileProcessed,
  maxFileSizeMB = 10,
  enableDeidentification: initialDeidentification = true,
  deidentificationOptions
}: FHIRUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [deidentifyEnabled, setDeidentifyEnabled] = useState(initialDeidentification)
  const [lastResult, setLastResult] = useState<FileUploadResult | null>(null)

  const handleFileProcessing = useCallback(async (file: File): Promise<FileUploadResult> => {
    const startTime = Date.now()

    // File size validation
    if (!validateFileSize(file, maxFileSizeMB)) {
      return createErrorResult(`File size exceeds ${maxFileSizeMB}MB limit`, startTime)
    }

    // Detect file type
    const fileType = validateExtendedFileType(file)
    if (!fileType) {
      return createErrorResult(
        'Invalid file type. Please upload a JSON, CSV, TSV, or Excel file',
        startTime
      )
    }

    try {
      let data: unknown
      let validation: ValidationResult

      // Process based on file type
      if (fileType === 'json') {
        // Standard JSON/FHIR processing
        const text = await file.text()
        data = JSON.parse(text)
        validation = validateUploadedFile(data)
      } else if (fileType === 'csv' || fileType === 'tsv') {
        // CSV/TSV processing - convert to FHIR Bundle
        const text = await file.text()
        const csvResult = parseCSV(text, {
          delimiter: fileType === 'tsv' ? '\t' : undefined
        })

        if (!csvResult.success || !csvResult.bundle) {
          return {
            success: false,
            validation: {
              isValid: false,
              isFHIRBundle: false,
              isIndividualResource: false,
              resourceCounts: {},
              totalResources: 0,
              errors: csvResult.errors,
              warnings: csvResult.warnings
            },
            processingTime: Date.now() - startTime,
            sourceFileType: fileType
          }
        }

        data = csvResult.bundle
        validation = validateUploadedFile(data)
        validation.warnings = [...validation.warnings, ...csvResult.warnings]

        // Add info about conversion
        if (csvResult.mappedFields.length > 0) {
          validation.warnings.push(
            `Converted ${csvResult.rowCount} rows with fields: ${csvResult.mappedFields.join(', ')}`
          )
        }
      } else if (fileType === 'excel') {
        // Excel files require server-side processing
        // For now, return an error suggesting to export as CSV
        return createErrorResult(
          'Excel files (.xlsx/.xls) are not yet supported client-side. Please export your data as CSV and upload that instead.',
          startTime
        )
      } else {
        return createErrorResult('Unsupported file type', startTime)
      }

      // Apply de-identification if enabled
      let deidentificationSummary = undefined
      if (deidentifyEnabled && data && validation.isValid) {
        if (validateFHIRBundle(data)) {
          const deidentResult = deidentifyFHIRBundle(
            data as unknown as Record<string, unknown>,
            deidentificationOptions
          )
          data = deidentResult.data
          deidentificationSummary = {
            applied: true,
            phiElementsProcessed: deidentResult.phiElementsProcessed,
            modifiedFields: deidentResult.modifiedFields,
            warnings: deidentResult.warnings
          }
          // Add de-identification warnings to validation
          validation.warnings = [...validation.warnings, ...deidentResult.warnings]
        } else if (validation.isIndividualResource) {
          const deidentResult = deidentifyFHIRResource(
            data as Record<string, unknown>,
            deidentificationOptions
          )
          data = deidentResult.data
          deidentificationSummary = {
            applied: true,
            phiElementsProcessed: deidentResult.phiElementsProcessed,
            modifiedFields: deidentResult.modifiedFields,
            warnings: deidentResult.warnings
          }
          validation.warnings = [...validation.warnings, ...deidentResult.warnings]
        }
      }

      return {
        success: validation.isValid,
        data: validation.isValid ? data as any : undefined,
        validation,
        processingTime: Date.now() - startTime,
        sourceFileType: fileType,
        deidentification: deidentificationSummary
      }
    } catch (error) {
      return createErrorResult(
        `Failed to parse ${fileType.toUpperCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startTime
      )
    }
  }, [maxFileSizeMB, deidentifyEnabled, deidentificationOptions])

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return

    const file = files[0]
    setProcessing(true)

    try {
      const result = await handleFileProcessing(file)
      setLastResult(result)
      onFileProcessed?.(result)
    } finally {
      setProcessing(false)
    }
  }, [handleFileProcessing, onFileProcessed])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const clearResults = useCallback(() => {
    setLastResult(null)
  }, [])

  const getFileTypeIcon = (fileType?: SupportedFileType) => {
    if (fileType === 'csv' || fileType === 'tsv' || fileType === 'excel') {
      return <FileSpreadsheet className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const getFileTypeLabel = (fileType?: SupportedFileType) => {
    switch (fileType) {
      case 'csv': return 'CSV'
      case 'tsv': return 'TSV'
      case 'excel': return 'Excel'
      case 'json': return 'JSON'
      default: return 'Unknown'
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Healthcare Data Upload
          </CardTitle>
          <CardDescription>
            Upload FHIR Bundle, CSV, or spreadsheet files (max {maxFileSizeMB}MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* De-identification toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <Label htmlFor="deidentify-toggle" className="text-sm font-medium cursor-pointer">
                De-identify data before processing
              </Label>
            </div>
            <Switch
              id="deidentify-toggle"
              checked={deidentifyEnabled}
              onCheckedChange={setDeidentifyEnabled}
              aria-label="Toggle de-identification"
            />
          </div>

          {deidentifyEnabled && (
            <p className="text-xs text-muted-foreground px-3">
              PHI (names, dates, identifiers, addresses) will be removed or masked before summarization.
              No original data is stored.
            </p>
          )}

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
            } ${processing ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept={getAcceptedFileTypes()}
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={processing}
              title="Upload healthcare data file"
              aria-label="Upload healthcare data file"
            />

            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  {processing ? 'Processing...' : 'Drop your file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports JSON (FHIR), CSV, TSV files
                </p>
              </div>
              <Button variant="outline" disabled={processing}>
                Choose File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              Upload Results
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearResults} aria-label="Clear results">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                {lastResult.success ? 'Valid' : 'Invalid'}
              </Badge>
              {lastResult.sourceFileType && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {getFileTypeIcon(lastResult.sourceFileType)}
                  {getFileTypeLabel(lastResult.sourceFileType)}
                </Badge>
              )}
              {lastResult.validation.isFHIRBundle && (
                <Badge variant="secondary">FHIR Bundle</Badge>
              )}
              {lastResult.validation.isIndividualResource && (
                <Badge variant="secondary">Individual Resource</Badge>
              )}
              <span className="text-sm text-gray-500">
                Processed in {lastResult.processingTime}ms
              </span>
            </div>

            {/* De-identification results */}
            {lastResult.deidentification?.applied && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    De-identification applied: {lastResult.deidentification.phiElementsProcessed} PHI elements processed
                  </span>
                </div>
                {lastResult.deidentification.modifiedFields.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Modified: {lastResult.deidentification.modifiedFields.slice(0, 5).join(', ')}
                    {lastResult.deidentification.modifiedFields.length > 5 &&
                      ` and ${lastResult.deidentification.modifiedFields.length - 5} more`}
                  </p>
                )}
              </div>
            )}

            {lastResult.validation.totalResources > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Resource Summary ({lastResult.validation.totalResources} total):
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(lastResult.validation.resourceCounts).map(([type, count]) => (
                    <Badge key={type} variant="outline">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {lastResult.validation.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                <ul className="text-sm space-y-1">
                  {lastResult.validation.errors.map((error, index) => (
                    <li key={index} className="text-red-600">• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {lastResult.validation.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-600 mb-2">Warnings:</p>
                <ul className="text-sm space-y-1">
                  {lastResult.validation.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-600">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
