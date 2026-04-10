'use client';

import { useTranslations } from 'next-intl';
import { useCareNavigatorStore } from '@/store/care-navigator';
import { WorkQueueTable } from '@/components/navigator/WorkQueueTable';
import { Card, CardContent } from '@/components/ui/card';

function StatCard({ label, value, color = 'blue' }: { label: string; value: number | string; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-700 bg-blue-50',
    green: 'text-green-700 bg-green-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-red-700 bg-red-50',
  };
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg text-lg font-bold mb-2 ${colorMap[color]}`}>
          {value}
        </div>
        <p className="text-sm text-gray-600">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function NavigatorDashboard() {
  const t = useTranslations('navigator');
  const patients = useCareNavigatorStore((s) => s.patients);

  const stats = {
    total: patients.length,
    briefsSent: patients.filter((p) => ['sent', 'viewed'].includes(p.briefStatus)).length,
    pending: patients.filter((p) => p.briefStatus === 'pending').length,
    referralsOpen: 3, // Demo value
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 text-sm">{t('workQueue')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('totalPatients')} value={stats.total} color="blue" />
        <StatCard label={t('briefsSent')} value={stats.briefsSent} color="green" />
        <StatCard label={t('pendingOutreach')} value={stats.pending} color="amber" />
        <StatCard label={t('referralsOpen')} value={stats.referralsOpen} color="red" />
      </div>

      {/* Work queue */}
      <WorkQueueTable patients={patients} />
    </div>
  );
}
