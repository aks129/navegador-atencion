'use client';

import { useTranslations } from 'next-intl';
import type { WorkQueueItem } from '@/types/navigator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SMSMockModal } from './SMSMockModal';

interface OutreachScriptProps {
  patient: WorkQueueItem;
}

export function OutreachScript({ patient }: OutreachScriptProps) {
  const t = useTranslations('navigator.outreach');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
  const briefLink = `${appUrl}/${patient.preferredLanguage}/patient/brief`;

  const scriptTemplate = t('scriptContent')
    .replace('{name}', patient.name.split(' ')[0])
    .replace('{link}', briefLink);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('script')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-gray-50 border p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {scriptTemplate}
          </p>
        </div>

        <SMSMockModal
          patientId={patient.patientId}
          defaultPhone={patient.phone ?? ''}
          defaultMessage={scriptTemplate}
          trigger={
            <Button className="w-full">
              📱 {t('sendSMS')}
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
