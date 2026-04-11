// Clinical-specific FHIR types for resource selection
import type { FHIRResource } from './types';

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  }>;
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
  };
  effectiveDateTime?: string;
  effectivePeriod?: {
    start?: string;
    end?: string;
  };
  valueQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  valueCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  interpretation?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  referenceRange?: Array<{
    low?: {
      value?: number;
      unit?: string;
    };
    high?: {
      value?: number;
      unit?: string;
    };
    text?: string;
  }>;
}

export interface FHIRCondition extends FHIRResource {
  resourceType: 'Condition';
  clinicalStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  verificationStatus?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  severity?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
  };
  onsetDateTime?: string;
  onsetPeriod?: {
    start?: string;
    end?: string;
  };
  recordedDate?: string;
}

export interface FHIRMedicationRequest extends FHIRResource {
  resourceType: 'MedicationRequest';
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  category?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  medicationCodeableConcept?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  medicationReference?: {
    reference?: string;
    display?: string;
  };
  subject?: {
    reference?: string;
  };
  authoredOn?: string;
  dosageInstruction?: Array<{
    text?: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string;
      };
    };
    route?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
    doseAndRate?: Array<{
      doseQuantity?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    }>;
  }>;
  dispenseRequest?: {
    validityPeriod?: {
      start?: string;
      end?: string;
    };
    numberOfRepeatsAllowed?: number;
    quantity?: {
      value?: number;
      unit?: string;
    };
  };
}

export interface FHIREncounter extends FHIRResource {
  resourceType: 'Encounter';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
  class?: {
    system?: string;
    code?: string;
    display?: string;
  };
  type?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  subject?: {
    reference?: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
  reasonCode?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  diagnosis?: Array<{
    condition?: {
      reference?: string;
    };
    rank?: number;
  }>;
  location?: Array<{
    location?: {
      reference?: string;
      display?: string;
    };
    period?: {
      start?: string;
      end?: string;
    };
  }>;
}

// Clinical data structures for processing
export interface ProcessedLabValue {
  loincCode: string;
  display: string;
  value: number | string;
  unit?: string;
  normalizedUnit?: string;
  normalizedValue?: number;
  referenceRange?: {
    low?: number;
    high?: number;
    text?: string;
  };
  interpretation?: string;
  date: string;
  isAbnormal?: boolean;
  relevanceScore: number;
  source: Partial<FHIRObservation> & Pick<FHIRResource, 'id'>;
}

export interface ProcessedMedication {
  name: string;
  status: string;
  isActive: boolean;
  category?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  authoredDate?: string;
  rxNormCode?: string;
  validityPeriod?: {
    start?: string;
    end?: string;
  };
  relevanceScore: number;
  source: Partial<FHIRMedicationRequest> & Pick<FHIRResource, 'id'>;
}

export interface ProcessedCondition {
  id?: string;
  name: string;
  code?: string;
  clinicalStatus: string;
  verificationStatus?: string;
  category?: string;
  severity?: string;
  onsetDate?: string;
  recordedDate?: string;
  isChronic: boolean;
  isActive: boolean;
  relevanceScore: number;
  source: Partial<FHIRCondition> & Pick<FHIRResource, 'id'>;
}

export interface ResourceSelectionResult {
  labValues: ProcessedLabValue[];
  medications: ProcessedMedication[];
  conditions: ProcessedCondition[];
  encounters: FHIREncounter[];
  patient: FHIRPatient;
  processingStats: {
    totalObservations: number;
    selectedLabValues: number;
    totalMedications: number;
    activeMedications: number;
    totalConditions: number;
    chronicConditions: number;
    processingTime: number;
  };
}