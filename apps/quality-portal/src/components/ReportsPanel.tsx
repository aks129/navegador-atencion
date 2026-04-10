'use client';

import { useState } from 'react';
import type { MeasureScore, MeasureDefinition, NarrativeRequest } from '@plumly/cql-measures';
import { MEASURE_DEFINITIONS } from '@plumly/cql-measures';
import { cn, formatPercent } from '@/lib/utils';

interface ReportsPanelProps {
  scores: MeasureScore[];
  facilityName: string;
  reportingPeriod: { start: string; end: string };
  totalPatients: number;
}

const LEVEL_CLASSES = {
  high: 'text-green-700 bg-green-50',
  medium: 'text-amber-700 bg-amber-50',
  low: 'text-red-700 bg-red-50',
} as const;

const LEVEL_LABELS = {
  high: 'On Track',
  medium: 'Needs Work',
  low: 'Priority',
} as const;

export function ReportsPanel({ scores, facilityName, reportingPeriod, totalPatients }: ReportsPanelProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateNarrative() {
    setLoading(true);
    setError(null);
    try {
      const body: NarrativeRequest = {
        scores,
        definitions: Object.values(MEASURE_DEFINITIONS) as MeasureDefinition[],
        facilityName,
        reportingPeriod,
        totalPatients,
      };
      const res = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { narrative: string };
      setNarrative(data.narrative);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate narrative');
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const header = [
      'CMS ID',
      'Measure Name',
      'Denominator',
      'Numerator',
      'Rate (%)',
      'National Avg (%)',
      'Performance',
      'Trend',
    ].join(',');

    const rows = scores.map(s => {
      const def: MeasureDefinition = MEASURE_DEFINITIONS[s.measureId];
      return [
        def.cmsId,
        `"${def.fullName}"`,
        s.denominator,
        s.numerator,
        s.rate.toFixed(1),
        def.nationalAverage?.toFixed(1) ?? '',
        s.performanceLevel,
        s.trend,
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uds-6b-${reportingPeriod.end.slice(0, 4)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* UDS Table 6B */}
      <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">UDS Table 6B — Quality of Care Measures</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {facilityName} · Reporting year {reportingPeriod.end.slice(0, 4)} ·{' '}
              {totalPatients.toLocaleString()} active patients
            </p>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 text-left font-semibold">Measure</th>
                <th className="px-4 py-3 text-right font-semibold">Denominator</th>
                <th className="px-4 py-3 text-right font-semibold">Numerator</th>
                <th className="px-4 py-3 text-right font-semibold">Rate</th>
                <th className="px-4 py-3 text-right font-semibold">National Avg</th>
                <th className="px-4 py-3 text-right font-semibold">Trend</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scores.map(score => {
                const def: MeasureDefinition = MEASURE_DEFINITIONS[score.measureId];
                const trendSymbol = score.trend === 'up' ? '↑' : score.trend === 'down' ? '↓' : '→';
                const trendColor =
                  score.trend === 'up' ? 'text-green-600' : score.trend === 'down' ? 'text-red-600' : 'text-gray-400';
                return (
                  <tr key={score.measureId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{def.shortName}</p>
                      <p className="text-xs text-gray-400">{def.cmsId}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {score.denominator.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {score.numerator.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatPercent(score.rate)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {def.nationalAverage !== undefined ? formatPercent(def.nationalAverage) : '—'}
                    </td>
                    <td className={cn('px-4 py-3 text-right font-semibold', trendColor)}>
                      {trendSymbol} {Math.abs(score.trendDelta).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          LEVEL_CLASSES[score.performanceLevel],
                        )}
                      >
                        {LEVEL_LABELS[score.performanceLevel]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Narrative */}
      <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">AI Quality Narrative</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              2-3 paragraph plain-language summary of your quality performance — ready to paste into UDS documentation.
            </p>
          </div>
          <button
            type="button"
            onClick={generateNarrative}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm px-4 py-2 transition-colors"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate Narrative
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">Failed to generate narrative</p>
            <p className="mt-1 text-red-600">{error}</p>
            <p className="mt-1 text-xs text-red-500">
              Ensure GROQ_API_KEY is set in your environment variables.
            </p>
          </div>
        )}

        {narrative ? (
          <div className="rounded-lg bg-gray-50 p-4 space-y-3">
            {narrative.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {para.trim()}
              </p>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400">Generated with Groq · llama-3.3-70b-versatile</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(narrative);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
              Click &ldquo;Generate Narrative&rdquo; to create an AI-written quality summary for your UDS documentation.
            </div>
          )
        )}
      </div>
    </div>
  );
}
