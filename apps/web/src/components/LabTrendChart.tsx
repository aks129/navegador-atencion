'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts'
// Using native Date methods to avoid external dependencies
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProcessedLabValue } from '@plumly/fhir-utils'

interface LabTrendChartProps {
  code: string
  label: string
  labValues: ProcessedLabValue[]
  onPointClick?: (resourceRef: string) => void
  className?: string
}

interface ChartDataPoint {
  date: string
  value: number
  rawValue: number
  unit: string
  isAbnormal: boolean
  resourceRef: string
  formattedDate: string
  normalizedValue?: number
  referenceRange?: {
    low?: number
    high?: number
  }
}

// Helper function to determine if a value is out of range
export function isValueOutOfRange(
  value: number,
  referenceRange?: { low?: number; high?: number }
): boolean {
  if (!referenceRange) return false

  const { low, high } = referenceRange
  if (low !== undefined && value < low) return true
  if (high !== undefined && value > high) return true

  return false
}

// Helper function to extract numeric value from various formats
export function extractNumericValue(value: string | number): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove common prefixes and suffixes, extract number (handles leading decimal like .5)
    const numMatch = value.match(/-?(?:\d+\.?\d*|\.\d+)/);
    return numMatch ? parseFloat(numMatch[0]) : null
  }
  return null
}

export function LabTrendChart({
  code,
  label,
  labValues,
  onPointClick,
  className = ''
}: LabTrendChartProps) {
  // Filter and process lab values for the specific LOINC code
  const chartData = useMemo(() => {
    return labValues
      .filter(lab => lab.loincCode === code)
      .map(lab => {
        const numericValue = extractNumericValue(lab.normalizedValue ?? lab.value)
        const rawNumericValue = extractNumericValue(lab.value)

        if (numericValue === null || rawNumericValue === null) {
          return null
        }

        return {
          date: lab.date,
          value: numericValue,
          rawValue: rawNumericValue,
          unit: lab.normalizedUnit || lab.unit || '',
          isAbnormal: lab.isAbnormal,
          resourceRef: `Observation/${lab.source?.id || 'unknown'}`,
          formattedDate: new Date(lab.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          normalizedValue: lab.normalizedValue,
          referenceRange: lab.referenceRange
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [labValues, code])

  // Calculate reference range for shading
  const referenceInfo = useMemo(() => {
    const ranges = chartData
      .map(point => point.referenceRange)
      .filter(range => range && (range.low !== undefined || range.high !== undefined))

    if (ranges.length === 0) return null

    // Use the most common reference range
    const range = ranges[0]
    return {
      low: range?.low,
      high: range?.high,
      unit: chartData[0]?.unit || ''
    }
  }, [chartData])

  // Calculate chart domain
  const valueDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100]

    const values = chartData.map(point => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Add 10% padding to make the chart more readable
    const padding = (max - min) * 0.1
    const domainMin = Math.max(0, min - padding)
    const domainMax = max + padding

    // If we have reference range, extend domain to include it
    if (referenceInfo) {
      const refMin = referenceInfo.low || domainMin
      const refMax = referenceInfo.high || domainMax
      return [
        Math.min(domainMin, refMin - padding),
        Math.max(domainMax, refMax + padding)
      ]
    }

    return [domainMin, domainMax]
  }, [chartData, referenceInfo])

  const handlePointClick = (data: any) => {
    if (onPointClick && data.payload) {
      onPointClick(data.payload.resourceRef)
    }
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {label}
            <Badge variant="outline">{code}</Badge>
          </CardTitle>
          <CardDescription>No trend data available for this lab value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No data points found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {label} Trend
          <Badge variant="outline">{code}</Badge>
        </CardTitle>
        <CardDescription>
          {chartData.length} measurements over time
          {referenceInfo && (
            <>
              {' • '}
              Normal range: {referenceInfo.low || 'N/A'} - {referenceInfo.high || 'N/A'} {referenceInfo.unit}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />

              <YAxis
                domain={valueDomain}
                tick={{ fontSize: 12 }}
                label={{
                  value: chartData[0]?.unit || 'Value',
                  angle: -90,
                  position: 'insideLeft'
                }}
              />

              {/* Reference range shading */}
              {referenceInfo && referenceInfo.low !== undefined && referenceInfo.high !== undefined && (
                <ReferenceArea
                  y1={referenceInfo.low}
                  y2={referenceInfo.high}
                  fill="#10b981"
                  fillOpacity={0.1}
                  stroke="none"
                />
              )}

              {/* Reference lines */}
              {referenceInfo?.low !== undefined && (
                <ReferenceLine
                  y={referenceInfo.low}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  label="Low Normal"
                />
              )}

              {referenceInfo?.high !== undefined && (
                <ReferenceLine
                  y={referenceInfo.high}
                  stroke="#10b981"
                  strokeDasharray="2 2"
                  label="High Normal"
                />
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const data = payload[0].payload as ChartDataPoint
                  const isOutOfRange = isValueOutOfRange(data.value, data.referenceRange)

                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-lg">
                        {data.rawValue} {data.unit}
                        {data.normalizedValue !== data.rawValue && data.normalizedValue && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({data.value} normalized)
                          </span>
                        )}
                      </p>
                      {isOutOfRange && (
                        <Badge variant="destructive" className="mt-1">
                          Out of range
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Click to find in summary
                      </p>
                    </div>
                  )
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  const isOutOfRange = isValueOutOfRange(payload.value, payload.referenceRange)

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={isOutOfRange ? '#ef4444' : '#3b82f6'}
                      stroke={isOutOfRange ? '#dc2626' : '#2563eb'}
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handlePointClick({ payload })}
                    />
                  )
                }}
                activeDot={{
                  r: 8,
                  fill: '#1d4ed8',
                  stroke: '#1e40af',
                  strokeWidth: 2,
                  style: { cursor: 'pointer' }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Normal values</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Out of range</span>
          </div>
          {referenceInfo && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-400"></div>
              <span>Normal range</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}