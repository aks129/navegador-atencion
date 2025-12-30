/**
 * CSV/Excel Parser for Healthcare Data
 * Converts tabular data to FHIR resources for summarization
 * All processing is stateless - no data is stored
 */

import type { FHIRBundle, FHIRResource, FHIRBundleEntry } from './types';

export interface CSVParseOptions {
  /** Delimiter character (default: auto-detect) */
  delimiter?: string;
  /** Whether first row contains headers (default: true) */
  hasHeaders?: boolean;
  /** Column mapping configuration */
  columnMapping?: ColumnMapping;
  /** Data type hint for auto-detection */
  dataTypeHint?: 'patient' | 'observations' | 'conditions' | 'medications' | 'mixed';
}

export interface ColumnMapping {
  // Patient fields
  patientId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  birthDate?: string;
  gender?: string;
  mrn?: string;
  ssn?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Observation/Lab fields
  observationType?: string;
  observationCode?: string;
  observationValue?: string;
  observationUnit?: string;
  observationDate?: string;
  observationStatus?: string;
  loincCode?: string;

  // Condition fields
  conditionCode?: string;
  conditionName?: string;
  conditionStatus?: string;
  onsetDate?: string;
  icd10Code?: string;
  snomedCode?: string;

  // Medication fields
  medicationName?: string;
  medicationCode?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  prescribedDate?: string;
  rxNormCode?: string;

  // Encounter fields
  encounterDate?: string;
  encounterType?: string;
  encounterLocation?: string;
  provider?: string;
}

export interface CSVParseResult {
  success: boolean;
  bundle?: FHIRBundle;
  rowCount: number;
  columnCount: number;
  detectedColumns: string[];
  mappedFields: string[];
  errors: string[];
  warnings: string[];
}

// Common column name patterns for auto-detection
const COLUMN_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  patientId: [/patient[\s_-]?id/i, /^id$/i, /^pid$/i],
  firstName: [/first[\s_-]?name/i, /given[\s_-]?name/i, /^first$/i],
  lastName: [/last[\s_-]?name/i, /family[\s_-]?name/i, /surname/i, /^last$/i],
  fullName: [/^name$/i, /full[\s_-]?name/i, /patient[\s_-]?name/i],
  birthDate: [/birth[\s_-]?date/i, /dob/i, /date[\s_-]?of[\s_-]?birth/i, /^dob$/i],
  gender: [/gender/i, /sex/i, /^m\/f$/i],
  mrn: [/mrn/i, /medical[\s_-]?record/i, /chart[\s_-]?number/i],
  ssn: [/ssn/i, /social[\s_-]?security/i],
  phone: [/phone/i, /telephone/i, /mobile/i, /cell/i],
  email: [/email/i, /e[\s_-]?mail/i],
  address: [/address/i, /street/i, /^addr$/i],
  city: [/city/i, /town/i],
  state: [/state/i, /province/i, /^st$/i],
  zipCode: [/zip/i, /postal/i, /postcode/i],

  observationType: [/observation[\s_-]?type/i, /test[\s_-]?name/i, /lab[\s_-]?name/i],
  observationCode: [/observation[\s_-]?code/i, /test[\s_-]?code/i],
  observationValue: [/value/i, /result/i, /reading/i],
  observationUnit: [/unit/i, /uom/i],
  observationDate: [/observation[\s_-]?date/i, /test[\s_-]?date/i, /result[\s_-]?date/i, /collected[\s_-]?date/i],
  observationStatus: [/observation[\s_-]?status/i, /test[\s_-]?status/i],
  loincCode: [/loinc/i],

  conditionCode: [/condition[\s_-]?code/i, /diagnosis[\s_-]?code/i],
  conditionName: [/condition/i, /diagnosis/i, /problem/i],
  conditionStatus: [/condition[\s_-]?status/i, /clinical[\s_-]?status/i],
  onsetDate: [/onset/i, /diagnosed[\s_-]?date/i, /diagnosis[\s_-]?date/i],
  icd10Code: [/icd[\s_-]?10/i, /icd10/i],
  snomedCode: [/snomed/i],

  medicationName: [/medication/i, /drug/i, /medicine/i, /rx[\s_-]?name/i],
  medicationCode: [/medication[\s_-]?code/i, /drug[\s_-]?code/i, /ndc/i],
  dosage: [/dosage/i, /dose/i, /strength/i],
  frequency: [/frequency/i, /how[\s_-]?often/i, /schedule/i],
  route: [/route/i, /administration/i],
  prescribedDate: [/prescribed/i, /rx[\s_-]?date/i, /start[\s_-]?date/i],
  rxNormCode: [/rxnorm/i, /rx[\s_-]?norm/i],

  encounterDate: [/encounter[\s_-]?date/i, /visit[\s_-]?date/i, /appointment/i],
  encounterType: [/encounter[\s_-]?type/i, /visit[\s_-]?type/i],
  encounterLocation: [/location/i, /facility/i, /department/i],
  provider: [/provider/i, /physician/i, /doctor/i, /clinician/i]
};

/**
 * Detect delimiter from CSV content
 */
function detectDelimiter(content: string): string {
  const firstLine = content.split('\n')[0] || '';
  const delimiters = [',', '\t', ';', '|'];
  const counts = delimiters.map(d => ({
    delimiter: d,
    count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
  }));

  const best = counts.reduce((a, b) => a.count > b.count ? a : b);
  return best.count > 0 ? best.delimiter : ',';
}

/**
 * Parse CSV content into rows
 */
function parseCSVContent(content: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip LF after CR
      }
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      }
    } else {
      currentCell += char;
    }
  }

  // Handle last row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Auto-detect column mappings based on header names
 */
function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (const header of headers) {
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          (mapping as Record<string, string>)[field] = header;
          break;
        }
      }
    }
  }

  return mapping;
}

/**
 * Generate a unique ID for resources
 */
function generateId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Try various date formats
  const formats = [
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // US format MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // US format MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // European format DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }

  // Try native date parsing as fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Create a FHIR Patient resource from row data
 */
function createPatientResource(row: Record<string, string>, mapping: ColumnMapping): FHIRResource | null {
  const hasPatientData = mapping.firstName || mapping.lastName || mapping.fullName ||
    mapping.birthDate || mapping.gender || mapping.mrn;

  if (!hasPatientData) return null;

  const patient: Record<string, unknown> = {
    resourceType: 'Patient',
    id: generateId()
  };

  // Name
  if (mapping.fullName && row[mapping.fullName]) {
    const nameParts = row[mapping.fullName].split(/\s+/);
    patient.name = [{
      text: row[mapping.fullName],
      family: nameParts[nameParts.length - 1],
      given: nameParts.slice(0, -1)
    }];
  } else if (mapping.firstName || mapping.lastName) {
    patient.name = [{
      family: mapping.lastName ? row[mapping.lastName] : undefined,
      given: mapping.firstName ? [row[mapping.firstName]] : undefined
    }];
  }

  // Birth date
  if (mapping.birthDate && row[mapping.birthDate]) {
    patient.birthDate = parseDate(row[mapping.birthDate]);
  }

  // Gender
  if (mapping.gender && row[mapping.gender]) {
    const genderValue = row[mapping.gender].toLowerCase();
    if (genderValue.startsWith('m')) patient.gender = 'male';
    else if (genderValue.startsWith('f')) patient.gender = 'female';
    else if (genderValue === 'other' || genderValue === 'o') patient.gender = 'other';
    else patient.gender = 'unknown';
  }

  // Identifiers
  const identifiers: Array<Record<string, string>> = [];
  if (mapping.mrn && row[mapping.mrn]) {
    identifiers.push({
      system: 'http://hospital.example.org/mrn',
      value: row[mapping.mrn]
    });
  }
  if (identifiers.length > 0) {
    patient.identifier = identifiers;
  }

  // Telecom
  const telecom: Array<Record<string, string>> = [];
  if (mapping.phone && row[mapping.phone]) {
    telecom.push({ system: 'phone', value: row[mapping.phone] });
  }
  if (mapping.email && row[mapping.email]) {
    telecom.push({ system: 'email', value: row[mapping.email] });
  }
  if (telecom.length > 0) {
    patient.telecom = telecom;
  }

  // Address
  if (mapping.address || mapping.city || mapping.state || mapping.zipCode) {
    patient.address = [{
      line: mapping.address && row[mapping.address] ? [row[mapping.address]] : undefined,
      city: mapping.city ? row[mapping.city] : undefined,
      state: mapping.state ? row[mapping.state] : undefined,
      postalCode: mapping.zipCode ? row[mapping.zipCode] : undefined
    }];
  }

  return patient as unknown as FHIRResource;
}

/**
 * Create a FHIR Observation resource from row data
 */
function createObservationResource(row: Record<string, string>, mapping: ColumnMapping, patientRef?: string): FHIRResource | null {
  const hasObservationData = mapping.observationType || mapping.observationValue || mapping.loincCode;

  if (!hasObservationData) return null;

  const observation: Record<string, unknown> = {
    resourceType: 'Observation',
    id: generateId(),
    status: mapping.observationStatus && row[mapping.observationStatus]
      ? row[mapping.observationStatus].toLowerCase()
      : 'final'
  };

  // Code
  const coding: Array<Record<string, string>> = [];
  if (mapping.loincCode && row[mapping.loincCode]) {
    coding.push({
      system: 'http://loinc.org',
      code: row[mapping.loincCode],
      display: mapping.observationType ? row[mapping.observationType] || '' : ''
    });
  } else if (mapping.observationType && row[mapping.observationType]) {
    coding.push({
      display: row[mapping.observationType]
    });
  }

  if (coding.length > 0) {
    observation.code = { coding, text: mapping.observationType ? row[mapping.observationType] : undefined };
  }

  // Value
  if (mapping.observationValue && row[mapping.observationValue]) {
    const value = row[mapping.observationValue];
    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      observation.valueQuantity = {
        value: numValue,
        unit: mapping.observationUnit && row[mapping.observationUnit] ? row[mapping.observationUnit] : undefined
      };
    } else {
      observation.valueString = value;
    }
  }

  // Date
  if (mapping.observationDate && row[mapping.observationDate]) {
    observation.effectiveDateTime = parseDate(row[mapping.observationDate]);
  }

  // Subject reference
  if (patientRef) {
    observation.subject = { reference: patientRef };
  }

  return observation as unknown as FHIRResource;
}

/**
 * Create a FHIR Condition resource from row data
 */
function createConditionResource(row: Record<string, string>, mapping: ColumnMapping, patientRef?: string): FHIRResource | null {
  const hasConditionData = mapping.conditionName || mapping.icd10Code || mapping.snomedCode;

  if (!hasConditionData) return null;

  const condition: Record<string, unknown> = {
    resourceType: 'Condition',
    id: generateId(),
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: mapping.conditionStatus && row[mapping.conditionStatus]
          ? row[mapping.conditionStatus].toLowerCase()
          : 'active'
      }]
    }
  };

  // Code
  const coding: Array<Record<string, string>> = [];
  if (mapping.icd10Code && row[mapping.icd10Code]) {
    coding.push({
      system: 'http://hl7.org/fhir/sid/icd-10-cm',
      code: row[mapping.icd10Code],
      display: mapping.conditionName ? row[mapping.conditionName] || '' : ''
    });
  }
  if (mapping.snomedCode && row[mapping.snomedCode]) {
    coding.push({
      system: 'http://snomed.info/sct',
      code: row[mapping.snomedCode],
      display: mapping.conditionName ? row[mapping.conditionName] || '' : ''
    });
  }
  if (coding.length === 0 && mapping.conditionName && row[mapping.conditionName]) {
    coding.push({
      display: row[mapping.conditionName]
    });
  }

  if (coding.length > 0) {
    condition.code = { coding, text: mapping.conditionName ? row[mapping.conditionName] : undefined };
  }

  // Onset date
  if (mapping.onsetDate && row[mapping.onsetDate]) {
    condition.onsetDateTime = parseDate(row[mapping.onsetDate]);
  }

  // Subject reference
  if (patientRef) {
    condition.subject = { reference: patientRef };
  }

  return condition as unknown as FHIRResource;
}

/**
 * Create a FHIR MedicationRequest resource from row data
 */
function createMedicationResource(row: Record<string, string>, mapping: ColumnMapping, patientRef?: string): FHIRResource | null {
  const hasMedicationData = mapping.medicationName || mapping.rxNormCode;

  if (!hasMedicationData) return null;

  const medication: Record<string, unknown> = {
    resourceType: 'MedicationRequest',
    id: generateId(),
    status: 'active',
    intent: 'order'
  };

  // Medication codeable concept
  const coding: Array<Record<string, string>> = [];
  if (mapping.rxNormCode && row[mapping.rxNormCode]) {
    coding.push({
      system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
      code: row[mapping.rxNormCode],
      display: mapping.medicationName ? row[mapping.medicationName] || '' : ''
    });
  } else if (mapping.medicationName && row[mapping.medicationName]) {
    coding.push({
      display: row[mapping.medicationName]
    });
  }

  if (coding.length > 0) {
    medication.medicationCodeableConcept = {
      coding,
      text: mapping.medicationName ? row[mapping.medicationName] : undefined
    };
  }

  // Dosage instructions
  const dosageInstruction: Record<string, unknown> = {};
  if (mapping.dosage && row[mapping.dosage]) {
    dosageInstruction.text = row[mapping.dosage];
  }
  if (mapping.frequency && row[mapping.frequency]) {
    dosageInstruction.timing = { code: { text: row[mapping.frequency] } };
  }
  if (mapping.route && row[mapping.route]) {
    dosageInstruction.route = { text: row[mapping.route] };
  }
  if (Object.keys(dosageInstruction).length > 0) {
    medication.dosageInstruction = [dosageInstruction];
  }

  // Authored date
  if (mapping.prescribedDate && row[mapping.prescribedDate]) {
    medication.authoredOn = parseDate(row[mapping.prescribedDate]);
  }

  // Subject reference
  if (patientRef) {
    medication.subject = { reference: patientRef };
  }

  return medication as unknown as FHIRResource;
}

/**
 * Parse CSV content and convert to FHIR Bundle
 * All processing is stateless - no data is stored
 */
export function parseCSV(content: string, options: CSVParseOptions = {}): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content || typeof content !== 'string') {
    return {
      success: false,
      rowCount: 0,
      columnCount: 0,
      detectedColumns: [],
      mappedFields: [],
      errors: ['Empty or invalid content provided'],
      warnings: []
    };
  }

  try {
    // Detect delimiter
    const delimiter = options.delimiter || detectDelimiter(content);

    // Parse CSV
    const rows = parseCSVContent(content, delimiter);

    if (rows.length === 0) {
      return {
        success: false,
        rowCount: 0,
        columnCount: 0,
        detectedColumns: [],
        mappedFields: [],
        errors: ['No data rows found in CSV'],
        warnings: []
      };
    }

    // Extract headers
    const hasHeaders = options.hasHeaders !== false;
    const headers = hasHeaders ? rows[0] : rows[0].map((_, i) => `column_${i}`);
    const dataRows = hasHeaders ? rows.slice(1) : rows;

    if (dataRows.length === 0) {
      return {
        success: false,
        rowCount: 0,
        columnCount: headers.length,
        detectedColumns: headers,
        mappedFields: [],
        errors: ['No data rows found after header'],
        warnings: []
      };
    }

    // Determine column mapping
    const mapping = options.columnMapping || autoDetectColumnMapping(headers);
    const mappedFields = Object.entries(mapping)
      .filter(([, value]) => value)
      .map(([key]) => key);

    if (mappedFields.length === 0) {
      warnings.push('No columns could be automatically mapped to FHIR fields. Consider providing explicit column mappings.');
    }

    // Create FHIR Bundle
    const entries: FHIRBundleEntry[] = [];
    let patientRef: string | undefined;

    // Process data rows
    for (const row of dataRows) {
      // Convert row array to object with header keys
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });

      // Create Patient resource (once, from first row with patient data)
      if (!patientRef) {
        const patient = createPatientResource(rowData, mapping);
        if (patient) {
          patientRef = `Patient/${patient.id}`;
          entries.push({ resource: patient, fullUrl: `urn:uuid:${patient.id}` });
        }
      }

      // Create Observation
      const observation = createObservationResource(rowData, mapping, patientRef);
      if (observation) {
        entries.push({ resource: observation, fullUrl: `urn:uuid:${observation.id}` });
      }

      // Create Condition
      const condition = createConditionResource(rowData, mapping, patientRef);
      if (condition) {
        entries.push({ resource: condition, fullUrl: `urn:uuid:${condition.id}` });
      }

      // Create Medication
      const medication = createMedicationResource(rowData, mapping, patientRef);
      if (medication) {
        entries.push({ resource: medication, fullUrl: `urn:uuid:${medication.id}` });
      }
    }

    if (entries.length === 0) {
      return {
        success: false,
        rowCount: dataRows.length,
        columnCount: headers.length,
        detectedColumns: headers,
        mappedFields,
        errors: ['Could not create any FHIR resources from CSV data'],
        warnings
      };
    }

    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: generateId(),
      type: 'collection',
      entry: entries,
      total: entries.length
    };

    return {
      success: true,
      bundle,
      rowCount: dataRows.length,
      columnCount: headers.length,
      detectedColumns: headers,
      mappedFields,
      errors,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      rowCount: 0,
      columnCount: 0,
      detectedColumns: [],
      mappedFields: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Validate that content appears to be CSV format
 */
export function isCSVContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return false;

  // Check for consistent delimiter usage
  const delimiter = detectDelimiter(content);
  const firstLineCols = (lines[0].match(new RegExp(`\\${delimiter}`, 'g')) || []).length + 1;
  const secondLineCols = (lines[1].match(new RegExp(`\\${delimiter}`, 'g')) || []).length + 1;

  return firstLineCols > 1 && Math.abs(firstLineCols - secondLineCols) <= 1;
}

/**
 * Get supported file extensions
 */
export function getSupportedCSVExtensions(): string[] {
  return ['.csv', '.tsv', '.txt'];
}

/**
 * Get supported MIME types
 */
export function getSupportedCSVMimeTypes(): string[] {
  return [
    'text/csv',
    'text/tab-separated-values',
    'text/plain',
    'application/csv'
  ];
}
