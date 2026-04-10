import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';

export default async function LocaleRoot() {
  const locale = await getLocale();
  redirect(`/${locale}/patient/launch`);
}
