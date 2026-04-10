'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BilingualBrief } from '@/types/brief';
import { LanguageToggle } from './LanguageToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BilingualBriefViewProps {
  brief: BilingualBrief;
  initialLanguage?: 'en' | 'es';
}

export function BilingualBriefView({ brief, initialLanguage = 'es' }: BilingualBriefViewProps) {
  const [lang, setLang] = useState<'en' | 'es'>(initialLanguage);
  const t = useTranslations('brief');
  const data = brief[lang];

  return (
    <div className="space-y-6">
      {/* Language toggle — prominent, centered */}
      <div className="flex justify-center">
        <LanguageToggle activeLanguage={lang} onToggle={setLang} />
      </div>

      {/* Health overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🏥</span>
            {t('overview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800 leading-relaxed text-lg">
            {data.overview}
          </p>
          <p className="mt-3 text-xs text-gray-400 italic">{t('notMedicalAdvice')}</p>
        </CardContent>
      </Card>

      {/* Questions for doctor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>💬</span>
            {t('questions')}
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

      {/* Bring/prepare checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>📋</span>
            {t('checklist')}
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
        <p>{t('lastUpdated')}: {new Date(brief.metadata.timestamp).toLocaleString()}</p>
        <p>{t('sources')}: SMART on FHIR</p>
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
        role="checkbox"
        aria-checked={checked}
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
