'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './LocaleSwitcher';

interface AppHeaderProps {
  showNav?: boolean;
  variant?: 'patient' | 'navigator';
}

export function AppHeader({ showNav = true, variant = 'patient' }: AppHeaderProps) {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-sm">
            CN
          </div>
          <span className="font-semibold text-gray-900">{t('appName')}</span>
        </div>

        <div className="flex items-center gap-3">
          {showNav && variant === 'navigator' && (
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/navigator" className="text-gray-600 hover:text-blue-700 transition-colors">
                {t('patient')}
              </Link>
            </nav>
          )}
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
