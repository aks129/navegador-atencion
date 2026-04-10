'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCareNavigatorStore } from '@/store/care-navigator';
import { OutreachScript } from '@/components/navigator/OutreachScript';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const t = useTranslations('navigator');
  const patients = useCareNavigatorStore((s) => s.patients);
  const patient = patients.find((p) => p.patientId === patientId);

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <Link href="/navigator/patients">
          <Button variant="ghost" className="mt-4">← Back to patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <Link href="/navigator/patients">
        <Button variant="ghost" size="sm" className="text-gray-500">← Back</Button>
      </Link>

      {/* Patient header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{patient.name}</CardTitle>
              <p className="text-gray-500 text-sm mt-1">
                {patient.preferredLanguage === 'es' ? 'Español' : 'English'} •{' '}
                DOB: {patient.dob ?? 'Unknown'}
              </p>
            </div>
            <Badge variant={patient.briefStatus === 'viewed' ? 'success' : patient.briefStatus === 'sent' ? 'secondary' : 'warning'}>
              {t(`briefStatus.${patient.briefStatus}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium">{patient.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Upcoming Appointment</p>
            <p className="font-medium">{patient.upcomingAppointment ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Contact</p>
            <p className="font-medium">{patient.lastContact ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Outreach section */}
      <OutreachScript patient={patient} />
    </div>
  );
}
