'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';

interface SMSResult {
  queued: boolean;
  mockId: string;
  sentAt: string;
  twilioShape: {
    sid: string;
    status: string;
    to: string;
    from: string;
    body: string;
    numSegments: string;
    direction: string;
    price: null;
    priceUnit: string;
    dateCreated: string;
    uri: string;
  };
}

const schema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
  message: z.string().min(1).max(1600),
});
type FormData = z.infer<typeof schema>;

interface SMSMockModalProps {
  patientId: string;
  defaultPhone?: string;
  defaultMessage: string;
  trigger: React.ReactNode;
}

export function SMSMockModal({ patientId, defaultPhone = '', defaultMessage, trigger }: SMSMockModalProps) {
  const t = useTranslations('navigator.outreach');
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SMSResult | null>(null);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: defaultPhone, message: defaultMessage },
  });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: data.phone, body: data.message, patientId }),
      });
      if (!res.ok) throw new Error('SMS send failed');
      const json = await res.json();
      setResult(json);
    } catch {
      setError('SMS send failed. Check console for details.');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">{t('sendSMS')}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </Dialog.Close>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+1 (555) 000-0000"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message / Mensaje</label>
                <textarea
                  {...register('message')}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>}
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? t('sending') : t('send')}
                </Button>
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </Dialog.Close>
              </div>

              <p className="text-xs text-gray-400 text-center">⚠️ Mock only — no real SMS will be sent</p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-green-800 font-medium">✓ {t('sent')}</p>
                <p className="text-green-700 text-sm">SID: {result.twilioShape.sid}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-2 font-mono font-semibold">Twilio API Shape (Mock):</p>
                <pre className="text-xs text-gray-700 overflow-auto max-h-40 font-mono">
                  {JSON.stringify(result.twilioShape, null, 2)}
                </pre>
              </div>
              <Button className="w-full" onClick={() => { setResult(null); setOpen(false); }}>
                Done
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
