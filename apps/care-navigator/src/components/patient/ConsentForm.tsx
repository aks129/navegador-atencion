'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConsentFormProps {
  issuerUrl: string;
  locale: string;
}

export function ConsentForm({ issuerUrl, locale }: ConsentFormProps) {
  const t = useTranslations('consent');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccept() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/consent', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to record consent');
      router.push('/patient/brief');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function handleDecline() {
    router.push('/patient/opt-out');
  }

  const consentPoints = ['1', '2', '3', '4'] as const;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{t('title')}</CardTitle>
        <p className="text-gray-600">{t('subtitle')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {consentPoints.map((key) => (
            <li key={key} className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {key}
              </span>
              <p className="text-gray-700">{t(`points.${key}`)}</p>
            </li>
          ))}
        </ul>

        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-medium">{t('source')}</span>{' '}
          <span className="font-mono text-xs">{issuerUrl}</span>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={handleAccept} disabled={loading} className="w-full">
            {loading ? '...' : t('agree')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDecline} className="text-gray-500">
            {t('decline')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
