'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CARE_NAVIGATOR_URL = process.env.NEXT_PUBLIC_CARE_NAVIGATOR_URL ?? 'http://localhost:3001';
const QUALITY_PORTAL_URL = process.env.NEXT_PUBLIC_QUALITY_PORTAL_URL ?? 'http://localhost:3002';

const apps = [
  {
    id: 'care-navigator',
    icon: '🩺',
    title: 'Care Navigator',
    tagline: 'Bilingual AI outreach for Medi-Cal patients',
    description: 'AI-powered work queue for high-risk patient outreach. Close care gaps, coordinate CHW tasks, and communicate in English and Spanish.',
    href: CARE_NAVIGATOR_URL,
    external: true,
    status: 'Live',
  },
  {
    id: 'quality-portal',
    icon: '📊',
    title: 'Quality Portal',
    tagline: 'HEDIS & UDS quality measure tracking',
    description: 'Monitor NCQA, HEDIS, and UDS performance in real time. Identify care gaps and export payer-ready quality reports.',
    href: QUALITY_PORTAL_URL,
    external: true,
    status: 'Live',
  },
  {
    id: 'fhir-summarizer',
    icon: '⚕️',
    title: 'FHIR Summarizer',
    tagline: 'Persona-adaptive AI health summaries',
    description: 'Upload FHIR bundles and generate AI summaries tailored for patients, providers, or payers. Powered by Claude.',
    href: '/app',
    external: false,
    status: 'Live',
  },
];

export default function HubPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/demo-auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-700 flex items-center justify-center text-white text-sm font-bold shadow">
              P
            </div>
            <div>
              <span className="font-semibold text-slate-900">Plumly Health</span>
              <span className="hidden sm:inline ml-2 text-xs text-slate-400">Safety-Net AI Platform</span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/pitch"
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Pitch
            </Link>
            <Link
              href="/status"
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Status
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-md transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <span className="inline-block px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-full mb-4">
          Demo Environment
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Safety-Net Health AI Platform
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          AI-powered tools for FQHCs and community health centers. Reduce care gaps, improve bilingual outreach, and close quality measure gaps.
        </p>
      </section>

      {/* App Cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Applications</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {apps.map(app => (
            <a
              key={app.id}
              href={app.href}
              target={app.external ? '_blank' : undefined}
              rel={app.external ? 'noopener noreferrer' : undefined}
              className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{app.icon}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                  {app.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {app.title}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-2">{app.tagline}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{app.description}</p>
              <div className="mt-4 text-xs font-medium text-blue-600 group-hover:text-blue-700">
                Open app →
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer links */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex gap-4 text-sm text-slate-400">
          <Link href="/pitch" className="hover:text-slate-600 transition-colors">Product Pitch</Link>
          <span>·</span>
          <Link href="/status" className="hover:text-slate-600 transition-colors">Project Status</Link>
          <span>·</span>
          <span>Vestel-Magan JV · 2026</span>
        </div>
      </section>
    </div>
  );
}
