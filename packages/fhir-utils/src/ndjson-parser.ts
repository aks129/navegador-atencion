/**
 * NDJSON (Newline Delimited JSON) Parser for FHIR Resources
 *
 * NDJSON format is commonly used in FHIR Bulk Data exports where each line
 * contains a separate JSON-encoded FHIR resource.
 *
 * This parser reads NDJSON content and combines resources into a FHIR Bundle.
 */

import type { FHIRBundle, FHIRResource, FHIRBundleEntry } from './types'

export interface NDJSONParseOptions {
  /** Skip invalid JSON lines instead of failing (default: true) */
  skipInvalidLines?: boolean
  /** Maximum number of resources to parse (default: unlimited) */
  maxResources?: number
  /** Filter to only include specific resource types */
  resourceTypes?: string[]
}

export interface NDJSONParseResult {
  success: boolean
  bundle?: FHIRBundle
  resourceCount: number
  lineCount: number
  skippedLines: number
  resourceTypes: Record<string, number>
  errors: string[]
  warnings: string[]
}

/**
 * Parse NDJSON content into a FHIR Bundle
 * Each line should contain a valid JSON-encoded FHIR resource
 */
export function parseNDJSON(
  content: string,
  options: NDJSONParseOptions = {}
): NDJSONParseResult {
  const {
    skipInvalidLines = true,
    maxResources,
    resourceTypes
  } = options

  const errors: string[] = []
  const warnings: string[] = []
  const resourceTypeCounts: Record<string, number> = {}
  const entries: FHIRBundleEntry[] = []

  // Split content into lines, filtering out empty lines
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  const lineCount = lines.length

  if (lineCount === 0) {
    return {
      success: false,
      resourceCount: 0,
      lineCount: 0,
      skippedLines: 0,
      resourceTypes: {},
      errors: ['NDJSON file is empty or contains no valid lines'],
      warnings: []
    }
  }

  let skippedLines = 0
  let resourcesParsed = 0

  for (let i = 0; i < lines.length; i++) {
    // Check max resources limit
    if (maxResources && resourcesParsed >= maxResources) {
      warnings.push(`Stopped at ${maxResources} resources (limit reached). ${lines.length - i} lines remaining.`)
      break
    }

    const line = lines[i].trim()
    const lineNumber = i + 1

    try {
      const resource = JSON.parse(line)

      // Validate it's a FHIR resource (must have resourceType)
      if (!resource || typeof resource !== 'object') {
        if (skipInvalidLines) {
          skippedLines++
          warnings.push(`Line ${lineNumber}: Not a valid object, skipped`)
          continue
        } else {
          errors.push(`Line ${lineNumber}: Not a valid object`)
          return {
            success: false,
            resourceCount: resourcesParsed,
            lineCount,
            skippedLines,
            resourceTypes: resourceTypeCounts,
            errors,
            warnings
          }
        }
      }

      if (!resource.resourceType || typeof resource.resourceType !== 'string') {
        if (skipInvalidLines) {
          skippedLines++
          warnings.push(`Line ${lineNumber}: Missing resourceType, skipped`)
          continue
        } else {
          errors.push(`Line ${lineNumber}: Missing resourceType property`)
          return {
            success: false,
            resourceCount: resourcesParsed,
            lineCount,
            skippedLines,
            resourceTypes: resourceTypeCounts,
            errors,
            warnings
          }
        }
      }

      // Filter by resource type if specified
      if (resourceTypes && resourceTypes.length > 0) {
        if (!resourceTypes.includes(resource.resourceType)) {
          skippedLines++
          continue // Silently skip non-matching resource types
        }
      }

      // Track resource type counts
      resourceTypeCounts[resource.resourceType] = (resourceTypeCounts[resource.resourceType] || 0) + 1

      // Add to bundle entries
      entries.push({
        resource: resource as unknown as FHIRResource,
        fullUrl: resource.id ? `urn:uuid:${resource.id}` : undefined
      })

      resourcesParsed++

    } catch (parseError) {
      if (skipInvalidLines) {
        skippedLines++
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error'
        warnings.push(`Line ${lineNumber}: JSON parse error - ${errorMessage}`)
      } else {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error'
        errors.push(`Line ${lineNumber}: JSON parse error - ${errorMessage}`)
        return {
          success: false,
          resourceCount: resourcesParsed,
          lineCount,
          skippedLines,
          resourceTypes: resourceTypeCounts,
          errors,
          warnings
        }
      }
    }
  }

  if (entries.length === 0) {
    return {
      success: false,
      resourceCount: 0,
      lineCount,
      skippedLines,
      resourceTypes: resourceTypeCounts,
      errors: ['No valid FHIR resources found in NDJSON content'],
      warnings
    }
  }

  // Create the FHIR Bundle
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    total: entries.length,
    entry: entries
  }

  // Add informational warning about conversion
  if (skippedLines > 0) {
    warnings.push(`${skippedLines} line(s) were skipped due to errors or filtering`)
  }

  return {
    success: true,
    bundle,
    resourceCount: entries.length,
    lineCount,
    skippedLines,
    resourceTypes: resourceTypeCounts,
    errors,
    warnings
  }
}

/**
 * Check if content appears to be NDJSON format
 * (multiple lines where each line is valid JSON)
 */
export function isNDJSONContent(content: string): boolean {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)

  if (lines.length < 1) return false

  // Check first few lines to determine format
  const linesToCheck = Math.min(lines.length, 3)

  for (let i = 0; i < linesToCheck; i++) {
    try {
      const parsed = JSON.parse(lines[i])
      // Each line should be an object with resourceType (FHIR resource)
      if (!parsed || typeof parsed !== 'object' || !parsed.resourceType) {
        return false
      }
    } catch {
      return false
    }
  }

  return true
}

/**
 * Convert a FHIR Bundle to NDJSON format
 * Useful for exporting data in NDJSON format
 */
export function bundleToNDJSON(bundle: FHIRBundle): string {
  if (!bundle.entry || bundle.entry.length === 0) {
    return ''
  }

  return bundle.entry
    .filter(entry => entry.resource)
    .map(entry => JSON.stringify(entry.resource))
    .join('\n')
}
