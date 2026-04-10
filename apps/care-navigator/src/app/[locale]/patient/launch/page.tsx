import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/shared/AppHeader';

interface LaunchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function LaunchPage({ params, searchParams }: LaunchPageProps) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations('launch');
  const errT = await getTranslations('errors');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://care-navigator-nu.vercel.app';

  // The SMART Health IT sandbox requires a launch context created by its launcher UI.
  // Clicking Connect sends the user to the sandbox launcher, which redirects back to
  // our /api/auth/launch with ?iss=...&launch=... populated.
  const launchUri = `${appUrl}/api/auth/launch`;
  const launchUrl = `https://launch.smarthealthit.org/?launch_uri=${encodeURIComponent(launchUri)}&fhir_version=r4`;

  const errorMessages: Record<string, string> = {
    state_mismatch: errT('auth'),
    token_exchange_failed: errT('auth'),
    missing_params: errT('auth'),
    default: errT('generic'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <AppHeader showNav={false} />
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        {/* Hero icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-10 w-10 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mb-8 text-lg text-gray-600">{t('subtitle')}</p>

        {error && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            {errorMessages[error] ?? errorMessages['default']}
          </div>
        )}

        <div className="space-y-4">
          <a href={launchUrl} className="block">
            <Button size="lg" className="w-full text-lg">
              {t('connect')}
            </Button>
          </a>

          <p className="text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('sandbox')}
            </span>
          </p>

          <p className="text-sm text-gray-500 px-4">{t('privacy')}</p>

          <a href={`/${locale}/patient/opt-out`} className="block text-sm text-gray-400 hover:text-gray-600 underline">
            {t('optOut')}
          </a>
        </div>
      </main>
    </div>
  );
}
