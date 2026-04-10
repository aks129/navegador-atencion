'use client';

import { useTranslations } from 'next-intl';
import type { WorkQueueItem, BriefStatus } from '@/types/navigator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

function BriefStatusBadge({ status }: { status: BriefStatus }) {
  const t = useTranslations('navigator.briefStatus');
  const variants: Record<BriefStatus, 'default' | 'success' | 'secondary' | 'warning' | 'destructive'> = {
    pending: 'warning',
    generating: 'default',
    sent: 'secondary',
    viewed: 'success',
    error: 'destructive',
  };
  return <Badge variant={variants[status]}>{t(status)}</Badge>;
}

interface WorkQueueTableProps {
  patients: WorkQueueItem[];
}

export function WorkQueueTable({ patients }: WorkQueueTableProps) {
  const t = useTranslations('navigator');
  const tP = useTranslations('navigator.patient');

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{tP('name')}</th>
            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">{tP('language')}</th>
            <th className="px-4 py-3 text-left font-medium">{tP('briefStatus')}</th>
            <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{tP('lastContact')}</th>
            <th className="px-4 py-3 text-left font-medium">{tP('actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {patients.map((patient) => (
            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  {patient.upcomingAppointment && (
                    <p className="text-xs text-gray-500">Appt: {patient.upcomingAppointment}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 hidden sm:table-cell">
                <span className="text-gray-600">{patient.preferredLanguage === 'es' ? 'Español' : 'English'}</span>
              </td>
              <td className="px-4 py-4">
                <BriefStatusBadge status={patient.briefStatus} />
              </td>
              <td className="px-4 py-4 hidden md:table-cell text-gray-500">
                {patient.lastContact ?? '—'}
              </td>
              <td className="px-4 py-4">
                <Link href={`/navigator/patients/${patient.patientId}`}>
                  <Button variant="ghost" size="sm">View →</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
