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

function careGapVariant(gap: string): 'destructive' | 'warning' {
  const lower = gap.toLowerCase();
  if (lower.includes('overdue') || lower.includes('uncontrolled')) return 'destructive';
  return 'warning';
}

interface WorkQueueTableProps {
  patients: WorkQueueItem[];
}

export function WorkQueueTable({ patients }: WorkQueueTableProps) {
  const tP = useTranslations('navigator.patient');

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{tP('name')}</th>
            <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{tP('language')}</th>
            <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Care Gaps</th>
            <th className="px-4 py-3 text-left font-medium">{tP('briefStatus')}</th>
            <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{tP('lastContact')}</th>
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
                  {/* Care gaps visible on small screens only */}
                  {patient.careGaps.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 md:hidden">
                      {patient.careGaps.map((gap) => (
                        <Badge key={gap} variant={careGapVariant(gap)} className="text-xs px-1.5 py-0">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 hidden lg:table-cell">
                <span className="text-gray-600">{patient.preferredLanguage === 'es' ? 'Español' : 'English'}</span>
              </td>
              <td className="px-4 py-4 hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {patient.careGaps.length > 0
                    ? patient.careGaps.map((gap) => (
                        <Badge key={gap} variant={careGapVariant(gap)} className="text-xs">
                          {gap}
                        </Badge>
                      ))
                    : <span className="text-gray-400 text-xs">None</span>
                  }
                </div>
              </td>
              <td className="px-4 py-4">
                <BriefStatusBadge status={patient.briefStatus} />
              </td>
              <td className="px-4 py-4 hidden lg:table-cell text-gray-500">
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
