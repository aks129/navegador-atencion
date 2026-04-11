import Link from 'next/link';

type ItemStatus = 'done' | 'in-progress' | 'planned';

interface RoadmapItem {
  label: string;
  status: ItemStatus;
}

interface AppSection {
  id: string;
  icon: string;
  title: string;
  liveUrl?: string;
  description: string;
  milestone: string;
  items: RoadmapItem[];
  next: string[];
}

const STATUS_COLOR: Record<ItemStatus, string> = {
  done: 'bg-green-100 text-green-700 border-green-200',
  'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
  planned: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  done: 'Done',
  'in-progress': 'In Progress',
  planned: 'Planned',
};

const apps: AppSection[] = [
  {
    id: 'care-navigator',
    icon: '🩺',
    title: 'Care Navigator',
    description: 'AI-powered bilingual patient outreach for Medi-Cal FQHCs',
    milestone: 'M001 S01 — Clinically Realistic Work Queue',
    items: [
      { label: 'Work queue with 8 realistic Medi-Cal patients', status: 'done' },
      { label: 'Care gap badges (HbA1c, BP, mammogram, colonoscopy)', status: 'done' },
      { label: 'Patient detail page with conditions + last outreach', status: 'done' },
      { label: 'EN / ES language toggle (next-intl)', status: 'done' },
      { label: 'Demo-auth login with password protection', status: 'done' },
      { label: 'Sidebar link to Quality Portal', status: 'done' },
      { label: 'AI outreach brief generation (Groq + Claude)', status: 'done' },
      { label: 'M001 S02 — Real patient data intake (FHIR or CSV)', status: 'planned' },
      { label: 'M001 S03 — Outreach call logging + follow-up scheduling', status: 'planned' },
      { label: 'M001 S04 — Panel-level care gap summary dashboard', status: 'planned' },
    ],
    next: [
      'Connect to real FHIR or CSV patient imports (M001 S02)',
      'Add outreach call logging and follow-up scheduling (M001 S03)',
      'Build panel-level care gap summary and trend charts (M001 S04)',
      'Add CHW task assignment and supervisor review workflow',
    ],
  },
  {
    id: 'quality-portal',
    icon: '📊',
    title: 'Quality Portal',
    description: 'HEDIS & UDS quality measure tracking for value-based care',
    milestone: 'Phase 2 — FQHC Quality Portal',
    items: [
      { label: 'HEDIS measure dashboard (DM, HTN, cancer screening)', status: 'done' },
      { label: 'UDS performance table with benchmarks', status: 'done' },
      { label: 'Provider panel performance breakdown', status: 'done' },
      { label: 'Payer-ready quality report export (PDF/JSON)', status: 'in-progress' },
      { label: 'Back-link to Care Navigator hub', status: 'done' },
      { label: 'Demo-auth password protection', status: 'done' },
      { label: 'Real FHIR data pipeline integration', status: 'planned' },
      { label: 'Measure gap drill-down by patient panel', status: 'planned' },
      { label: 'Automated UDS XML export for HRSA submission', status: 'planned' },
    ],
    next: [
      'Finish payer-ready report export (PDF)',
      'Connect live FHIR data for real-time measure calculation',
      'Add measure gap patient-level drill-down',
      'Build HRSA UDS XML export for annual submission',
    ],
  },
  {
    id: 'fhir-summarizer',
    icon: '⚕️',
    title: 'FHIR Summarizer',
    description: 'Persona-adaptive AI health summaries from FHIR bundles',
    milestone: 'Phase 1 — Equity Audit Harness',
    items: [
      { label: 'FHIR R4 bundle upload and validation', status: 'done' },
      { label: 'Claude-powered AI summarization (patient/provider/payer)', status: 'done' },
      { label: 'Lab trend charts and medication timeline', status: 'done' },
      { label: 'Clinical review items (care gaps, med interactions)', status: 'done' },
      { label: 'Persona template selector (6 templates)', status: 'done' },
      { label: 'FHIR Composition export', status: 'done' },
      { label: 'Shareable summary links', status: 'done' },
      { label: 'Bundle flattening for large datasets (1.5MB+)', status: 'done' },
      { label: 'FHIR server connection (HAPI FHIR)', status: 'done' },
      { label: 'Hub integration and demo-auth login', status: 'done' },
      { label: 'Equity audit — SDOH gap analysis', status: 'planned' },
      { label: 'Batch processing for panel-level summaries', status: 'planned' },
    ],
    next: [
      'Add SDOH screening gap detection (equity audit)',
      'Build batch processing for full patient panel summaries',
      'Add structured output for downstream EHR integration',
      'Evaluator package — clinical accuracy benchmarking',
    ],
  },
];

function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function StatusPage() {
  const totalDone = apps.flatMap(a => a.items).filter(i => i.status === 'done').length;
  const totalItems = apps.flatMap(a => a.items).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <span className="text-slate-400">←</span>
            <span className="font-medium">Back to Hub</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Status</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Summary bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Platform Status</h1>
              <p className="text-sm text-slate-500 mt-0.5">Vestel-Magan JV · April 2026</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{totalDone}/{totalItems}</div>
              <div className="text-xs text-slate-500">features shipped</div>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.round((totalDone / totalItems) * 100)}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {totalDone} Done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              {apps.flatMap(a => a.items).filter(i => i.status === 'in-progress').length} In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
              {apps.flatMap(a => a.items).filter(i => i.status === 'planned').length} Planned
            </span>
          </div>
        </div>

        {/* Per-app cards */}
        {apps.map(app => (
          <div key={app.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-4">
              <span className="text-3xl">{app.icon}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">{app.title}</h2>
                <p className="text-sm text-slate-500">{app.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-slate-400 mb-1">Current Milestone</div>
                <div className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  {app.milestone}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Features</h3>
              <div className="space-y-2">
                {app.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className={`text-sm flex-1 ${item.status === 'done' ? 'text-slate-700' : item.status === 'in-progress' ? 'text-slate-700' : 'text-slate-400'}`}>
                      {item.status === 'done' && <span className="text-green-500 mr-2">✓</span>}
                      {item.label}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Next Up</h3>
              <ul className="space-y-1.5">
                {app.next.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-300 mt-0.5 flex-shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Platform notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Platform Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Authentication</h3>
              <p>All three apps use cookie-based demo auth with a shared password (<code className="bg-slate-100 px-1 rounded text-xs">PORTAL_AUTH_TOKEN</code> env var). Session duration: 8 hours.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Deployment</h3>
              <p>Three separate Vercel projects: <strong>navegador-atencion</strong> (hub + FHIR), <strong>care-navigator</strong>, and <strong>quality-portal</strong>. All linked to the same GitHub monorepo.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Data</h3>
              <p>All patient data is synthetic. The FHIR summarizer connects to the public HAPI FHIR test server by default. No real PHI is stored anywhere.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">AI Models</h3>
              <p>Care Navigator outreach briefs use Groq (Llama 3 70B). FHIR Summarizer uses Claude Sonnet via the Anthropic API. Quality Portal analytics are rule-based (no LLM).</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-400">
        Plumly Health · Vestel-Magan JV · 2026 · For demo purposes only. No real patient data.
      </footer>
    </div>
  );
}
