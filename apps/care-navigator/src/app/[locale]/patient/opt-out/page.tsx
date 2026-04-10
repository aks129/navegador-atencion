'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OptOutPage() {
  const t = useTranslations('optOut');
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleOptOut() {
    setLoading(true);
    await fetch('/api/consent', { method: 'DELETE' }).catch(() => null);
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showNav={false} />
      <main className="mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {done ? (
              <div className="space-y-4">
                <p className="text-green-700 bg-green-50 rounded-lg px-4 py-3">{t('done')}</p>
                <Button variant="outline" className="w-full" onClick={() => router.push('/patient/launch')}>
                  Reconnect / Reconectar
                </Button>
              </div>
            ) : (
              <>
                <p className="text-gray-700">{t('message')}</p>
                <div className="flex flex-col gap-3">
                  <Button variant="destructive" onClick={handleOptOut} disabled={loading} className="w-full">
                    {t('confirm')}
                  </Button>
                  <Button variant="ghost" onClick={() => router.back()} className="w-full">
                    {t('cancel')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
