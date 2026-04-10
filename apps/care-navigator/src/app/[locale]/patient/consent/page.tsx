import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ConsentForm } from '@/components/patient/ConsentForm';
import { AppHeader } from '@/components/shared/AppHeader';

interface ConsentPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ConsentPage({ params }: ConsentPageProps) {
  const { locale } = await params;
  const session = await getSession();

  // If not authenticated, go back to launch
  if (!session.launchContext) {
    redirect(`/${locale}/patient/launch`);
  }

  // If already consented, go to brief
  if (session.consentGiven) {
    redirect(`/${locale}/patient/brief`);
  }

  // If opted out, show opt-out page
  if (session.optedOut) {
    redirect(`/${locale}/patient/opt-out`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showNav={false} />
      <main className="mx-auto max-w-lg px-4 py-10">
        <ConsentForm
          issuerUrl={session.launchContext.iss}
          locale={locale}
        />
      </main>
    </div>
  );
}
