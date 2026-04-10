import { getTranslations } from 'next-intl/server';
import { ReferralCard } from '@/components/navigator/ReferralCard';
import type { ReferralStub } from '@/types/navigator';

// Demo referral stubs for prototype
const DEMO_REFERRALS: ReferralStub[] = [
  {
    id: 'ref-1',
    patientId: 'patient-001',
    specialist: 'Dr. Ramirez',
    specialty: 'Endocrinology',
    status: 'pending',
    referredDate: '2026-04-01',
    notes: 'HbA1c management — diabetes follow-up',
  },
  {
    id: 'ref-2',
    patientId: 'patient-002',
    specialist: 'Dr. Park',
    specialty: 'Cardiology',
    status: 'scheduled',
    referredDate: '2026-03-20',
    scheduledDate: '2026-04-20',
    notes: 'Hypertension evaluation',
  },
  {
    id: 'ref-3',
    patientId: 'patient-003',
    specialist: 'County Mental Health',
    specialty: 'Behavioral Health',
    status: 'unknown',
    referredDate: '2026-03-10',
    notes: 'PHQ-9 score 12 — follow-up on status',
  },
];

export default async function ReferralsPage() {
  const t = await getTranslations('navigator');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('referrals')}</h1>
        <p className="text-gray-600 text-sm">{DEMO_REFERRALS.length} open referrals</p>
      </div>

      <div className="space-y-4">
        {DEMO_REFERRALS.map((ref) => (
          <ReferralCard key={ref.id} referral={ref} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Demo data — referral tracking will be connected to EHR in production
      </p>
    </div>
  );
}
