'use client';

import { useTranslations } from 'next-intl';
import type { ReferralStub, ReferralStatus } from '@/types/navigator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  const t = useTranslations('navigator.referral');
  const variants: Record<ReferralStatus, 'warning' | 'default' | 'success' | 'secondary'> = {
    pending: 'warning',
    scheduled: 'default',
    completed: 'success',
    unknown: 'secondary',
  };
  return <Badge variant={variants[status]}>{t(status)}</Badge>;
}

interface ReferralCardProps {
  referral: ReferralStub;
}

export function ReferralCard({ referral }: ReferralCardProps) {
  const t = useTranslations('navigator.referral');

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900">{referral.specialty}</p>
          <ReferralStatusBadge status={referral.status} />
        </div>
        <p className="text-sm text-gray-600">{t('specialist')}: {referral.specialist}</p>
        <p className="text-sm text-gray-500">{t('date')}: {referral.referredDate}</p>
        {referral.scheduledDate && (
          <p className="text-sm text-gray-500">{t('scheduled')}: {referral.scheduledDate}</p>
        )}
        {referral.notes && (
          <p className="text-sm text-gray-500 italic">{referral.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
