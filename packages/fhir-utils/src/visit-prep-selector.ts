// Visit-prep specific resource selection
// Wraps ResourceSelector internally — does NOT modify ResourceSelector to avoid breaking apps/web

import type { FHIRBundle } from './types';
import type { ResourceSelectionResult, FHIRPatient } from './clinical-types';
import { ResourceSelector } from './resource-selector';

export interface VisitPrepOptions {
  /** Max number of most-recent encounters to include (default: 2) */
  maxEncounters?: number;
  /** Only include labs from within this many days (default: 180) */
  labLookbackDays?: number;
  /** Include inactive/resolved conditions (default: false) */
  includeInactiveConditions?: boolean;
}

/**
 * Select FHIR resources scoped to visit-prep needs:
 * - Active medications only
 * - Labs within the last 180 days (configurable)
 * - Active / chronic conditions only (unless includeInactiveConditions)
 * - Most recent N encounters (default: 2)
 *
 * Returns the same ResourceSelectionResult shape as ResourceSelector.selectRelevantResources()
 * so downstream summarizer code requires no interface changes.
 */
export function selectVisitPrepResources(
  bundle: FHIRBundle,
  options: VisitPrepOptions = {}
): ResourceSelectionResult {
  const {
    maxEncounters = 2,
    labLookbackDays = 180,
    includeInactiveConditions = false,
  } = options;

  const selector = new ResourceSelector(bundle);

  // selectRelevantResources throws if there's no Patient entry in the bundle.
  // For visit-prep, we still want to surface conditions/meds/labs even without
  // explicit Patient demographics (SMART sandbox $everything should include Patient,
  // but guard defensively).
  let full: ResourceSelectionResult;
  try {
    full = selector.selectRelevantResources();
  } catch (err) {
    if (err instanceof Error && err.message.includes('No patient resource found')) {
      // Return a minimal stub so downstream summarization can still proceed
      return {
        labValues: [],
        medications: [],
        conditions: [],
        encounters: [],
        patient: null as unknown as FHIRPatient,
        processingStats: {
          totalObservations: 0,
          selectedLabValues: 0,
          totalMedications: 0,
          activeMedications: 0,
          totalConditions: 0,
          chronicConditions: 0,
          processingTime: 0,
        },
      };
    }
    throw err;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - labLookbackDays);

  // Filter labs to lookback window
  const labValues = full.labValues.filter(lab => {
    if (!lab.date) return false;
    return new Date(lab.date) >= cutoffDate;
  });

  // Medications: keep only active (ResourceSelector already filters, but be explicit)
  const medications = full.medications.filter(med => med.isActive);

  // Conditions: filter inactive unless opted in
  const conditions = includeInactiveConditions
    ? full.conditions
    : full.conditions.filter(c => c.isActive || c.isChronic);

  // Encounters: sort by period.start descending, take the most recent N
  const encounters = [...full.encounters]
    .sort((a, b) => {
      const da = a.period?.start ? new Date(a.period.start).getTime() : 0;
      const db = b.period?.start ? new Date(b.period.start).getTime() : 0;
      return db - da;
    })
    .slice(0, maxEncounters);

  return {
    ...full,
    labValues,
    medications,
    conditions,
    encounters,
  };
}
