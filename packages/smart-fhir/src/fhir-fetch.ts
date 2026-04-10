// Authenticated FHIR resource fetching using SMART Bearer tokens

import type { FHIRBundle } from '@plumly/fhir-utils';
import { SMARTError } from './types';

interface FetchOptions {
  /** Request timeout in ms (default: 30_000) */
  timeout?: number;
}

/** Build Authorization header value */
function bearerHeader(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/fhir+json, application/json',
  };
}

/** Fetch a patient's full FHIR bundle using the $everything operation */
export async function fetchPatientBundle(
  fhirBaseUrl: string,
  patientId: string,
  accessToken: string,
  options: FetchOptions = {}
): Promise<FHIRBundle> {
  const base = fhirBaseUrl.replace(/\/$/, '');
  const url = `${base}/Patient/${encodeURIComponent(patientId)}/$everything`;
  const timeout = options.timeout ?? 30_000;

  const res = await fetch(url, {
    headers: bearerHeader(accessToken),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SMARTError(
      `FHIR $everything failed for patient ${patientId} (${res.status}): ${text}`,
      'FHIR_FETCH_FAILED'
    );
  }

  const bundle = await res.json() as FHIRBundle;

  if (bundle.resourceType !== 'Bundle') {
    throw new SMARTError(
      `Expected Bundle resource, got: ${bundle.resourceType}`,
      'INVALID_FHIR_RESPONSE'
    );
  }

  return bundle;
}

/** Fetch a single Patient resource */
export async function fetchPatientResource(
  fhirBaseUrl: string,
  patientId: string,
  accessToken: string,
  options: FetchOptions = {}
): Promise<Record<string, unknown>> {
  const base = fhirBaseUrl.replace(/\/$/, '');
  const url = `${base}/Patient/${encodeURIComponent(patientId)}`;
  const timeout = options.timeout ?? 15_000;

  const res = await fetch(url, {
    headers: bearerHeader(accessToken),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SMARTError(
      `FHIR Patient fetch failed (${res.status}): ${text}`,
      'FHIR_PATIENT_FETCH_FAILED'
    );
  }

  return res.json() as Promise<Record<string, unknown>>;
}

/** Generic FHIR resource search with query params */
export async function fhirSearch(
  fhirBaseUrl: string,
  resourceType: string,
  params: Record<string, string>,
  accessToken: string,
  options: FetchOptions = {}
): Promise<FHIRBundle> {
  const base = fhirBaseUrl.replace(/\/$/, '');
  const query = new URLSearchParams(params).toString();
  const url = `${base}/${resourceType}?${query}`;
  const timeout = options.timeout ?? 20_000;

  const res = await fetch(url, {
    headers: bearerHeader(accessToken),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new SMARTError(
      `FHIR search failed for ${resourceType} (${res.status}): ${text}`,
      'FHIR_SEARCH_FAILED'
    );
  }

  return res.json() as Promise<FHIRBundle>;
}
