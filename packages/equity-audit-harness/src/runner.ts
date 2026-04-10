// Vendor-agnostic test runner for the equity audit harness
// POSTs synthetic bundles to the target endpoint and collects results

import { createHash } from 'node:crypto';
import type {
  HarnessConfig,
  HarnessRun,
  HarnessRunResult,
  SyntheticBundle,
  PatientVariant,
} from './types.js';
import { generateVariantSet } from './bundle-generator.js';
import { analyzeEquity } from './equity-analyzer.js';
import { CLINICAL_SCENARIOS, getScenario } from './scenarios.js';

const HARNESS_VERSION = '0.1.0';

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function sha256(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

async function callEndpoint(
  bundle: SyntheticBundle,
  config: HarnessConfig,
): Promise<{ output: string; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const res = await fetch(config.targetEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bundle }),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { output: '', latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = (await res.json()) as { output?: string; summary?: string; brief?: string };
    const output = data.output ?? data.summary ?? data.brief ?? '';
    return { output, latencyMs };
  } catch (err) {
    return {
      output: '',
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function runHarness(config: HarnessConfig): Promise<HarnessRun> {
  const seed = config.seed ?? Date.now();
  const startedAt = new Date().toISOString();
  const runId = sha256({ config, startedAt }).substring(0, 12);

  // Determine which scenarios to run
  const scenariosToRun = config.scenarioIds
    ? config.scenarioIds.map(id => getScenario(id)).filter(Boolean)
    : CLINICAL_SCENARIOS;

  if (scenariosToRun.length === 0) {
    throw new Error('No valid scenarios found. Check scenarioIds in config.');
  }

  // Run the first scenario only (extend to multiple if needed)
  const scenario = scenariosToRun[0]!;
  const bundles = generateVariantSet(scenario, seed);

  // Filter to requested variants
  const filteredBundles = config.variants
    ? bundles.filter(b => (config.variants as PatientVariant[]).includes(b._harness.variant))
    : bundles;

  const results: HarnessRunResult[] = [];

  for (const bundle of filteredBundles) {
    console.log(`  Running variant: ${bundle._harness.variant}...`);
    const { output, latencyMs, error } = await callEndpoint(bundle, config);

    results.push({
      bundleId: bundle.id,
      variant: bundle._harness.variant,
      scenarioId: bundle._harness.scenarioId,
      inputSha256: bundle.sha256,
      output,
      wordCount: countWords(output),
      languageMatch: true, // will be set by equity analyzer
      latencyMs,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  const equityAnalysis = analyzeEquity(results);
  const completedAt = new Date().toISOString();

  // Update languageMatch from equity analysis
  for (const result of results) {
    result.languageMatch = equityAnalysis.languageMatchByVariant[result.variant] ?? true;
  }

  return {
    id: runId,
    scenarioId: scenario.id,
    startedAt,
    completedAt,
    results,
    equityAnalysis,
    provenance: {
      inputBundleHashes: Object.fromEntries(filteredBundles.map(b => [b._harness.variant, b.sha256])),
      harnessVersion: HARNESS_VERSION,
      targetEndpoint: config.targetEndpoint,
      executedAt: startedAt,
      nodeVersion: process.version,
    },
  };
}
