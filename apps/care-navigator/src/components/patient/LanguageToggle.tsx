'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  activeLanguage: 'en' | 'es';
  onToggle: (lang: 'en' | 'es') => void;
}

export function LanguageToggle({ activeLanguage, onToggle }: LanguageToggleProps) {
  const t = useTranslations('language');

  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50" role="group" aria-label={t('toggle')}>
      {(['es', 'en'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onToggle(lang)}
          className={cn(
            'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
            activeLanguage === lang
              ? 'bg-white text-blue-700 shadow-sm font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          )}
          aria-pressed={activeLanguage === lang}
        >
          {t(lang)}
        </button>
      ))}
    </div>
  );
}
