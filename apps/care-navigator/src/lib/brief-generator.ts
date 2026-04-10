// Orchestrates FHIR processing → bilingual brief generation
import type { FHIRBundle } from '@plumly/fhir-utils';
import { deidentifyFHIRBundle, validateFHIRBundle } from '@plumly/fhir-utils';
import { selectVisitPrepResources } from '@plumly/fhir-utils';
import { generateBilingualBrief } from '@plumly/summarizer';
import type { BilingualBrief } from '@plumly/summarizer';

interface GenerateOptions {
  patientPreferredName?: string;
  upcomingEncounterDate?: string;
}

export async function generateVisitBrief(
  bundle: FHIRBundle,
  options: GenerateOptions = {}
): Promise<BilingualBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  // 1. Validate bundle
  if (!validateFHIRBundle(bundle)) {
    throw new Error('Invalid FHIR bundle');
  }

  // 2. De-identify before sending to AI
  const { data: deidentifiedBundle } = deidentifyFHIRBundle(bundle as unknown as Record<string, unknown>, {
    removeNames: false, // Keep names for personalisation but remove other PHI
    maskDates: false,
    removeGeographicData: true,
    removePhoneNumbers: true,
    removeEmails: true,
    removeIdentifiers: true,
    removeNetworkIdentifiers: true,
  });

  // 3. Select visit-prep relevant resources
  const resourceData = selectVisitPrepResources(deidentifiedBundle as unknown as FHIRBundle, {
    maxEncounters: 2,
    labLookbackDays: 180,
    includeInactiveConditions: false,
  });

  // 4. Generate bilingual brief
  return generateBilingualBrief(
    {
      resourceData,
      patientPreferredName: options.patientPreferredName,
      upcomingEncounterDate: options.upcomingEncounterDate,
    },
    apiKey
  );
}
