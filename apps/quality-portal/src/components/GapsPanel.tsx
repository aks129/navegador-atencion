'use client';

import { useState, useMemo } from 'react';
import type { GapPatient, MeasureId, MeasureDefinition } from '@plumly/cql-measures';
import { MEASURE_DEFINITIONS } from '@plumly/cql-measures';
import { cn, formatAge } from '@/lib/utils';

interface GapsPanelProps {
  patients: GapPatient[];
}

const RISK_COLOR = (score: number) => {
  if (score >= 80) return 'text-red-700 bg-red-50';
  if (score >= 60) return 'text-amber-700 bg-amber-50';
  return 'text-green-700 bg-green-50';
};

const LANG_LABEL: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  other: '—',
};

const MEASURE_FILTER_OPTIONS: { value: MeasureId | 'all'; label: string }[] = [
  { value: 'all', label: 'All Measures' },
  ...Object.values(MEASURE_DEFINITIONS).map(d => ({ value: d.id, label: d.shortName })),
];

export function GapsPanel({ patients }: GapsPanelProps) {
  const [filterMeasure, setFilterMeasure] = useState<MeasureId | 'all'>('all');
  const [outreachSent, setOutreachSent] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (filterMeasure === 'all') return patients;
    return patients.filter(p => p.measures.some(m => m.measureId === filterMeasure && m.status === 'not-met'));
  }, [patients, filterMeasure]);

  // Sort by risk score descending
  const sorted = [...filtered].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

  function handleOutreach(patientId: string) {
    setOutreachSent(prev => new Set([...prev, patientId]));
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Filter by measure:</span>
        <div className="flex flex-wrap gap-2">
          {MEASURE_FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilterMeasure(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filterMeasure === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-500">
          {sorted.length} patient{sorted.length !== 1 ? 's' : ''} with open gaps
        </span>
      </div>

      {/* Patient rows */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
          No patients with open gaps for the selected measure.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(patient => (
            <PatientGapCard
              key={patient.id}
              patient={patient}
              outreachSent={outreachSent.has(patient.id)}
              onOutreach={() => handleOutreach(patient.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientGapCard({
  patient,
  outreachSent,
  onOutreach,
}: {
  patient: GapPatient;
  outreachSent: boolean;
  onOutreach: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const notMetMeasures = patient.measures.filter(m => m.status === 'not-met');

  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Risk score */}
        <div
          className={cn(
            'shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
            RISK_COLOR(patient.riskScore ?? 50),
          )}
        >
          {patient.riskScore ?? '—'}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{patient.name}</span>
            <span className="text-xs text-gray-400">Age {formatAge(patient.dob)}</span>
            <span className="text-xs rounded bg-gray-100 px-1.5 py-0.5 text-gray-500">
              {LANG_LABEL[patient.preferredLanguage] ?? '—'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {notMetMeasures.map(m => {
              const def: MeasureDefinition = MEASURE_DEFINITIONS[m.measureId];
              return (
                <span
                  key={m.measureId}
                  className="text-xs rounded-full bg-red-50 text-red-700 px-2 py-0.5 ring-1 ring-red-200"
                >
                  {def?.shortName ?? m.measureId}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
          {outreachSent ? (
            <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg ring-1 ring-green-200 font-medium">
              Outreach Sent
            </span>
          ) : (
            <button
              type="button"
              onClick={onOutreach}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Trigger Outreach
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {patient.phone && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Phone:</span> {patient.phone}
            </p>
          )}
          {patient.lastContactDate && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Last contact:</span>{' '}
              {new Date(patient.lastContactDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
          <div className="space-y-2">
            {notMetMeasures.map(m => {
              const def: MeasureDefinition = MEASURE_DEFINITIONS[m.measureId];
              return (
                <div key={m.measureId} className="rounded-lg bg-white p-3 ring-1 ring-gray-200">
                  <p className="text-xs font-semibold text-gray-700">{def?.shortName ?? m.measureId}</p>
                  {m.gapReason && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium">Gap:</span> {m.gapReason}
                    </p>
                  )}
                  {m.nextAction && (
                    <p className="text-xs text-blue-700 mt-0.5">
                      <span className="font-medium">Next action:</span> {m.nextAction}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
