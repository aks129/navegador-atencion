'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { BilingualBrief } from '@/types/brief';
import { BilingualBriefView } from '@/components/patient/BilingualBriefView';
import { BriefSkeleton } from '@/components/patient/BriefSkeleton';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/ui/button';

export default function BriefPage() {
  const t = useTranslations('brief');
  const locale = useLocale() as 'en' | 'es';
  const router = useRouter();
  const [brief, setBrief] = useState<BilingualBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBrief() {
      try {
        const res = await fetch('/api/brief', { method: 'POST' });
        if (res.status === 401) {
          router.push('/patient/launch');
          return;
        }
        if (res.status === 403) {
          router.push('/patient/consent');
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'Failed to generate brief');
        }
        const data = await res.json();
        setBrief(data.brief);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'));
      } finally {
        setLoading(false);
      }
    }

    loadBrief();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        {loading && <BriefSkeleton />}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
            <p className="text-red-700">{error}</p>
            <Button variant="outline" onClick={() => { setError(''); setLoading(true); window.location.reload(); }}>
              {t('retry')}
            </Button>
          </div>
        )}

        {brief && !loading && (
          <BilingualBriefView brief={brief} initialLanguage={locale} />
        )}

        {/* Opt-out link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => router.push('/patient/opt-out')}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            {t('optOut')}
          </button>
        </div>
      </main>
    </div>
  );
}
