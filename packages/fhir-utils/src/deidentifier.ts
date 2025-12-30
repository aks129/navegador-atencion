/**
 * De-identification module for removing/masking PHI (Protected Health Information)
 * Follows HIPAA Safe Harbor de-identification guidelines
 * All processing is stateless - no data is stored
 */

export interface DeidentificationOptions {
  /** Remove patient names */
  removeNames?: boolean;
  /** Remove dates (birth dates, encounter dates) - converts to year only or age ranges */
  maskDates?: boolean;
  /** Remove geographic data smaller than state */
  removeGeographicData?: boolean;
  /** Remove phone numbers, fax numbers */
  removePhoneNumbers?: boolean;
  /** Remove email addresses */
  removeEmails?: boolean;
  /** Remove SSN, MRN, and other identifiers */
  removeIdentifiers?: boolean;
  /** Remove IP addresses and URLs */
  removeNetworkIdentifiers?: boolean;
  /** Mask account numbers and device identifiers */
  maskAccountNumbers?: boolean;
  /** Replace with placeholder text instead of removing entirely */
  usePlaceholders?: boolean;
}

export interface DeidentificationResult {
  /** The de-identified data */
  data: unknown;
  /** Fields that were modified */
  modifiedFields: string[];
  /** Count of PHI elements removed/masked */
  phiElementsProcessed: number;
  /** Warnings about potential remaining PHI */
  warnings: string[];
}

const DEFAULT_OPTIONS: DeidentificationOptions = {
  removeNames: true,
  maskDates: true,
  removeGeographicData: true,
  removePhoneNumbers: true,
  removeEmails: true,
  removeIdentifiers: true,
  removeNetworkIdentifiers: true,
  maskAccountNumbers: true,
  usePlaceholders: true
};

// Regex patterns for PHI detection
const PHI_PATTERNS = {
  // SSN patterns: XXX-XX-XXXX or XXXXXXXXX
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  // Phone numbers: various formats
  phone: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // IP addresses
  ipAddress: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  // URLs
  url: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
  // Credit card numbers (basic pattern)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  // Medical record numbers (common patterns)
  mrn: /\b(?:MRN|mrn|Medical Record|medical record)[\s:]*[A-Z0-9-]+\b/gi,
  // ZIP codes (5+4 format)
  zipCode: /\b\d{5}(?:-\d{4})?\b/g,
  // Dates in various formats
  dates: /\b(?:\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/g
};

// FHIR identifier system URIs that indicate sensitive identifiers
const SENSITIVE_IDENTIFIER_SYSTEMS = [
  'http://hl7.org/fhir/sid/us-ssn',
  'urn:oid:2.16.840.1.113883.4.1', // SSN OID
  'http://hl7.org/fhir/sid/us-medicare',
  'http://hl7.org/fhir/sid/us-medicaid',
  'urn:oid:2.16.840.1.113883.3.4424', // MRN systems
];

// Fields in FHIR resources that commonly contain PHI
const PHI_FIELDS = {
  Patient: [
    'name', 'telecom', 'address', 'birthDate', 'identifier',
    'photo', 'contact', 'maritalStatus'
  ],
  Practitioner: ['name', 'telecom', 'address', 'identifier', 'photo'],
  RelatedPerson: ['name', 'telecom', 'address', 'identifier', 'photo', 'birthDate'],
  Organization: ['telecom', 'address', 'identifier'],
  Location: ['telecom', 'address', 'position']
};

/**
 * De-identify text by removing/masking common PHI patterns
 */
export function deidentifyText(text: string, options: DeidentificationOptions = DEFAULT_OPTIONS): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;
  const placeholder = options.usePlaceholders ? '[REDACTED]' : '';

  if (options.removeIdentifiers) {
    result = result.replace(PHI_PATTERNS.ssn, placeholder || '***-**-****');
    result = result.replace(PHI_PATTERNS.mrn, placeholder || 'MRN:[REDACTED]');
    result = result.replace(PHI_PATTERNS.creditCard, placeholder || '****-****-****-****');
  }

  if (options.removePhoneNumbers) {
    result = result.replace(PHI_PATTERNS.phone, placeholder || '(***) ***-****');
  }

  if (options.removeEmails) {
    result = result.replace(PHI_PATTERNS.email, placeholder || '***@***.***');
  }

  if (options.removeNetworkIdentifiers) {
    result = result.replace(PHI_PATTERNS.ipAddress, placeholder || '***.***.***.***');
    result = result.replace(PHI_PATTERNS.url, placeholder || '[URL REDACTED]');
  }

  if (options.removeGeographicData) {
    // Only mask full ZIP codes, keep first 3 digits for geographic context
    result = result.replace(/\b(\d{3})\d{2}(?:-\d{4})?\b/g, options.usePlaceholders ? '$1XX' : '$100');
  }

  return result;
}

/**
 * Mask a date to reduce precision (year only or age range)
 */
export function maskDate(dateString: string): string {
  if (!dateString) return dateString;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    // Return only the year
    return date.getFullYear().toString();
  } catch {
    return dateString;
  }
}

/**
 * Calculate age range from birth date (for de-identification)
 */
export function calculateAgeRange(birthDate: string): string {
  if (!birthDate) return 'Unknown';

  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'Unknown';

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // HIPAA allows ages under 90 to be disclosed
    if (age >= 90) {
      return '90+';
    }

    // Return age ranges for additional privacy
    const ranges = [
      [0, 17, '0-17'],
      [18, 29, '18-29'],
      [30, 39, '30-39'],
      [40, 49, '40-49'],
      [50, 59, '50-59'],
      [60, 69, '60-69'],
      [70, 79, '70-79'],
      [80, 89, '80-89']
    ] as const;

    for (const [min, max, label] of ranges) {
      if (age >= min && age <= max) {
        return label;
      }
    }

    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * De-identify a FHIR Patient resource
 */
function deidentifyPatient(patient: Record<string, unknown>, options: DeidentificationOptions): { modified: string[], data: Record<string, unknown> } {
  const modified: string[] = [];
  const result = { ...patient };
  const placeholder = options.usePlaceholders;

  // Remove/mask name
  if (options.removeNames && result.name) {
    result.name = placeholder
      ? [{ text: '[NAME REDACTED]', family: '[REDACTED]', given: ['[REDACTED]'] }]
      : undefined;
    modified.push('name');
  }

  // Mask birthDate
  if (options.maskDates && result.birthDate) {
    const ageRange = calculateAgeRange(result.birthDate as string);
    result.birthDate = undefined;
    // Add extension for age range
    result.extension = [
      ...(Array.isArray(result.extension) ? result.extension : []),
      {
        url: 'http://plumly.com/fhir/extension/age-range',
        valueString: ageRange
      }
    ];
    modified.push('birthDate');
  }

  // Remove telecom (phone, email, etc.)
  if ((options.removePhoneNumbers || options.removeEmails) && result.telecom) {
    result.telecom = placeholder
      ? [{ system: 'other', value: '[REDACTED]' }]
      : undefined;
    modified.push('telecom');
  }

  // Remove address
  if (options.removeGeographicData && result.address) {
    if (placeholder) {
      // Keep state and partial ZIP for geographic context
      result.address = (result.address as Array<Record<string, unknown>>).map(addr => ({
        state: addr.state,
        postalCode: addr.postalCode ? (addr.postalCode as string).substring(0, 3) + 'XX' : undefined,
        country: addr.country
      }));
    } else {
      result.address = undefined;
    }
    modified.push('address');
  }

  // Remove/mask identifiers
  if (options.removeIdentifiers && result.identifier) {
    result.identifier = (result.identifier as Array<Record<string, unknown>>).filter(id => {
      const system = id.system as string;
      // Remove sensitive identifier types
      return !SENSITIVE_IDENTIFIER_SYSTEMS.some(s => system?.includes(s));
    }).map(id => ({
      ...id,
      value: placeholder ? '[REDACTED]' : '***'
    }));
    modified.push('identifier');
  }

  // Remove photo
  if (result.photo) {
    result.photo = undefined;
    modified.push('photo');
  }

  return { modified, data: result };
}

/**
 * De-identify a FHIR resource (generic)
 */
function deidentifyResource(resource: Record<string, unknown>, options: DeidentificationOptions): { modified: string[], data: Record<string, unknown> } {
  const modified: string[] = [];
  const result = { ...resource };

  // Handle Patient resources specially
  if (resource.resourceType === 'Patient') {
    return deidentifyPatient(resource, options);
  }

  // For other resources, scan for common PHI fields
  const resourceType = resource.resourceType as string;
  const phiFields = PHI_FIELDS[resourceType as keyof typeof PHI_FIELDS] || [];

  for (const field of phiFields) {
    if (result[field]) {
      if (field === 'name' && options.removeNames) {
        result[field] = options.usePlaceholders ? [{ text: '[REDACTED]' }] : undefined;
        modified.push(field);
      } else if (field === 'telecom' && (options.removePhoneNumbers || options.removeEmails)) {
        result[field] = options.usePlaceholders ? [{ value: '[REDACTED]' }] : undefined;
        modified.push(field);
      } else if (field === 'address' && options.removeGeographicData) {
        result[field] = options.usePlaceholders ? [{ text: '[REDACTED]' }] : undefined;
        modified.push(field);
      } else if (field === 'identifier' && options.removeIdentifiers) {
        result[field] = options.usePlaceholders ? [{ value: '[REDACTED]' }] : undefined;
        modified.push(field);
      } else if (field === 'birthDate' && options.maskDates) {
        result[field] = maskDate(result[field] as string);
        modified.push(field);
      } else if (field === 'photo') {
        result[field] = undefined;
        modified.push(field);
      }
    }
  }

  // Scan text/narrative fields for PHI patterns
  if (result.text && typeof (result.text as Record<string, unknown>).div === 'string') {
    const textObj = result.text as Record<string, unknown>;
    textObj.div = deidentifyText(textObj.div as string, options);
    modified.push('text.div');
  }

  return { modified, data: result };
}

/**
 * De-identify a FHIR Bundle
 * All processing is stateless - original data is not modified
 */
export function deidentifyFHIRBundle(
  bundle: Record<string, unknown>,
  options: DeidentificationOptions = DEFAULT_OPTIONS
): DeidentificationResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const modifiedFields: string[] = [];
  let phiElementsProcessed = 0;
  const warnings: string[] = [];

  // Create a deep copy to ensure stateless processing
  const result = JSON.parse(JSON.stringify(bundle));

  if (!result.entry || !Array.isArray(result.entry)) {
    return {
      data: result,
      modifiedFields: [],
      phiElementsProcessed: 0,
      warnings: ['Bundle contains no entries']
    };
  }

  // Process each entry
  for (let i = 0; i < result.entry.length; i++) {
    const entry = result.entry[i];
    if (!entry.resource) continue;

    const { modified, data } = deidentifyResource(entry.resource, mergedOptions);

    if (modified.length > 0) {
      result.entry[i].resource = data;
      modifiedFields.push(...modified.map(f => `entry[${i}].resource.${f}`));
      phiElementsProcessed += modified.length;
    }
  }

  // Warn about resources that might still contain PHI
  const resourcesWithPotentialPhi = result.entry
    .filter((e: Record<string, unknown>) => {
      const resource = e.resource as Record<string, unknown>;
      return resource?.resourceType &&
        ['DiagnosticReport', 'DocumentReference', 'Composition'].includes(resource.resourceType as string);
    })
    .map((e: Record<string, unknown>) => (e.resource as Record<string, unknown>)?.resourceType);

  if (resourcesWithPotentialPhi.length > 0) {
    warnings.push(
      `Bundle contains ${resourcesWithPotentialPhi.length} resource(s) that may contain embedded PHI in narrative text: ${[...new Set(resourcesWithPotentialPhi)].join(', ')}`
    );
  }

  return {
    data: result,
    modifiedFields,
    phiElementsProcessed,
    warnings
  };
}

/**
 * De-identify a single FHIR Resource
 */
export function deidentifyFHIRResource(
  resource: Record<string, unknown>,
  options: DeidentificationOptions = DEFAULT_OPTIONS
): DeidentificationResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Create a deep copy to ensure stateless processing
  const resourceCopy = JSON.parse(JSON.stringify(resource));

  const { modified, data } = deidentifyResource(resourceCopy, mergedOptions);

  return {
    data,
    modifiedFields: modified,
    phiElementsProcessed: modified.length,
    warnings: []
  };
}

/**
 * Scan data for potential PHI (detection only, no modification)
 */
export function scanForPHI(data: unknown): { detected: boolean; types: string[]; locations: string[] } {
  const types: string[] = [];
  const locations: string[] = [];

  function scan(obj: unknown, path: string = ''): void {
    if (!obj || typeof obj !== 'object') {
      if (typeof obj === 'string') {
        // Check string for PHI patterns
        if (PHI_PATTERNS.ssn.test(obj)) {
          types.push('SSN');
          locations.push(path);
        }
        if (PHI_PATTERNS.email.test(obj)) {
          types.push('Email');
          locations.push(path);
        }
        if (PHI_PATTERNS.phone.test(obj)) {
          types.push('Phone');
          locations.push(path);
        }
        if (PHI_PATTERNS.mrn.test(obj)) {
          types.push('MRN');
          locations.push(path);
        }
        // Reset regex lastIndex
        PHI_PATTERNS.ssn.lastIndex = 0;
        PHI_PATTERNS.email.lastIndex = 0;
        PHI_PATTERNS.phone.lastIndex = 0;
        PHI_PATTERNS.mrn.lastIndex = 0;
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => scan(item, `${path}[${index}]`));
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;

        // Check for FHIR PHI field names
        if (['name', 'telecom', 'address', 'identifier', 'birthDate', 'photo'].includes(key) && value) {
          types.push(`FHIR ${key}`);
          locations.push(newPath);
        }

        scan(value, newPath);
      }
    }
  }

  scan(data);

  return {
    detected: types.length > 0,
    types: [...new Set(types)],
    locations: [...new Set(locations)]
  };
}
