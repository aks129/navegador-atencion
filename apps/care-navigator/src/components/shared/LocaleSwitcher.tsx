'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const pathname = usePathname();
  const router = useRouter();

  function toggleLocale() {
    const next = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: next });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      aria-label={t('toggle')}
      className="text-sm font-medium text-gray-600 hover:text-blue-700"
    >
      {locale === 'es' ? t('en') : t('es')}
    </Button>
  );
}
