import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es', // Spanish-first
});

export type Locale = (typeof routing.locales)[number];
