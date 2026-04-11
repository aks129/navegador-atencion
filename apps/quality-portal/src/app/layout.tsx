import type { Metadata } from 'next';
import './globals.css';
import { LogoutButton } from '@/components/LogoutButton';

export const metadata: Metadata = {
  title: 'Quality Measure Portal | Community Health Center',
  description: 'UDS Quality Measures Dashboard for FQHC care teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white shadow-sm print:hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <a href="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                    QM
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      Quality Measure Portal
                    </p>
                    <p className="text-xs text-gray-500">Community Health Center — Riverside</p>
                  </div>
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  UDS 2024 · Demo
                </span>
                <a
                  href={process.env.NEXT_PUBLIC_CARE_NAVIGATOR_URL ?? 'http://localhost:3001'}
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Care Navigator
                </a>
                <a href="/pitch" className="hidden sm:block text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  Pitch
                </a>
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
