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

  // Direct to our launch API — ISS is the sim URL with patient picker embedded
  const launchUrl = `/api/auth/launch?locale=${locale}`;

  const errorMessages: Record<string, string> = {
    state_mismatch: errT('auth'),
    token_exchange_failed: errT('auth'),
    missing_params: errT('auth'),
    default: errT('generic'),
  };

  const otherLocale = locale === 'es' ? 'en' : 'es';
  const otherLocaleName = locale === 'es' ? 'English' : 'Español';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <AppHeader showNav={false} />

      {/* Language toggle */}
      <div className="flex justify-end px-4 pt-3">
        <a
          href={`/${otherLocale}/patient/launch`}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
          </svg>
          {otherLocaleName}
        </a>
      </div>

      <main className="mx-auto max-w-lg px-4 py-12 text-center">
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
