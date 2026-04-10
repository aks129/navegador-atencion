'use client';

import type { MeasureScore, MeasureDefinition } from '@plumly/cql-measures';
import { cn, formatPercent } from '@/lib/utils';

interface MeasureTileProps {
  score: MeasureScore;
  definition: MeasureDefinition;
}

const LEVEL_STYLES = {
  high: {
    ring: 'ring-green-300',
    badge: 'bg-green-100 text-green-800',
    bar: 'bg-green-500',
    label: 'On Track',
  },
  medium: {
    ring: 'ring-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-400',
    label: 'Needs Improvement',
  },
  low: {
    ring: 'ring-red-300',
    badge: 'bg-red-100 text-red-800',
    bar: 'bg-red-500',
    label: 'Priority Action',
  },
} as const;

const TREND_ICONS = {
  up: { symbol: '↑', color: 'text-green-600' },
  down: { symbol: '↓', color: 'text-red-600' },
  stable: { symbol: '→', color: 'text-gray-400' },
} as const;

/** Simple SVG sparkline from 12-month history */
function Sparkline({ data, higherIsBetter }: { data: { rate: number }[]; higherIsBetter: boolean }) {
  if (data.length < 2) return null;
  const rates = data.map(d => d.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 1;
  const W = 80;
  const H = 28;
  const pts = rates.map((r, i) => {
    const x = (i / (rates.length - 1)) * W;
    const y = H - ((r - min) / range) * H;
    return `${x},${y}`;
  });
  const lastBetter =
    higherIsBetter
      ? rates[rates.length - 1] > rates[0]
      : rates[rates.length - 1] < rates[0];
  const color = lastBetter ? '#16a34a' : '#dc2626';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pts[pts.length - 1].split(',')[0]}
        cy={pts[pts.length - 1].split(',')[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

export function MeasureTile({ score, definition }: MeasureTileProps) {
  const styles = LEVEL_STYLES[score.performanceLevel];
  const trend = TREND_ICONS[score.trend];
  const targetGap = definition.target - score.rate;
  const barWidth = Math.min(100, Math.max(0, score.rate));

  return (
    <div
      className={cn(
        'rounded-xl bg-white p-5 ring-1 shadow-sm flex flex-col gap-3',
        styles.ring,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
            {definition.cmsId}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
            {definition.shortName}
          </h3>
        </div>
        <span className={cn('shrink-0 text-xs font-medium rounded-full px-2 py-0.5', styles.badge)}>
          {styles.label}
        </span>
      </div>

      {/* Rate + trend */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 leading-none">
            {formatPercent(score.rate)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {score.numerator.toLocaleString()} / {score.denominator.toLocaleString()} patients
          </p>
        </div>
        <div className="text-right">
          <p className={cn('text-lg font-semibold', trend.color)}>
            {trend.symbol} {Math.abs(score.trendDelta).toFixed(1)}%
          </p>
          <Sparkline data={score.history} higherIsBetter={definition.higherIsBetter} />
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Current: {formatPercent(score.rate)}</span>
          <span>Target: {formatPercent(definition.target)}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', styles.bar)}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        {targetGap > 0 && definition.higherIsBetter && (
          <p className="text-xs text-gray-400 mt-1">
            {targetGap.toFixed(1)}% below target
          </p>
        )}
        {targetGap < 0 && !definition.higherIsBetter && (
          <p className="text-xs text-gray-400 mt-1">
            {Math.abs(targetGap).toFixed(1)}% above target (reduce to meet goal)
          </p>
        )}
      </div>

      {/* National avg comparison */}
      {definition.nationalAverage !== undefined && (
        <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
          HRSA national avg: {formatPercent(definition.nationalAverage)}
          {score.rate > definition.nationalAverage && definition.higherIsBetter && (
            <span className="text-green-600 font-medium"> · Above average</span>
          )}
          {score.rate < definition.nationalAverage && definition.higherIsBetter && (
            <span className="text-amber-600 font-medium"> · Below average</span>
          )}
          {score.rate < definition.nationalAverage && !definition.higherIsBetter && (
            <span className="text-green-600 font-medium"> · Better than average</span>
          )}
          {score.rate > definition.nationalAverage && !definition.higherIsBetter && (
            <span className="text-red-600 font-medium"> · Worse than average</span>
          )}
        </p>
      )}
    </div>
  );
}
