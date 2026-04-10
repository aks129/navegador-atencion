// Orchestrates FHIR processing → bilingual brief generation
import type { FHIRBundle } from '@plumly/fhir-utils';
import { deidentifyFHIRBundle, validateFHIRBundle } from '@plumly/fhir-utils';
import { selectVisitPrepResources } from '@plumly/fhir-utils';
import { generateBilingualBrief, generateBilingualBriefWithGroq } from '@plumly/summarizer';
import type { BilingualBrief } from '@plumly/summarizer';

interface GenerateOptions {
  patientPreferredName?: string;
  upcomingEncounterDate?: string;
}

export async function generateVisitBrief(
  bundle: FHIRBundle,
  options: GenerateOptions = {}
): Promise<BilingualBrief> {
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!groqKey && !anthropicKey) {
    throw new Error('No AI API key configured. Set GROQ_API_KEY (free) or ANTHROPIC_API_KEY.');
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

  // 4. Generate bilingual brief — prefer Groq (free) over Anthropic
  const briefRequest = {
    resourceData,
    patientPreferredName: options.patientPreferredName,
    upcomingEncounterDate: options.upcomingEncounterDate,
  };

  if (groqKey) {
    return generateBilingualBriefWithGroq(briefRequest, groqKey);
  }

  return generateBilingualBrief(briefRequest, anthropicKey!);
}
