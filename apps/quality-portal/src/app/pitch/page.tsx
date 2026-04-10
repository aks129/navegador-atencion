import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Pitch | Safety-Net AI Platform',
  description:
    'Go-to-market strategy and jobs-to-be-done for the Vestel-Magan safety-net health AI platform',
};

export default function PitchPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 py-8">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
          Vestel-Magan JV · Safety-Net Health AI
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          AI-Powered Health Navigation<br />for America&apos;s Safety-Net
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Open-source equity methodology + hosted clinical platform for Federally Qualified Health
          Centers, Medi-Cal MCOs, and the populations they serve.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Live Demo →
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 text-gray-700 px-6 py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Sign In
          </a>
        </div>
      </section>

      {/* The Problem */}
      <section>
        <SectionLabel>The Problem</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Safety-net patients are invisible to existing AI tools
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard
            value="11 min"
            label="Average time to authenticate on Patient Access APIs for low-income patients"
            color="red"
          />
          <StatCard
            value="200+ hrs"
            label="Annual staff time FQHCs spend on UDS quality measure reporting — manually"
            color="amber"
          />
          <StatCard
            value="0"
            label="Major AI health tools designed for mixed-status, Spanish-speaking, low-literacy patients"
            color="red"
          />
        </div>
        <div className="mt-6 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Competitive Gap</p>
          <p className="text-sm text-amber-700 leading-relaxed">
            Primary Record, Docsnap, and b.well all build for English-speaking, college-educated
            caregivers. Their own documentation admits they don&apos;t serve populations needing
            the most coordination — and that are least funded. <strong>We build for everyone else.</strong>
          </p>
        </div>
      </section>

      {/* JTBD */}
      <section>
        <SectionLabel>Jobs to Be Done</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Three customer jobs, one platform
        </h2>
        <p className="text-gray-600 mb-6">
          Each pilot is designed around a specific, measurable job with a clear outcome metric — not a feature set.
        </p>
        <div className="space-y-4">
          <JTBDCard
            pilot="Pilot 1"
            phase="Months 0–3 · Open Source"
            color="purple"
            who="Clinical AI Researchers &amp; Regulators"
            job="Measure whether AI models produce equitable outputs across diverse safety-net populations — Spanish dialects, code-switching, low-literacy, LEP patients"
            outcome="Academic credibility: preprint submitted to JAMIA or NEJM AI with 3+ named clinical AI researcher endorsers"
            investment="~$0 cash · 120 engineering hrs · 80 clinical methodology hrs"
            icon="🔬"
          />
          <JTBDCard
            pilot="Pilot 2"
            phase="Months 2–7 · Cash Engine"
            color="blue"
            who="FQHC Quality Directors"
            job="Automate UDS Table 6B quality measure reporting to eliminate 200+ hours of manual work per year — and surface patient-level gap action lists in real time"
            outcome="Design partner runs ≥1 UDS measure end-to-end on real data, reports time savings, provides written quote for funder materials"
            investment="$15–25k cash · 280 engineering hrs · 60 clinical validation hrs"
            icon="📊"
          />
          <JTBDCard
            pilot="Pilot 3"
            phase="Months 6–12 · Patient Impact"
            color="green"
            who="Safety-Net Patients (via Clinics)"
            job="Prepare for a medical visit in their preferred language — English or Spanish — so they can ask the right questions, know what to bring, and understand their own health"
            outcome="Statistically meaningful signal on pre-visit agenda quality (clinician-rated 1–5) or no-show reduction in 40-patient stepped-wedge pilot"
            investment="$40–60k cash · 320 engineering hrs · 120 clinical/protocol hrs"
            icon="🏥"
          />
        </div>
      </section>

      {/* Why This Sequencing */}
      <section>
        <SectionLabel>Go-to-Market Strategy</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          1 → 2 → 3 sequencing, not 1+3
        </h2>
        <p className="text-gray-600 mb-6">
          Pilot 2 is the cash engine. It must generate revenue before Pilot 3 is built — otherwise we are
          100% grant-dependent with no leverage and no timeline control.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <ReasonCard
            icon="💰"
            title="Revenue First"
            body="Pilot 2 generates paying design-partner contract by Month 6 — before Pilot 3 begins. One FQHC subscription covers Pilot 3 operating costs."
          />
          <ReasonCard
            icon="🤝"
            title="Trust Pipeline"
            body="Pilot 2 builds FQHC relationships needed for the Pilot 3 IRB and patient recruitment. You cannot recruit safety-net patients without clinical trust."
          />
          <ReasonCard
            icon="♻️"
            title="IP Leverage"
            body="Pilot 2 reuses 70–80% of existing CQL measure libraries — lowest marginal cost of the three pilots. Pilot 1 validates the equity methodology that Pilot 2 runs on."
          />
        </div>
        <div className="rounded-xl bg-blue-50 ring-1 ring-blue-200 p-5">
          <p className="text-sm font-semibold text-blue-800 mb-2">Commercial Model: Open Core + Hosted Platform</p>
          <ul className="text-sm text-blue-700 space-y-1.5">
            <li>• <strong>Pilot 1:</strong> Fully open source (Apache 2.0) — value is academic brand, not code</li>
            <li>• <strong>Pilot 2:</strong> Open-source measure libraries (community adoption) + hosted compute/reporting layer (FQHC subscription revenue)</li>
            <li>• <strong>Pilot 3:</strong> B2B contracts with FQHCs, Medi-Cal MCOs, ECM lead care manager organizations</li>
          </ul>
        </div>
      </section>

      {/* Target Market */}
      <section>
        <SectionLabel>Target Market</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Who we serve</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <MarketCard
            segment="FQHCs"
            description="Federally Qualified Health Centers in California — starting with Sonoma-Mendocino-Lake network. 1,400+ FQHCs nationally, each required to submit UDS annually to HRSA."
            tags={['Quality reporting', 'UDS compliance', 'Patient navigation']}
          />
          <MarketCard
            segment="Medi-Cal MCOs"
            description="Managed Care Organizations under CalAIM and the CMS-0057-F Patient Access API rule. Low API adoption data becomes 'embarrassing' public metric by March 31, 2026."
            tags={['ECM navigation', 'API compliance', 'DHCS interface']}
          />
          <MarketCard
            segment="Safety-Net Patients"
            description="Mixed-status families, Spanish-speaking patients, low-literacy adults, rural broadband-constrained populations — those who need care coordination most and are served least."
            tags={['Bilingual', 'Low-literacy', 'Trust-first design']}
          />
          <MarketCard
            segment="ECM Organizations"
            description="Extended Care Management lead care manager organizations — paying for navigation work right now under CalAIM, with 1115 waiver renewal in front of CMS."
            tags={['CalAIM', 'Care navigation', 'Population health']}
          />
        </div>
      </section>

      {/* Regulatory Tailwinds */}
      <section>
        <SectionLabel>Regulatory Tailwinds</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">The window is open now</h2>
        <div className="space-y-3">
          <TailwindCard
            deadline="March 31, 2026"
            rule="CMS-0057-F: Every Medi-Cal MCO must publicly post Patient Access API usage metrics"
            impact="Adoption numbers will be low and embarrassing. Creates immediate demand for alternatives."
            urgency="hot"
          />
          <TailwindCard
            deadline="Active Now"
            rule="CalAIM ECM: Paying for navigation work across California safety-net"
            impact="1115 waiver renewal in front of CMS. 12–18 month window where rules are being written — opportunity to influence."
            urgency="active"
          />
          <TailwindCard
            deadline="January 1, 2027"
            rule="Patient Access APIs must expose prior authorization data"
            impact="Dramatically expands data available through SMART on FHIR — reduces onboarding friction for Pilot 3."
            urgency="upcoming"
          />
          <TailwindCard
            deadline="2026 RFP Cycle"
            rule="CHCF Technology and Innovation Track, Commonwealth Fund, RWJF"
            impact="All three foundations have active AI-in-safety-net portfolios. Pilot 1 preprint is the credibility unlock for CHCF Health Innovation Fund and PRIs."
            urgency="upcoming"
          />
        </div>
      </section>

      {/* 6 UDS Measures */}
      <section>
        <SectionLabel>Pilot 2 — What We Automate</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">6 measures, not 40+</h2>
        <p className="text-gray-600 mb-6">
          Deliberately scoped to the 6 highest-volume Table 6B measures with well-specified value sets and existing CQL libraries. Scope creep is the enemy of a working v0.
        </p>
        <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">CMS ID</th>
                <th className="px-4 py-3 text-left">Measure</th>
                <th className="px-4 py-3 text-left">UDS Table</th>
                <th className="px-4 py-3 text-left">Why It Matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {UDS_MEASURES.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.table}</td>
                  <td className="px-4 py-3 text-gray-600">{m.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Equity Audit Harness */}
      <section>
        <SectionLabel>Pilot 1 — Methodology Credibility</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Trust is the product — especially for safety-net populations
        </h2>
        <p className="text-gray-600 mb-6">
          For mixed-status families, trust is non-negotiable. The equity audit harness is how we prove — with reproducible data — that our AI models don&apos;t perform worse for the patients who need them most.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <FeatureCard
            icon="🔄"
            title="5 Patient Variants"
            body="English standard, Spanish standard, Spanish code-switching, low-literacy English, low-literacy Spanish — each tested against every model version."
          />
          <FeatureCard
            icon="📋"
            title="4 Clinical Scenarios"
            body="Diabetes + hypertension, preventive care gaps, pediatric immunization, complex multimorbidity — covering the highest-volume FQHC case types."
          />
          <FeatureCard
            icon="🔒"
            title="SHA-256 Reproducibility"
            body="Every harness run produces a provenance block with input bundle hashes, model version, node version, and git SHA — so results can be independently verified."
          />
          <FeatureCard
            icon="⚠️"
            title="Equity Flag System"
            body="Automatically detects word-count disparity (>30% shorter for non-English), language mismatch, reading level violations, and latency disparities across variants."
          />
        </div>
      </section>

      {/* Technology */}
      <section>
        <SectionLabel>Technology</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Stack decisions we won&apos;t revisit</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {STACK_ITEMS.map(item => (
            <div key={item.layer} className="flex gap-3 rounded-lg bg-white ring-1 ring-gray-200 p-4">
              <div className="text-lg shrink-0">{item.icon}</div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.layer}</p>
                <p className="text-sm font-medium text-gray-900">{item.choice}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.rationale}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Go/Kill Gates */}
      <section>
        <SectionLabel>12-Month Roadmap</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Go/Kill gates at every phase</h2>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {ROADMAP_GATES.map((gate, i) => (
              <div key={i} className="relative flex gap-5 pl-14">
                <div className="absolute left-3.5 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold ring-4 ring-white">
                  {i + 1}
                </div>
                <div className="flex-1 rounded-xl bg-white ring-1 ring-gray-200 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{gate.phase}</span>
                      <h3 className="font-semibold text-gray-900">{gate.title}</h3>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">{gate.months}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{gate.deliverable}</p>
                  <div className="rounded-lg bg-green-50 ring-1 ring-green-200 px-3 py-1.5">
                    <p className="text-xs font-semibold text-green-800">Go Gate:</p>
                    <p className="text-xs text-green-700">{gate.goGate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Budget */}
      <section>
        <SectionLabel>Investment</SectionLabel>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Under $1k/month LLM cost. Under $85k total cash.</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <BudgetCard pilot="Pilot 1" cash="~$0" eng="120 hrs" clinical="80 hrs" llm="$500/mo" color="purple" />
          <BudgetCard pilot="Pilot 2" cash="$15–25k" eng="280 hrs" clinical="60 hrs" llm="$100/mo" color="blue" />
          <BudgetCard pilot="Pilot 3" cash="$40–60k" eng="320 hrs" clinical="120 hrs" llm="$200/mo" color="green" />
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          Total LLM budget across all three pilots: under $1,000/month. Hosting on Vercel Pro + Fly.io.
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-blue-600 text-white p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to see the quality portal?</h2>
        <p className="text-blue-200 mb-6">
          Live demo with realistic FQHC data — 6 UDS measures, patient gap list, AI narrative generation.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-white text-blue-700 font-semibold px-6 py-3 hover:bg-blue-50 transition-colors"
        >
          Access Demo Portal →
        </a>
        <p className="text-blue-300 text-xs mt-4">Password: <code className="bg-blue-500 px-1.5 py-0.5 rounded">gigidemo</code></p>
      </section>
    </div>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────

const UDS_MEASURES = [
  { id: 'CMS122', name: 'Diabetes: HbA1c Poor Control (>9%)', table: 'Table 7', why: 'Highest-volume chronic condition at FQHCs; poor glycemic control drives downstream costs' },
  { id: 'CMS165', name: 'Hypertension Control (<140/90)', table: 'Table 7', why: 'Affects majority of adult FQHC patients; measurable through recent BP readings' },
  { id: 'CMS124', name: 'Cervical Cancer Screening', table: 'Table 6B', why: '3-year or 5-year screening window; high documentation gap rate' },
  { id: 'CMS2', name: 'Depression Screening + Follow-Up Plan', table: 'Table 6B', why: 'PHQ-9 widely used but follow-up documentation is the gap; now NCQA-required' },
  { id: 'CMS138', name: 'Tobacco Use Screening + Cessation Intervention', table: 'Table 6B', why: 'Screening rate high; cessation counseling documentation is the gap' },
  { id: 'CMS117', name: 'Childhood Immunization Status', table: 'Table 6B', why: 'By age 2 benchmark; complex multi-vaccine schedule; safety-net populations under-vaccinated' },
];

const STACK_ITEMS = [
  { layer: 'FHIR Server', choice: 'Medplum (self-hosted)', rationale: 'OAuth2 client-credentials, R4 conformant, open source. HAPI FHIR fallback.', icon: '🏗️' },
  { layer: 'Frontend', choice: 'Next.js 15 + Tailwind + Radix UI', rationale: 'Same stack as fhirbuilders.com; AI-friendly for Claude Code; App Router for RSC.', icon: '⚛️' },
  { layer: 'LLM (Runtime)', choice: 'Claude Sonnet 4.6 + Groq fallback', rationale: 'BAA available. Multilingual quality highest among frontier models. Groq as free-tier fallback.', icon: '🤖' },
  { layer: 'Auth (Pilot 3)', choice: 'SMART App Launch v2.0, EHR-launched', rationale: 'Bypasses patient identity proofing wall on day one. Provider-mediated launch.', icon: '🔐' },
  { layer: 'Hosting', choice: 'Vercel (frontend) + Fly.io (backend)', rationale: 'Existing accounts. Fast deploys. HIPAA-eligible options. BAAs available.', icon: '☁️' },
  { layer: 'CQL Execution', choice: 'SQL-on-FHIR ViewDefinitions', rationale: 'CQL→SQL converter bridges existing Parker libraries to analytical warehouse. More performant than Java engine.', icon: '📐' },
];

const ROADMAP_GATES = [
  {
    phase: 'Phase 1',
    title: 'Equity Audit Harness',
    months: 'Months 0–3',
    deliverable: 'Open-source repo + preprint submission to JAMIA or NEJM AI. Includes synthetic FHIR bundle generator, vendor-agnostic test runner, and equity scoring rubric.',
    goGate: 'Preprint submitted by Month 3 with 3+ named clinical AI researchers as endorsers/co-authors (Brendan Keeler, Josh Mandel, Mark Scrimshire pipeline).',
  },
  {
    phase: 'Phase 2',
    title: 'FQHC Quality Measure Agent',
    months: 'Months 2–7',
    deliverable: 'Production v0 with one signed FQHC design partner. 6 UDS measures executing on real data. Quality portal UI with gap action lists and AI narrative generation.',
    goGate: 'Design partner runs ≥1 UDS measure end-to-end on real patient data, reports measurable time savings, provides quotable written statement for CHCF funder materials.',
  },
  {
    phase: 'Phase 3',
    title: 'Bilingual Visit-Prep Agent',
    months: 'Months 6–12',
    deliverable: '90-day clinic pilot, 40 patients (stepped wedge), SMART on FHIR EHR-launched. Bilingual briefs (English + Spanish). Single primary outcome metric.',
    goGate: 'Statistically meaningful signal on pre-visit agenda quality (clinician-rated 1–5) OR no-show rate. 5–10 qualitative patient interviews confirming usability in preferred language.',
  },
];

// ─── UI Components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">{children}</p>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: 'red' | 'amber' | 'blue' }) {
  const colors = {
    red: 'text-red-700 bg-red-50 ring-red-200',
    amber: 'text-amber-700 bg-amber-50 ring-amber-200',
    blue: 'text-blue-700 bg-blue-50 ring-blue-200',
  };
  return (
    <div className={`rounded-xl p-5 ring-1 ${colors[color]}`}>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className="text-sm leading-snug opacity-80">{label}</p>
    </div>
  );
}

function JTBDCard({
  pilot, phase, color, who, job, outcome, investment, icon,
}: {
  pilot: string; phase: string; color: 'purple' | 'blue' | 'green';
  who: string; job: string; outcome: string; investment: string; icon: string;
}) {
  const colors = {
    purple: { ring: 'ring-purple-200', badge: 'bg-purple-100 text-purple-800', header: 'bg-purple-50' },
    blue: { ring: 'ring-blue-200', badge: 'bg-blue-100 text-blue-800', header: 'bg-blue-50' },
    green: { ring: 'ring-green-200', badge: 'bg-green-100 text-green-800', header: 'bg-green-50' },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl bg-white ring-1 ${c.ring} overflow-hidden`}>
      <div className={`flex items-center gap-3 px-5 py-3 ${c.header}`}>
        <span className="text-2xl">{icon}</span>
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{pilot}</span>
          <span className="ml-2 text-xs text-gray-500">{phase}</span>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Customer</p>
          <p className="text-sm font-semibold text-gray-900" dangerouslySetInnerHTML={{ __html: who }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Job to Be Done</p>
          <p className="text-sm text-gray-700 leading-relaxed">{job}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Success Metric</p>
          <p className="text-sm text-gray-700 leading-relaxed">{outcome}</p>
        </div>
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400">{investment}</p>
        </div>
      </div>
    </div>
  );
}

function ReasonCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4">
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

function MarketCard({ segment, description, tags }: { segment: string; description: string; tags: string[] }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-5">
      <p className="font-bold text-gray-900 mb-2">{segment}</p>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="text-xs rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 ring-1 ring-blue-200">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function TailwindCard({ deadline, rule, impact, urgency }: {
  deadline: string; rule: string; impact: string; urgency: 'hot' | 'active' | 'upcoming';
}) {
  const styles = {
    hot: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-200', label: 'Time-Critical' },
    active: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 ring-green-200', label: 'Active Now' },
    upcoming: { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 ring-amber-200', label: 'Upcoming' },
  };
  const s = styles[urgency];
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot} mt-0.5`} />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{deadline}</p>
        </div>
        <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 ring-1 font-medium ${s.badge}`}>{s.label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1">{rule}</p>
      <p className="text-sm text-gray-600">{impact}</p>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 p-4 flex gap-3">
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function BudgetCard({ pilot, cash, eng, clinical, llm, color }: {
  pilot: string; cash: string; eng: string; clinical: string; llm: string;
  color: 'purple' | 'blue' | 'green';
}) {
  const colors = {
    purple: 'bg-purple-50 ring-purple-200 text-purple-800',
    blue: 'bg-blue-50 ring-blue-200 text-blue-800',
    green: 'bg-green-50 ring-green-200 text-green-800',
  };
  return (
    <div className={`rounded-xl ring-1 p-5 ${colors[color]}`}>
      <p className="font-bold mb-3">{pilot}</p>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="opacity-70">Cash</dt>
          <dd className="font-semibold">{cash}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="opacity-70">Engineering</dt>
          <dd className="font-semibold">{eng}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="opacity-70">Clinical</dt>
          <dd className="font-semibold">{clinical}</dd>
        </div>
        <div className="flex justify-between border-t border-current/20 pt-1.5">
          <dt className="opacity-70">LLM Cost</dt>
          <dd className="font-semibold">{llm}</dd>
        </div>
      </dl>
    </div>
  );
}
