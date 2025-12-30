// FHIR validation utilities
import type { FHIRBundle, FHIRResource, ValidationResult } from './types';

export function validateFHIRBundle(bundle: unknown): bundle is FHIRBundle {
  return (
    typeof bundle === 'object' &&
    bundle !== null &&
    'resourceType' in bundle &&
    (bundle as any).resourceType === 'Bundle'
  );
}

export function validateFHIRResource(resource: unknown): resource is FHIRResource {
  return (
    typeof resource === 'object' &&
    resource !== null &&
    'resourceType' in resource &&
    typeof (resource as any).resourceType === 'string' &&
    (resource as any).resourceType !== 'Bundle'
  );
}

export function validateUploadedFile(data: unknown): ValidationResult {
  const startTime = Date.now();
  const result: ValidationResult = {
    isValid: false,
    isFHIRBundle: false,
    isIndividualResource: false,
    resourceCounts: {},
    totalResources: 0,
    errors: [],
    warnings: []
  };

  // Check if data is valid JSON object
  if (!data || typeof data !== 'object') {
    result.errors.push('Invalid JSON: Expected object');
    return result;
  }

  // Check if it's a FHIR Bundle
  if (validateFHIRBundle(data)) {
    result.isFHIRBundle = true;
    result.isValid = true;

    // Count resources by type
    if (data.entry && Array.isArray(data.entry)) {
      for (const entry of data.entry) {
        if (entry.resource && entry.resource.resourceType) {
          const resourceType = entry.resource.resourceType;
          result.resourceCounts[resourceType] = (result.resourceCounts[resourceType] || 0) + 1;
          result.totalResources++;
        }
      }
    }

    // Validate bundle type
    if (!data.type) {
      result.warnings.push('Bundle missing type field');
    }

    // Check for empty bundle
    if (result.totalResources === 0) {
      result.warnings.push('Bundle contains no resources');
    }
  }
  // Check if it's an individual FHIR resource
  else if (validateFHIRResource(data)) {
    result.isIndividualResource = true;
    result.isValid = true;
    result.resourceCounts[data.resourceType] = 1;
    result.totalResources = 1;
  }
  else {
    result.errors.push('Not a valid FHIR Bundle or Resource');
  }

  return result;
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function validateFileType(file: File): boolean {
  return file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
}

/**
 * Validate file type for extended format support (JSON, CSV, Excel)
 * Returns the detected file type or null if unsupported
 */
export function validateExtendedFileType(file: File): 'json' | 'csv' | 'tsv' | 'excel' | null {
  const name = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // JSON (FHIR Bundle/Resource)
  if (mimeType === 'application/json' || name.endsWith('.json')) {
    return 'json';
  }

  // CSV
  if (mimeType === 'text/csv' || mimeType === 'application/csv' || name.endsWith('.csv')) {
    return 'csv';
  }

  // TSV
  if (mimeType === 'text/tab-separated-values' || name.endsWith('.tsv')) {
    return 'tsv';
  }

  // Plain text could be CSV or TSV - we'll need to detect later
  if (mimeType === 'text/plain' && name.endsWith('.txt')) {
    return 'csv'; // Default to CSV, will auto-detect delimiter
  }

  // Excel
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  ) {
    return 'excel';
  }

  return null;
}

/**
 * Get accepted file types string for input element
 */
export function getAcceptedFileTypes(): string {
  return '.json,.csv,.tsv,.txt,.xlsx,.xls,application/json,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
}