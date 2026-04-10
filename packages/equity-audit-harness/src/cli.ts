#!/usr/bin/env node
// CLI entry point for the equity audit harness
// Usage: run-harness --endpoint <url> [--scenarios <id,...>] [--variants <v,...>] [--seed <n>] [--output <dir>]

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { runHarness } from './runner.js';
import type { HarnessConfig, PatientVariant } from './types.js';

function parseArgs(): HarnessConfig {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const endpoint = get('--endpoint');
  if (!endpoint) {
    console.error('Error: --endpoint <url> is required');
    process.exit(1);
  }

  const scenariosArg = get('--scenarios');
  const variantsArg = get('--variants');
  const seedArg = get('--seed');
  const outputDir = get('--output') ?? './harness-output';
  const apiKey = get('--api-key') ?? process.env['HARNESS_API_KEY'];

  return {
    targetEndpoint: endpoint,
    scenarioIds: scenariosArg ? scenariosArg.split(',') : undefined,
    variants: variantsArg ? (variantsArg.split(',') as PatientVariant[]) : undefined,
    seed: seedArg ? parseInt(seedArg, 10) : undefined,
    outputDir,
    apiKey,
  };
}

async function main() {
  const config = parseArgs();
  console.log('\nEquity Audit Harness v0.1.0');
  console.log('===========================');
  console.log(`Target: ${config.targetEndpoint}`);
  console.log(`Scenarios: ${config.scenarioIds?.join(', ') ?? 'all'}`);
  console.log(`Variants: ${config.variants?.join(', ') ?? 'all'}`);
  console.log(`Seed: ${config.seed ?? '(random)'}`);
  console.log('');

  try {
    const run = await runHarness(config);

    // Print summary to stdout
    console.log(`\nRun ID: ${run.id}`);
    console.log(`Scenario: ${run.scenarioId}`);
    console.log(`Variants run: ${run.results.length}`);
    console.log('');

    console.log('Results:');
    for (const result of run.results) {
      const status = result.error ? 'ERROR' : 'OK';
      const flags = run.equityAnalysis.flags.filter(f => f.variant === result.variant);
      const flagStr = flags.length > 0 ? ` [${flags.map(f => f.type).join(', ')}]` : '';
      console.log(
        `  ${result.variant.padEnd(25)} ${status.padEnd(6)} words=${result.wordCount} latency=${result.latencyMs}ms${flagStr}`,
      );
    }

    if (run.equityAnalysis.flags.length > 0) {
      console.log('\nEquity Flags:');
      for (const flag of run.equityAnalysis.flags) {
        const icon = flag.severity === 'error' ? '[ERROR]' : '[WARN] ';
        console.log(`  ${icon} ${flag.message}`);
      }
    } else {
      console.log('\nNo equity flags detected.');
    }

    // Write JSON report
    const outputDir = config.outputDir ?? './harness-output';
    mkdirSync(outputDir, { recursive: true });
    const reportPath = join(outputDir, `run-${run.id}-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(run, null, 2));
    console.log(`\nFull report written to: ${reportPath}`);
  } catch (err) {
    console.error('Harness failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
