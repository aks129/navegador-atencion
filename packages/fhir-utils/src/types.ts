// FHIR type definitions
export interface FHIRBundle {
  resourceType: 'Bundle';
  id?: string;
  type: string;
  entry?: FHIRBundleEntry[];
  total?: number;
}

export interface FHIRBundleEntry {
  resource?: FHIRResource;
  fullUrl?: string;
}

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  isFHIRBundle: boolean;
  isIndividualResource: boolean;
  resourceCounts: Record<string, number>;
  totalResources: number;
  errors: string[];
  warnings: string[];
}

export interface FileUploadResult {
  success: boolean;
  data?: FHIRBundle | FHIRResource;
  validation: ValidationResult;
  processingTime: number;
  /** Original file type that was uploaded */
  sourceFileType?: 'json' | 'csv' | 'tsv' | 'excel';
  /** De-identification result if applied */
  deidentification?: DeidentificationSummary;
}

export interface DeidentificationSummary {
  /** Whether de-identification was applied */
  applied: boolean;
  /** Number of PHI elements that were processed */
  phiElementsProcessed: number;
  /** Fields that were modified */
  modifiedFields: string[];
  /** Any warnings about potential remaining PHI */
  warnings: string[];
}

export type SupportedFileType = 'json' | 'csv' | 'tsv' | 'excel';

export interface FileTypeInfo {
  type: SupportedFileType;
  mimeTypes: string[];
  extensions: string[];
  description: string;
}

export const SUPPORTED_FILE_TYPES: FileTypeInfo[] = [
  {
    type: 'json',
    mimeTypes: ['application/json'],
    extensions: ['.json'],
    description: 'FHIR Bundle or Resource (JSON)'
  },
  {
    type: 'csv',
    mimeTypes: ['text/csv', 'application/csv'],
    extensions: ['.csv'],
    description: 'Comma-separated values'
  },
  {
    type: 'tsv',
    mimeTypes: ['text/tab-separated-values'],
    extensions: ['.tsv', '.txt'],
    description: 'Tab-separated values'
  },
  {
    type: 'excel',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    extensions: ['.xlsx', '.xls'],
    description: 'Microsoft Excel spreadsheet'
  }
];