import Link from 'next/link';

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <span className="text-slate-400">←</span>
            <span className="font-medium">Back to Hub</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Pitch</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Hero */}
        <section>
          <div className="inline-block px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-full mb-4">
            Early-Stage Demo · Vestel-Magan JV
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
            AI-powered care coordination<br />for safety-net health centers
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
            Plumly Health gives FQHCs and community health centers the AI tools to close care gaps, coordinate bilingual outreach, and improve quality measure performance — without adding headcount.
          </p>
        </section>

        {/* Problem */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">The Problem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                stat: '75M+',
                label: 'Americans rely on safety-net clinics',
                detail: 'FQHCs and CHCs serve the nation\'s most vulnerable — uninsured, Medicaid, and underserved populations.',
              },
              {
                stat: '40%',
                label: 'of care gaps go unaddressed',
                detail: 'Staff burnout, language barriers, and manual workflows mean preventive care falls through the cracks.',
              },
              {
                stat: '$4B+',
                label: 'in quality bonuses left on the table',
                detail: 'HEDIS and UDS performance gaps cost health centers millions in value-based care incentives each year.',
              },
            ].map(item => (
              <div key={item.stat} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <div className="text-3xl font-bold text-blue-700 mb-1">{item.stat}</div>
                <div className="font-semibold text-slate-800 mb-2 text-sm">{item.label}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Solution */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">Our Solution</h2>
          <p className="text-lg text-slate-700 mb-8 max-w-2xl">
            Three integrated AI tools, purpose-built for safety-net workflows and Medi-Cal populations.
          </p>
          <div className="space-y-4">
            {[
              {
                icon: '🩺',
                title: 'Care Navigator',
                tagline: 'Bilingual AI outreach for high-risk patients',
                bullets: [
                  'AI-generated outreach scripts in English and Spanish (Claude-powered)',
                  'Risk-stratified work queue with care gap prioritization',
                  'Tracks HbA1c, BP control, mammography, colonoscopy, and more',
                  'Built for CHW (community health worker) workflows',
                ],
              },
              {
                icon: '📊',
                title: 'Quality Portal',
                tagline: 'Real-time HEDIS & UDS quality measure tracking',
                bullets: [
                  'Live dashboards for NCQA, HEDIS, and UDS performance',
                  'Identifies measure-level gaps and improvement opportunities',
                  'Exportable payer-ready quality reports',
                  'Tracks performance across provider panels and care teams',
                ],
              },
              {
                icon: '⚕️',
                title: 'FHIR Summarizer',
                tagline: 'Persona-adaptive AI health summaries',
                bullets: [
                  'Ingests FHIR R4 bundles from any EHR or health system',
                  'Generates summaries tailored for patients, providers, or payers',
                  'Supports clinical review, care gap analysis, and medication safety checks',
                  'Export to FHIR Composition, text, or structured JSON',
                ],
              },
            ].map(app => (
              <div key={app.title} className="border border-slate-200 rounded-xl p-6 flex gap-4">
                <span className="text-3xl flex-shrink-0">{app.icon}</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{app.title}</h3>
                    <span className="text-sm text-slate-500">— {app.tagline}</span>
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1 mt-2">
                    {app.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Market */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">Target Market</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Primary: FQHCs &amp; Look-Alikes</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex gap-2"><span className="text-blue-500">→</span> 1,400+ FQHC organizations in the US</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> $30B+ in annual federal funding</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> UDS reporting requirements create built-in demand</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Medi-Cal managed care value-based contracts in CA</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Secondary: Community Health Centers</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex gap-2"><span className="text-blue-500">→</span> Safety-net hospitals and community clinics</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Rural health clinics and tribal health programs</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Medicaid ACOs with quality bonus programs</li>
                <li className="flex gap-2"><span className="text-blue-500">→</span> Plan-contracted CHW programs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'AI/LLM', value: 'Claude (Anthropic) + Groq' },
              { label: 'Framework', value: 'Next.js 14 · App Router' },
              { label: 'Data Standard', value: 'FHIR R4 · HAPI FHIR' },
              { label: 'Infrastructure', value: 'Vercel · Turborepo' },
              { label: 'Language', value: 'TypeScript · Tailwind CSS' },
              { label: 'i18n', value: 'next-intl · EN / ES' },
              { label: 'Testing', value: 'Vitest · Playwright' },
              { label: 'State', value: 'Zustand · React 18' },
            ].map(item => (
              <div key={item.label} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs font-semibold text-slate-400 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-slate-700">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">See it in action</h2>
          <p className="text-blue-200 mb-6 max-w-xl">
            This demo environment includes realistic Medi-Cal patient scenarios. Explore all three apps with the access password provided.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-block bg-white text-blue-700 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              Open Hub
            </Link>
            <Link
              href="/status"
              className="inline-block border border-blue-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              View Roadmap
            </Link>
          </div>
        </section>
      </main>

      <footer className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-xs text-slate-400">
        Vestel-Magan JV · Plumly Health · 2026 · For demo purposes only. No real patient data.
      </footer>
    </div>
  );
}
