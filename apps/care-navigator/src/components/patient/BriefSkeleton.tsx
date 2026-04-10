import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

export function BriefSkeleton() {
  const t = useTranslations('brief');

  return (
    <div className="space-y-6" aria-label={t('loading')} aria-busy="true">
      {/* Language toggle skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Overview section */}
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Questions section */}
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <Skeleton className="h-6 w-56" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>

      {/* Checklist section */}
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <Skeleton className="h-6 w-52" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>

      <p className="text-center text-gray-500 text-sm animate-pulse">{t('loading')}</p>
    </div>
  );
}
