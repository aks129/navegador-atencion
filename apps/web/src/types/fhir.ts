export interface FHIRBundle {
  resourceType: 'Bundle'
  id?: string
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection'
  entry?: FHIRBundleEntry[]
  meta?: {
    lastUpdated?: string
    profile?: string[]
    tag?: Array<{ system?: string; code?: string; display?: string }>
  }
}

export interface FHIRBundleEntry {
  resource?: FHIRResource
  fullUrl?: string
}

export interface FHIRResource {
  resourceType: string
  id?: string
  [key: string]: any
}

export interface Patient extends FHIRResource {
  resourceType: 'Patient'
  name?: Array<{
    given?: string[]
    family?: string
    use?: string
  }>
  birthDate?: string
  gender?: 'male' | 'female' | 'other' | 'unknown'
}

export interface Observation extends FHIRResource {
  resourceType: 'Observation'
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown'
  code: {
    coding?: Array<{
      system?: string
      code?: string
      display?: string
    }>
  }
  subject?: {
    reference?: string
  }
  valueQuantity?: {
    value?: number
    unit?: string
    system?: string
    code?: string
  }
  effectiveDateTime?: string
}

export interface Condition extends FHIRResource {
  resourceType: 'Condition'
  subject?: {
    reference?: string
  }
  code?: {
    coding?: Array<{
      system?: string
      code?: string
      display?: string
    }>
  }
  onsetDateTime?: string
}

export interface MedicationRequest extends FHIRResource {
  resourceType: 'MedicationRequest'
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown'
  subject?: {
    reference?: string
  }
  medicationCodeableConcept?: {
    coding?: Array<{
      system?: string
      code?: string
      display?: string
    }>
  }
  authoredOn?: string
}

export interface Encounter extends FHIRResource {
  resourceType: 'Encounter'
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown'
  subject?: {
    reference?: string
  }
  period?: {
    start?: string
    end?: string
  }
  type?: Array<{
    coding?: Array<{
      system?: string
      code?: string
      display?: string
    }>
  }>
}

export interface SummaryOutput {
  narrative: string
  structuredData?: any
  promptUsed?: string
  timestamp: string
  patientId?: string
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  template: string
  targetAudience: 'patient' | 'provider' | 'payer'
  outputFormat: 'narrative' | 'structured' | 'composition'
}