'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
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
  const { locale } = useParams<{ locale: string }>();
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

      {/* SMART Demo CTA banner */}
      <a
        href={`/api/auth/launch?locale=${locale ?? 'en'}`}
        className="flex items-center justify-between rounded-xl bg-blue-700 px-5 py-4 text-white hover:bg-blue-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Launch SMART Demo</p>
            <p className="text-xs text-blue-100">Connect to SMART Health IT sandbox → auto-generate a bilingual patient brief</p>
          </div>
        </div>
        <svg className="h-5 w-5 opacity-70 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>

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
