'use client';

import { useParams } from 'next/navigation';
import { useCareNavigatorStore } from '@/store/care-navigator';
import { OutreachScript } from '@/components/navigator/OutreachScript';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function OutreachPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const patients = useCareNavigatorStore((s) => s.patients);
  const patient = patients.find((p) => p.patientId === patientId);

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <Link href="/navigator/patients">
          <Button variant="ghost" className="mt-4">← Back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Link href={`/navigator/patients/${patientId}`}>
        <Button variant="ghost" size="sm" className="text-gray-500">← Back to {patient.name}</Button>
      </Link>
      <OutreachScript patient={patient} />
    </div>
  );
}
