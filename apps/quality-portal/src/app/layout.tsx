import type { Metadata } from 'next';
import './globals.css';

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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                  QM
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    Quality Measure Portal
                  </p>
                  <p className="text-xs text-gray-500">Community Health Center — Riverside</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  UDS 2024 · Live Demo
                </span>
                <span className="text-sm text-gray-500">Care Team View</span>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
