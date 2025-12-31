/**
 * FHIR Resource Flattener
 *
 * Converts verbose FHIR resources into flattened, LLM-friendly structures.
 * Inspired by SQL on FHIR approach for context reduction.
 *
 * Goals:
 * - Reduce token count by 80-95% while preserving clinical meaning
 * - Extract only essential fields needed for summarization
 * - Remove redundant nested structures and metadata
 * - Deduplicate coding information
 */

import type { FHIRBundle, FHIRResource, FHIRBundleEntry } from './types'

// Flattened resource types
export interface FlattenedPatient {
  resourceType: 'Patient'
  id?: string
  name?: string
  gender?: string
  birthDate?: string
  age?: number
  address?: string
  phone?: string
  email?: string
  maritalStatus?: string
  language?: string
}

export interface FlattenedObservation {
  resourceType: 'Observation'
  id?: string
  patientId?: string
  date?: string
  category?: string
  code: string
  codeSystem?: string
  display?: string
  value?: string | number
  unit?: string
  interpretation?: string
  referenceRange?: string
  status?: string
}

export interface FlattenedCondition {
  resourceType: 'Condition'
  id?: string
  patientId?: string
  code: string
  codeSystem?: string
  display?: string
  clinicalStatus?: string
  verificationStatus?: string
  severity?: string
  onsetDate?: string
  abatementDate?: string
  category?: string
}

export interface FlattenedMedicationRequest {
  resourceType: 'MedicationRequest'
  id?: string
  patientId?: string
  medication: string
  code?: string
  codeSystem?: string
  status?: string
  intent?: string
  dosage?: string
  frequency?: string
  route?: string
  authoredOn?: string
  requester?: string
  reasonCode?: string
}

export interface FlattenedEncounter {
  resourceType: 'Encounter'
  id?: string
  patientId?: string
  status?: string
  class?: string
  type?: string
  serviceType?: string
  startDate?: string
  endDate?: string
  reasonCode?: string
  diagnosis?: string[]
  location?: string
  provider?: string
}

export interface FlattenedProcedure {
  resourceType: 'Procedure'
  id?: string
  patientId?: string
  code: string
  codeSystem?: string
  display?: string
  status?: string
  performedDate?: string
  category?: string
  outcome?: string
  performer?: string
  location?: string
}

export interface FlattenedAllergyIntolerance {
  resourceType: 'AllergyIntolerance'
  id?: string
  patientId?: string
  substance: string
  code?: string
  clinicalStatus?: string
  verificationStatus?: string
  type?: string
  category?: string
  criticality?: string
  reaction?: string
  severity?: string
  onsetDate?: string
}

export interface FlattenedImmunization {
  resourceType: 'Immunization'
  id?: string
  patientId?: string
  vaccine: string
  code?: string
  status?: string
  date?: string
  lotNumber?: string
  site?: string
  route?: string
  doseQuantity?: string
}

export interface FlattenedDiagnosticReport {
  resourceType: 'DiagnosticReport'
  id?: string
  patientId?: string
  code: string
  display?: string
  status?: string
  category?: string
  effectiveDate?: string
  issuedDate?: string
  conclusion?: string
  resultIds?: string[]
}

export type FlattenedResource =
  | FlattenedPatient
  | FlattenedObservation
  | FlattenedCondition
  | FlattenedMedicationRequest
  | FlattenedEncounter
  | FlattenedProcedure
  | FlattenedAllergyIntolerance
  | FlattenedImmunization
  | FlattenedDiagnosticReport

export interface FlattenedBundle {
  resourceType: 'Bundle'
  type: string
  total: number
  resources: FlattenedResource[]
  summary: {
    patientCount: number
    resourceCounts: Record<string, number>
    dateRange?: { earliest?: string; latest?: string }
  }
}

export interface FlattenerOptions {
  /** Include only these resource types (default: all supported) */
  includeResourceTypes?: string[]
  /** Exclude these resource types */
  excludeResourceTypes?: string[]
  /** Maximum resources per type (for very large bundles) */
  maxResourcesPerType?: number
  /** Include resource IDs (default: true) */
  includeIds?: boolean
  /** Deduplicate similar observations (default: true) */
  deduplicateObservations?: boolean
  /** Only include observations from last N days */
  observationDaysLimit?: number
}

export interface FlattenerResult {
  bundle: FlattenedBundle
  originalSize: number
  flattenedSize: number
  reductionPercent: number
  stats: {
    resourcesProcessed: number
    resourcesSkipped: number
    duplicatesRemoved: number
  }
}

// Helper to extract reference ID
function extractReferenceId(ref: unknown): string | undefined {
  if (typeof ref === 'string') {
    return ref.split('/').pop()
  }
  if (ref && typeof ref === 'object' && 'reference' in ref) {
    return extractReferenceId((ref as { reference: unknown }).reference)
  }
  return undefined
}

// Helper to get first coding
function getFirstCoding(codeableConcept: unknown): { code?: string; system?: string; display?: string } {
  if (!codeableConcept || typeof codeableConcept !== 'object') return {}

  const cc = codeableConcept as Record<string, unknown>

  if (Array.isArray(cc.coding) && cc.coding.length > 0) {
    const coding = cc.coding[0] as Record<string, unknown>
    return {
      code: coding.code as string | undefined,
      system: simplifyCodeSystem(coding.system as string | undefined),
      display: (coding.display as string) || (cc.text as string) || undefined
    }
  }

  if (cc.text) {
    return { display: cc.text as string }
  }

  return {}
}

// Simplify code system URLs to short names
function simplifyCodeSystem(system: string | undefined): string | undefined {
  if (!system) return undefined

  const systemMap: Record<string, string> = {
    'http://loinc.org': 'LOINC',
    'http://snomed.info/sct': 'SNOMED',
    'http://hl7.org/fhir/sid/icd-10': 'ICD10',
    'http://hl7.org/fhir/sid/icd-10-cm': 'ICD10-CM',
    'http://hl7.org/fhir/sid/icd-9': 'ICD9',
    'http://www.nlm.nih.gov/research/umls/rxnorm': 'RxNorm',
    'http://www.ama-assn.org/go/cpt': 'CPT',
    'http://hl7.org/fhir/sid/cvx': 'CVX',
    'http://hl7.org/fhir/sid/ndc': 'NDC'
  }

  return systemMap[system] || system.split('/').pop()
}

// Helper to format date (remove time if present)
function formatDate(dateStr: unknown): string | undefined {
  if (typeof dateStr !== 'string') return undefined
  // Return just the date part if it includes time
  return dateStr.split('T')[0]
}

// Helper to get human name
function formatHumanName(name: unknown): string | undefined {
  if (!name || typeof name !== 'object') return undefined

  const n = name as Record<string, unknown>
  const given = Array.isArray(n.given) ? n.given.join(' ') : ''
  const family = n.family || ''

  if (given && family) return `${given} ${family}`
  if (given) return given
  if (family) return family as string
  if (n.text) return n.text as string

  return undefined
}

// Helper to format address
function formatAddress(address: unknown): string | undefined {
  if (!address || typeof address !== 'object') return undefined

  const a = address as Record<string, unknown>
  const parts: string[] = []

  if (a.city) parts.push(a.city as string)
  if (a.state) parts.push(a.state as string)
  if (a.postalCode) parts.push(a.postalCode as string)

  return parts.length > 0 ? parts.join(', ') : undefined
}

// Calculate age from birth date
function calculateAge(birthDate: string | undefined): number | undefined {
  if (!birthDate) return undefined

  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

// Flatten Patient resource
function flattenPatient(resource: Record<string, unknown>): FlattenedPatient {
  const name = Array.isArray(resource.name) ? resource.name[0] : resource.name
  const address = Array.isArray(resource.address) ? resource.address[0] : resource.address
  const telecom = Array.isArray(resource.telecom) ? resource.telecom : []

  const phone = telecom.find((t: Record<string, unknown>) => t.system === 'phone')
  const email = telecom.find((t: Record<string, unknown>) => t.system === 'email')

  const birthDate = formatDate(resource.birthDate)

  return {
    resourceType: 'Patient',
    id: resource.id as string | undefined,
    name: formatHumanName(name),
    gender: resource.gender as string | undefined,
    birthDate,
    age: calculateAge(birthDate),
    address: formatAddress(address),
    phone: phone?.value as string | undefined,
    email: email?.value as string | undefined,
    maritalStatus: getFirstCoding(resource.maritalStatus).display,
    language: Array.isArray(resource.communication) && resource.communication.length > 0
      ? getFirstCoding((resource.communication[0] as Record<string, unknown>).language).display
      : undefined
  }
}

// Flatten Observation resource
function flattenObservation(resource: Record<string, unknown>): FlattenedObservation {
  const coding = getFirstCoding(resource.code)
  const category = Array.isArray(resource.category)
    ? getFirstCoding(resource.category[0]).display
    : undefined

  let value: string | number | undefined
  let unit: string | undefined

  if (resource.valueQuantity) {
    const vq = resource.valueQuantity as Record<string, unknown>
    value = vq.value as number
    unit = (vq.unit as string) || (vq.code as string)
  } else if (resource.valueCodeableConcept) {
    value = getFirstCoding(resource.valueCodeableConcept).display
  } else if (resource.valueString) {
    value = resource.valueString as string
  } else if (resource.valueBoolean !== undefined) {
    value = resource.valueBoolean ? 'true' : 'false'
  } else if (resource.valueInteger !== undefined) {
    value = resource.valueInteger as number
  }

  // Get interpretation
  const interpretation = Array.isArray(resource.interpretation)
    ? getFirstCoding(resource.interpretation[0]).display
    : undefined

  // Get reference range
  let referenceRange: string | undefined
  if (Array.isArray(resource.referenceRange) && resource.referenceRange.length > 0) {
    const rr = resource.referenceRange[0] as Record<string, unknown>
    const low = (rr.low as Record<string, unknown>)?.value
    const high = (rr.high as Record<string, unknown>)?.value
    if (low !== undefined && high !== undefined) {
      referenceRange = `${low}-${high}`
    } else if (low !== undefined) {
      referenceRange = `>=${low}`
    } else if (high !== undefined) {
      referenceRange = `<=${high}`
    }
  }

  return {
    resourceType: 'Observation',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.subject),
    date: formatDate(resource.effectiveDateTime || (resource.effectivePeriod as Record<string, unknown> | undefined)?.start || resource.issued),
    category,
    code: coding.code || coding.display || 'unknown',
    codeSystem: coding.system,
    display: coding.display,
    value,
    unit,
    interpretation,
    referenceRange,
    status: resource.status as string | undefined
  }
}

// Flatten Condition resource
function flattenCondition(resource: Record<string, unknown>): FlattenedCondition {
  const coding = getFirstCoding(resource.code)
  const category = Array.isArray(resource.category)
    ? getFirstCoding(resource.category[0]).display
    : undefined

  return {
    resourceType: 'Condition',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.subject),
    code: coding.code || coding.display || 'unknown',
    codeSystem: coding.system,
    display: coding.display,
    clinicalStatus: getFirstCoding(resource.clinicalStatus).code,
    verificationStatus: getFirstCoding(resource.verificationStatus).code,
    severity: getFirstCoding(resource.severity).display,
    onsetDate: formatDate(resource.onsetDateTime || (resource.onsetPeriod as Record<string, unknown> | undefined)?.start),
    abatementDate: formatDate(resource.abatementDateTime || (resource.abatementPeriod as Record<string, unknown> | undefined)?.end),
    category
  }
}

// Flatten MedicationRequest resource
function flattenMedicationRequest(resource: Record<string, unknown>): FlattenedMedicationRequest {
  let medication: string = 'unknown'
  let code: string | undefined
  let codeSystem: string | undefined

  if (resource.medicationCodeableConcept) {
    const coding = getFirstCoding(resource.medicationCodeableConcept)
    medication = coding.display || coding.code || 'unknown'
    code = coding.code
    codeSystem = coding.system
  } else if (resource.medicationReference) {
    medication = extractReferenceId(resource.medicationReference) || 'unknown'
  }

  // Extract dosage info
  let dosage: string | undefined
  let frequency: string | undefined
  let route: string | undefined

  if (Array.isArray(resource.dosageInstruction) && resource.dosageInstruction.length > 0) {
    const di = resource.dosageInstruction[0] as Record<string, unknown>

    // Text dosage
    if (di.text) {
      dosage = di.text as string
    } else if (di.doseAndRate && Array.isArray(di.doseAndRate)) {
      const dr = di.doseAndRate[0] as Record<string, unknown>
      if (dr.doseQuantity) {
        const dq = dr.doseQuantity as Record<string, unknown>
        dosage = `${dq.value} ${dq.unit || dq.code || ''}`
      }
    }

    // Timing/frequency
    if (di.timing) {
      const timing = di.timing as Record<string, unknown>
      if (timing.code) {
        frequency = getFirstCoding(timing.code).display
      } else if (timing.repeat) {
        const repeat = timing.repeat as Record<string, unknown>
        if (repeat.frequency && repeat.period) {
          frequency = `${repeat.frequency}x per ${repeat.period} ${repeat.periodUnit || ''}`
        }
      }
    }

    // Route
    route = getFirstCoding(di.route).display
  }

  // Get reason
  const reasonCode = Array.isArray(resource.reasonCode)
    ? getFirstCoding(resource.reasonCode[0]).display
    : undefined

  return {
    resourceType: 'MedicationRequest',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.subject),
    medication,
    code,
    codeSystem,
    status: resource.status as string | undefined,
    intent: resource.intent as string | undefined,
    dosage,
    frequency,
    route,
    authoredOn: formatDate(resource.authoredOn),
    requester: extractReferenceId(resource.requester),
    reasonCode
  }
}

// Flatten Encounter resource
function flattenEncounter(resource: Record<string, unknown>): FlattenedEncounter {
  const encounterClass = resource.class as Record<string, unknown> | undefined
  const type = Array.isArray(resource.type)
    ? getFirstCoding(resource.type[0]).display
    : undefined
  const serviceType = getFirstCoding(resource.serviceType).display

  const period = resource.period as Record<string, unknown> | undefined

  // Get diagnoses
  const diagnosis = Array.isArray(resource.diagnosis)
    ? resource.diagnosis
        .map((d: Record<string, unknown>) => getFirstCoding(d.condition).display)
        .filter(Boolean) as string[]
    : undefined

  // Get reason
  const reasonCode = Array.isArray(resource.reasonCode)
    ? getFirstCoding(resource.reasonCode[0]).display
    : undefined

  // Get location
  const location = Array.isArray(resource.location)
    ? extractReferenceId((resource.location[0] as Record<string, unknown>).location)
    : undefined

  return {
    resourceType: 'Encounter',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.subject),
    status: resource.status as string | undefined,
    class: encounterClass?.code as string | undefined,
    type,
    serviceType,
    startDate: formatDate(period?.start),
    endDate: formatDate(period?.end),
    reasonCode,
    diagnosis,
    location,
    provider: Array.isArray(resource.participant) && resource.participant.length > 0
      ? extractReferenceId((resource.participant[0] as Record<string, unknown>).individual)
      : undefined
  }
}

// Flatten Procedure resource
function flattenProcedure(resource: Record<string, unknown>): FlattenedProcedure {
  const coding = getFirstCoding(resource.code)
  const category = getFirstCoding(resource.category).display

  let performedDate: string | undefined
  if (resource.performedDateTime) {
    performedDate = formatDate(resource.performedDateTime)
  } else if (resource.performedPeriod) {
    performedDate = formatDate((resource.performedPeriod as Record<string, unknown>).start)
  }

  return {
    resourceType: 'Procedure',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.subject),
    code: coding.code || coding.display || 'unknown',
    codeSystem: coding.system,
    display: coding.display,
    status: resource.status as string | undefined,
    performedDate,
    category,
    outcome: getFirstCoding(resource.outcome).display,
    performer: Array.isArray(resource.performer) && resource.performer.length > 0
      ? extractReferenceId((resource.performer[0] as Record<string, unknown>).actor)
      : undefined,
    location: extractReferenceId(resource.location)
  }
}

// Flatten AllergyIntolerance resource
function flattenAllergyIntolerance(resource: Record<string, unknown>): FlattenedAllergyIntolerance {
  const coding = getFirstCoding(resource.code)

  // Get first reaction
  let reaction: string | undefined
  let severity: string | undefined
  if (Array.isArray(resource.reaction) && resource.reaction.length > 0) {
    const r = resource.reaction[0] as Record<string, unknown>
    if (Array.isArray(r.manifestation) && r.manifestation.length > 0) {
      reaction = getFirstCoding(r.manifestation[0]).display
    }
    severity = r.severity as string | undefined
  }

  return {
    resourceType: 'AllergyIntolerance',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.patient),
    substance: coding.display || coding.code || 'unknown',
    code: coding.code,
    clinicalStatus: getFirstCoding(resource.clinicalStatus).code,
    verificationStatus: getFirstCoding(resource.verificationStatus).code,
    type: resource.type as string | undefined,
    category: Array.isArray(resource.category) ? resource.category[0] : undefined,
    criticality: resource.criticality as string | undefined,
    reaction,
    severity,
    onsetDate: formatDate(resource.onsetDateTime)
  }
}

// Flatten Immunization resource
function flattenImmunization(resource: Record<string, unknown>): FlattenedImmunization {
  const coding = getFirstCoding(resource.vaccineCode)

  const doseQuantity = resource.doseQuantity
    ? `${(resource.doseQuantity as Record<string, unknown>).value} ${
        (resource.doseQuantity as Record<string, unknown>).unit || ''
      }`
    : undefined

  return {
    resourceType: 'Immunization',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.patient),
    vaccine: coding.display || coding.code || 'unknown',
    code: coding.code,
    status: resource.status as string | undefined,
    date: formatDate(resource.occurrenceDateTime),
    lotNumber: resource.lotNumber as string | undefined,
    site: getFirstCoding(resource.site).display,
    route: getFirstCoding(resource.route).display,
    doseQuantity
  }
}

// Flatten DiagnosticReport resource
function flattenDiagnosticReport(resource: Record<string, unknown>): FlattenedDiagnosticReport {
  const coding = getFirstCoding(resource.code)
  const category = Array.isArray(resource.category)
    ? getFirstCoding(resource.category[0]).display
    : undefined

  const resultIds = Array.isArray(resource.result)
    ? resource.result.map((r: unknown) => extractReferenceId(r)).filter(Boolean) as string[]
    : undefined

  return {
    resourceType: 'DiagnosticReport',
    id: resource.id as string | undefined,
    patientId: extractReferenceId(resource.subject),
    code: coding.code || coding.display || 'unknown',
    display: coding.display,
    status: resource.status as string | undefined,
    category,
    effectiveDate: formatDate(resource.effectiveDateTime),
    issuedDate: formatDate(resource.issued),
    conclusion: resource.conclusion as string | undefined,
    resultIds
  }
}

// Main flattening function for a single resource
function flattenResource(resource: Record<string, unknown>): FlattenedResource | null {
  const resourceType = resource.resourceType as string

  switch (resourceType) {
    case 'Patient':
      return flattenPatient(resource)
    case 'Observation':
      return flattenObservation(resource)
    case 'Condition':
      return flattenCondition(resource)
    case 'MedicationRequest':
      return flattenMedicationRequest(resource)
    case 'Encounter':
      return flattenEncounter(resource)
    case 'Procedure':
      return flattenProcedure(resource)
    case 'AllergyIntolerance':
      return flattenAllergyIntolerance(resource)
    case 'Immunization':
      return flattenImmunization(resource)
    case 'DiagnosticReport':
      return flattenDiagnosticReport(resource)
    default:
      return null // Unsupported resource type
  }
}

// Deduplicate observations (same code, similar value, same date)
function deduplicateObservations(observations: FlattenedObservation[]): FlattenedObservation[] {
  const seen = new Map<string, FlattenedObservation>()

  for (const obs of observations) {
    const key = `${obs.patientId}-${obs.code}-${obs.date}`
    if (!seen.has(key)) {
      seen.set(key, obs)
    }
  }

  return Array.from(seen.values())
}

// Filter observations by date range
function filterObservationsByDate(
  observations: FlattenedObservation[],
  daysLimit: number
): FlattenedObservation[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysLimit)
  const cutoffStr = cutoffDate.toISOString().split('T')[0]

  return observations.filter(obs => {
    if (!obs.date) return true // Keep observations without dates
    return obs.date >= cutoffStr
  })
}

/**
 * Flatten a FHIR Bundle to reduce size while preserving clinical meaning
 */
export function flattenFHIRBundle(
  bundle: FHIRBundle,
  options: FlattenerOptions = {}
): FlattenerResult {
  const {
    includeResourceTypes,
    excludeResourceTypes = [],
    maxResourcesPerType,
    includeIds = true,
    deduplicateObservations: shouldDedup = true,
    observationDaysLimit
  } = options

  const originalSize = JSON.stringify(bundle).length

  const resourceCounts: Record<string, number> = {}
  const flattenedResources: FlattenedResource[] = []
  let resourcesSkipped = 0
  let duplicatesRemoved = 0

  const resourcesByType: Record<string, FlattenedResource[]> = {}
  let earliestDate: string | undefined
  let latestDate: string | undefined

  // Process each entry
  const entries = bundle.entry || []
  for (const entry of entries) {
    const resource = entry.resource as Record<string, unknown> | undefined
    if (!resource || !resource.resourceType) continue

    const resourceType = resource.resourceType as string

    // Check type filters
    if (includeResourceTypes && !includeResourceTypes.includes(resourceType)) {
      resourcesSkipped++
      continue
    }
    if (excludeResourceTypes.includes(resourceType)) {
      resourcesSkipped++
      continue
    }

    // Flatten the resource
    const flattened = flattenResource(resource)
    if (!flattened) {
      resourcesSkipped++
      continue
    }

    // Remove ID if not needed
    if (!includeIds && 'id' in flattened) {
      delete (flattened as unknown as Record<string, unknown>).id
    }

    // Track by type
    if (!resourcesByType[resourceType]) {
      resourcesByType[resourceType] = []
    }
    resourcesByType[resourceType].push(flattened)

    // Track date range
    const flatRec = flattened as unknown as Record<string, unknown>
    const resourceDate = flatRec.date as string | undefined ||
      flatRec.onsetDate as string | undefined ||
      flatRec.authoredOn as string | undefined

    if (resourceDate) {
      if (!earliestDate || resourceDate < earliestDate) earliestDate = resourceDate
      if (!latestDate || resourceDate > latestDate) latestDate = resourceDate
    }
  }

  // Apply post-processing per type
  for (const [type, resources] of Object.entries(resourcesByType)) {
    let processed = resources

    // Deduplicate observations
    if (type === 'Observation' && shouldDedup) {
      const before = processed.length
      processed = deduplicateObservations(processed as FlattenedObservation[])
      duplicatesRemoved += before - processed.length
    }

    // Filter observations by date
    if (type === 'Observation' && observationDaysLimit) {
      processed = filterObservationsByDate(processed as FlattenedObservation[], observationDaysLimit)
    }

    // Apply max per type
    if (maxResourcesPerType && processed.length > maxResourcesPerType) {
      // Sort by date (most recent first) before limiting
      processed.sort((a, b) => {
        const aRec = a as unknown as Record<string, unknown>
        const bRec = b as unknown as Record<string, unknown>
        const dateA = aRec.date as string | undefined || ''
        const dateB = bRec.date as string | undefined || ''
        return dateB.localeCompare(dateA)
      })
      processed = processed.slice(0, maxResourcesPerType)
    }

    resourceCounts[type] = processed.length
    flattenedResources.push(...processed)
  }

  const flattenedBundle: FlattenedBundle = {
    resourceType: 'Bundle',
    type: bundle.type || 'collection',
    total: flattenedResources.length,
    resources: flattenedResources,
    summary: {
      patientCount: resourceCounts['Patient'] || 0,
      resourceCounts,
      dateRange: earliestDate || latestDate
        ? { earliest: earliestDate, latest: latestDate }
        : undefined
    }
  }

  const flattenedSize = JSON.stringify(flattenedBundle).length
  const reductionPercent = Math.round((1 - flattenedSize / originalSize) * 100)

  return {
    bundle: flattenedBundle,
    originalSize,
    flattenedSize,
    reductionPercent,
    stats: {
      resourcesProcessed: flattenedResources.length,
      resourcesSkipped,
      duplicatesRemoved
    }
  }
}

/**
 * Convert a flattened bundle back to a simple text format for LLM context
 */
export function flattenedBundleToText(bundle: FlattenedBundle): string {
  const lines: string[] = []

  lines.push(`# Clinical Summary`)
  lines.push(`Total Resources: ${bundle.total}`)

  if (bundle.summary.dateRange) {
    lines.push(`Date Range: ${bundle.summary.dateRange.earliest || 'unknown'} to ${bundle.summary.dateRange.latest || 'present'}`)
  }

  lines.push('')

  // Group by resource type
  const byType: Record<string, FlattenedResource[]> = {}
  for (const resource of bundle.resources) {
    if (!byType[resource.resourceType]) {
      byType[resource.resourceType] = []
    }
    byType[resource.resourceType].push(resource)
  }

  // Patient info first
  if (byType['Patient']) {
    lines.push('## Patient Information')
    for (const patient of byType['Patient'] as FlattenedPatient[]) {
      lines.push(`- Name: ${patient.name || 'Unknown'}`)
      if (patient.age) lines.push(`- Age: ${patient.age} years`)
      if (patient.gender) lines.push(`- Gender: ${patient.gender}`)
      if (patient.address) lines.push(`- Location: ${patient.address}`)
    }
    lines.push('')
  }

  // Conditions
  if (byType['Condition']) {
    lines.push('## Active Conditions')
    for (const condition of byType['Condition'] as FlattenedCondition[]) {
      const status = condition.clinicalStatus === 'active' ? '' : ` (${condition.clinicalStatus})`
      lines.push(`- ${condition.display || condition.code}${status}`)
    }
    lines.push('')
  }

  // Medications
  if (byType['MedicationRequest']) {
    lines.push('## Current Medications')
    for (const med of byType['MedicationRequest'] as FlattenedMedicationRequest[]) {
      let line = `- ${med.medication}`
      if (med.dosage) line += `: ${med.dosage}`
      if (med.frequency) line += ` (${med.frequency})`
      lines.push(line)
    }
    lines.push('')
  }

  // Allergies
  if (byType['AllergyIntolerance']) {
    lines.push('## Allergies')
    for (const allergy of byType['AllergyIntolerance'] as FlattenedAllergyIntolerance[]) {
      let line = `- ${allergy.substance}`
      if (allergy.criticality) line += ` [${allergy.criticality}]`
      if (allergy.reaction) line += `: ${allergy.reaction}`
      lines.push(line)
    }
    lines.push('')
  }

  // Recent Observations (labs/vitals)
  if (byType['Observation']) {
    lines.push('## Recent Labs & Vitals')
    const observations = byType['Observation'] as FlattenedObservation[]
    // Sort by date descending
    observations.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    for (const obs of observations.slice(0, 20)) { // Limit to 20 most recent
      let line = `- ${obs.display || obs.code}`
      if (obs.value !== undefined) {
        line += `: ${obs.value}`
        if (obs.unit) line += ` ${obs.unit}`
      }
      if (obs.interpretation) line += ` [${obs.interpretation}]`
      if (obs.date) line += ` (${obs.date})`
      lines.push(line)
    }
    lines.push('')
  }

  // Immunizations
  if (byType['Immunization']) {
    lines.push('## Immunizations')
    for (const imm of byType['Immunization'] as FlattenedImmunization[]) {
      let line = `- ${imm.vaccine}`
      if (imm.date) line += ` (${imm.date})`
      lines.push(line)
    }
    lines.push('')
  }

  // Procedures
  if (byType['Procedure']) {
    lines.push('## Procedures')
    for (const proc of byType['Procedure'] as FlattenedProcedure[]) {
      let line = `- ${proc.display || proc.code}`
      if (proc.performedDate) line += ` (${proc.performedDate})`
      if (proc.status && proc.status !== 'completed') line += ` [${proc.status}]`
      lines.push(line)
    }
    lines.push('')
  }

  return lines.join('\n')
}
