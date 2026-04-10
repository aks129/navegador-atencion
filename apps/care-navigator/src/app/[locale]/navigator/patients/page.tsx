'use client';

import { useTranslations } from 'next-intl';
import { useCareNavigatorStore } from '@/store/care-navigator';
import { WorkQueueTable } from '@/components/navigator/WorkQueueTable';

export default function PatientsPage() {
  const t = useTranslations('navigator');
  const patients = useCareNavigatorStore((s) => s.patients);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('patients')}</h1>
        <p className="text-gray-600 text-sm">{patients.length} patients in panel</p>
      </div>
      <WorkQueueTable patients={patients} />
    </div>
  );
}
