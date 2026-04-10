'use client';

import { useState } from 'react';
import type { BilingualBrief } from '@/types/brief';
import { LanguageToggle } from './LanguageToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BilingualBriefViewProps {
  brief: BilingualBrief;
  initialLanguage?: 'en' | 'es';
}

/**
 * Static label maps keyed by language.
 * Using a local map (instead of useTranslations) so that every label
 * updates immediately when the user clicks the language toggle — without
 * needing to change the URL locale or re-fetch the brief.
 */
const LABELS = {
  en: {
    visitPurpose: 'Reason for Your Visit',
    overview: 'Your Health Today',
    questions: 'Questions to Ask Your Doctor',
    meds: 'Medications to Confirm with Your Doctor',
    labs: 'Lab Results to Review',
    checklist: 'Bring to Your Appointment',
    urgent: 'Urgent — Tell Your Doctor Today',
    urgentNote: 'If you are having a medical emergency, call 911 immediately.',
    notMedicalAdvice: "This summary is for informational purposes only. Always follow your doctor's advice.",
    lastUpdated: 'Last updated',
    sources: 'Source',
    print: 'Print Summary',
  },
  es: {
    visitPurpose: 'Motivo de Su Visita',
    overview: 'Su Salud Hoy',
    questions: 'Preguntas para Su Médico',
    meds: 'Medicamentos para Confirmar con Su Médico',
    labs: 'Resultados de Laboratorio a Revisar',
    checklist: 'Qué Traer a Su Cita',
    urgent: 'Urgente — Dígale a Su Médico Hoy',
    urgentNote: 'Si tiene una emergencia médica, llame al 911 inmediatamente.',
    notMedicalAdvice: 'Este resumen es solo informativo. Siempre siga las indicaciones de su médico.',
    lastUpdated: 'Última actualización',
    sources: 'Fuente',
    print: 'Imprimir Resumen',
  },
} as const;

export function BilingualBriefView({ brief, initialLanguage = 'es' }: BilingualBriefViewProps) {
  const [lang, setLang] = useState<'en' | 'es'>(initialLanguage);
  const data = brief[lang];
  const L = LABELS[lang];

  return (
    <div className="space-y-6">
      {/* Language toggle + print row */}
      <div className="flex items-center justify-between">
        <LanguageToggle activeLanguage={lang} onToggle={setLang} />
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 transition-colors print:hidden"
          aria-label={L.print}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
          </svg>
          {L.print}
        </button>
      </div>

      {/* Urgent concerns — shown prominently at top if present */}
      {data.urgentConcerns && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
              <span className="text-xl" aria-hidden>⚠️</span>
              {L.urgent}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 text-lg leading-relaxed font-medium">{data.urgentConcerns}</p>
            <p className="mt-2 text-sm text-red-600 italic">{L.urgentNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Visit purpose banner */}
      {data.visitPurpose && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-0.5">{L.visitPurpose}</p>
          <p className="text-blue-900 text-base leading-relaxed">{data.visitPurpose}</p>
        </div>
      )}

      {/* Health overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🏥</span>
            {L.overview}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800 leading-relaxed text-lg">{data.overview}</p>
          <p className="mt-3 text-xs text-gray-400 italic">{L.notMedicalAdvice}</p>
        </CardContent>
      </Card>

      {/* Questions for doctor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>💬</span>
            {L.questions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {data.questionsForDoctor.map((question, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  {i + 1}
                </span>
                <p className="text-gray-800 text-lg leading-relaxed pt-0.5">{question}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Current meds to confirm — only shown when data is present */}
      {data.currentMedsToConfirm && data.currentMedsToConfirm.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>💊</span>
              {L.meds}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.currentMedsToConfirm.map((med, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-800 text-base">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                  {med}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Lab results to review — only shown when data is present */}
      {data.labsToReview && data.labsToReview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>🔬</span>
              {L.labs}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.labsToReview.map((lab, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-800 text-base">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-400" />
                  {lab}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Bring/prepare checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>📋</span>
            {L.checklist}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {data.bringChecklist.map((item, i) => (
              <ChecklistItem key={i} label={item} />
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Metadata footer */}
      <div className="text-center text-xs text-gray-400 space-y-1 pb-8">
        <p>{L.lastUpdated}: {new Date(brief.metadata.timestamp).toLocaleString()}</p>
        <p>{L.sources}: SMART on FHIR</p>
      </div>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);

  return (
    <li className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked
            ? 'border-green-600 bg-green-600 text-white'
            : 'border-gray-400 hover:border-blue-500'
        }`}
        aria-label={label}
      >
        {checked && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`text-lg leading-relaxed ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {label}
      </span>
    </li>
  );
}
