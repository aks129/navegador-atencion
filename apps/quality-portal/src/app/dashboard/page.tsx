import { DEMO_REPORT, DEMO_GAP_PATIENTS, MEASURE_DEFINITIONS } from '@plumly/cql-measures';
import { DashboardTabs } from '@/components/DashboardTabs';
import { formatPercent } from '@/lib/utils';

export default function DashboardPage() {
  const { scores, facilityName, reportingPeriod, totalPatients } = DEMO_REPORT;

  // Compute summary stats
  const highCount = scores.filter(s => s.performanceLevel === 'high').length;
  const medCount = scores.filter(s => s.performanceLevel === 'medium').length;
  const lowCount = scores.filter(s => s.performanceLevel === 'low').length;
  const totalGapPatients = DEMO_GAP_PATIENTS.length;
  const avgRate = scores.reduce((sum, s) => sum + s.rate, 0) / scores.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">UDS Quality Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Reporting period: {new Date(reportingPeriod.start).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} –{' '}
          {new Date(reportingPeriod.end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Active Patients"
          value={totalPatients.toLocaleString()}
          sub="Total panel"
          color="blue"
        />
        <KpiCard
          label="Avg Quality Rate"
          value={formatPercent(avgRate)}
          sub={`${scores.length} measures`}
          color="gray"
        />
        <KpiCard
          label="On Track"
          value={String(highCount)}
          sub={`of ${scores.length} measures`}
          color="green"
        />
        <KpiCard
          label="Patients with Gaps"
          value={String(totalGapPatients)}
          sub="Need outreach"
          color="red"
        />
      </div>

      {/* Status summary badges */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-green-700 ring-1 ring-green-200 font-medium">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {highCount} On Track
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-200 font-medium">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {medCount} Needs Improvement
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-700 ring-1 ring-red-200 font-medium">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {lowCount} Priority Action
        </span>
      </div>

      {/* 3-tab dashboard */}
      <DashboardTabs
        scores={scores}
        definitions={Object.values(MEASURE_DEFINITIONS)}
        gapPatients={DEMO_GAP_PATIENTS}
        facilityName={facilityName}
        reportingPeriod={reportingPeriod}
        totalPatients={totalPatients}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'green' | 'red' | 'gray';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-gray-50 text-gray-700',
  };
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-sm p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
