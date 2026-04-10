'use client';

import { useState } from 'react';
import type { MeasureScore, MeasureDefinition, GapPatient } from '@plumly/cql-measures';
import { MeasureTile } from './MeasureTile';
import { GapsPanel } from './GapsPanel';
import { ReportsPanel } from './ReportsPanel';
import { cn } from '@/lib/utils';

interface DashboardTabsProps {
  scores: MeasureScore[];
  definitions: MeasureDefinition[];
  gapPatients: GapPatient[];
  facilityName: string;
  reportingPeriod: { start: string; end: string };
  totalPatients: number;
}

type TabId = 'measures' | 'gaps' | 'reports';

const TABS: { id: TabId; label: string; count?: (props: DashboardTabsProps) => number | string }[] = [
  {
    id: 'measures',
    label: 'Measures',
    count: props => props.scores.length,
  },
  {
    id: 'gaps',
    label: 'Gaps',
    count: props => props.gapPatients.length,
  },
  {
    id: 'reports',
    label: 'Reports & Narrative',
  },
];

export function DashboardTabs(props: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('measures');
  const { scores, definitions, gapPatients, facilityName, reportingPeriod, totalPatients } = props;

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" aria-label="Quality dashboard tabs">
          {TABS.map(tab => {
            const count = tab.count?.(props);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                )}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
                {count !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab panels */}
      {activeTab === 'measures' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {scores.map(score => {
            const def = definitions.find(d => d.id === score.measureId);
            if (!def) return null;
            return <MeasureTile key={score.measureId} score={score} definition={def} />;
          })}
        </div>
      )}

      {activeTab === 'gaps' && <GapsPanel patients={gapPatients} />}

      {activeTab === 'reports' && (
        <ReportsPanel
          scores={scores}
          facilityName={facilityName}
          reportingPeriod={reportingPeriod}
          totalPatients={totalPatients}
        />
      )}
    </div>
  );
}
