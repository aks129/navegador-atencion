'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar, Pill } from 'lucide-react'
import type { ProcessedMedication } from '@plumly/fhir-utils'

interface MedicationTimelineProps {
  medications: ProcessedMedication[]
  onMedicationClick?: (resourceRef: string) => void
  className?: string
}

interface TimelineSegment {
  medicationId: string
  name: string
  rxNormCode?: string
  startDate: Date
  endDate: Date | null // null means ongoing
  status: 'active' | 'completed' | 'stopped' | 'on-hold'
  dosage?: string
  resourceRef: string
  hasOverlap?: boolean
  overlapWith?: string[]
}

interface TimelineData {
  date: string
  timestamp: number
  medications: {
    [medicationId: string]: {
      name: string
      status: 'active' | 'completed' | 'stopped' | 'on-hold' | 'started' | 'changed'
      dosage?: string
      resourceRef: string
      rxNormCode?: string
    }
  }
}

// Helper function to detect medication overlaps
export function detectMedicationOverlaps(segments: TimelineSegment[]): TimelineSegment[] {
  const result = [...segments]

  for (let i = 0; i < result.length; i++) {
    const segment1 = result[i]
    const overlaps: string[] = []

    for (let j = i + 1; j < result.length; j++) {
      const segment2 = result[j]

      // Skip if different RxNorm codes (different medications)
      if (segment1.rxNormCode !== segment2.rxNormCode) continue

      // Check for temporal overlap
      const start1 = segment1.startDate.getTime()
      const end1 = segment1.endDate?.getTime() || Date.now()
      const start2 = segment2.startDate.getTime()
      const end2 = segment2.endDate?.getTime() || Date.now()

      const hasOverlap = start1 <= end2 && start2 <= end1

      if (hasOverlap) {
        overlaps.push(segment2.medicationId)
        result[j].hasOverlap = true
        if (!result[j].overlapWith) result[j].overlapWith = []
        result[j].overlapWith!.push(segment1.medicationId)
      }
    }

    if (overlaps.length > 0) {
      result[i].hasOverlap = true
      result[i].overlapWith = overlaps
    }
  }

  return result
}

// Helper function to segment medications into timeline periods
export function segmentMedicationTimeline(medications: ProcessedMedication[]): TimelineSegment[] {
  const segments: TimelineSegment[] = []

  medications.forEach(med => {
    // Parse dates
    const startDate = med.authoredDate ? new Date(med.authoredDate) : new Date()

    // For end date, we need to infer from status and other clues
    let endDate: Date | null = null
    if (med.status === 'completed' || med.status === 'stopped') {
      // If we don't have explicit end date, estimate based on dosage duration
      // This is a simplification - in real apps you'd parse dosage instructions
      endDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days default
    }

    segments.push({
      medicationId: med.source?.id || `med-${Math.random()}`,
      name: med.name,
      rxNormCode: (med as any).rxNormCode || 'unknown',
      startDate,
      endDate,
      status: med.status as any,
      dosage: med.dosage,
      resourceRef: `MedicationRequest/${med.source?.id || 'unknown'}`
    })
  })

  return detectMedicationOverlaps(segments)
}

export function MedicationTimeline({
  medications,
  onMedicationClick,
  className = ''
}: MedicationTimelineProps) {
  // Process medications into timeline segments
  const timelineSegments = useMemo(() => {
    return segmentMedicationTimeline(medications)
  }, [medications])

  // Create timeline data for visualization
  const timelineData = useMemo<TimelineData[]>(() => {
    const allDates = new Set<string>()

    // Collect all significant dates
    timelineSegments.forEach(segment => {
      allDates.add(segment.startDate.toISOString().split('T')[0])
      if (segment.endDate) {
        allDates.add(segment.endDate.toISOString().split('T')[0])
      }
    })

    // Add current date if any medications are ongoing
    const hasOngoing = timelineSegments.some(seg => !seg.endDate)
    if (hasOngoing) {
      allDates.add(new Date().toISOString().split('T')[0])
    }

    const sortedDates = Array.from(allDates).sort()

    return sortedDates.map(dateStr => {
      const date = new Date(dateStr)
      const medications: TimelineData['medications'] = {}

      timelineSegments.forEach(segment => {
        const isInPeriod = date >= segment.startDate &&
          (!segment.endDate || date <= segment.endDate)

        if (isInPeriod) {
          let status = segment.status

          // Mark special events
          if (dateStr === segment.startDate.toISOString().split('T')[0]) {
            status = 'active'
          } else if (segment.endDate &&
                    dateStr === segment.endDate.toISOString().split('T')[0]) {
            status = segment.status === 'active' ? 'stopped' : segment.status
          }

          medications[segment.medicationId] = {
            name: segment.name,
            status,
            dosage: segment.dosage,
            resourceRef: segment.resourceRef,
            rxNormCode: segment.rxNormCode
          }
        }
      })

      return {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        timestamp: date.getTime(),
        medications
      }
    }).filter(entry => Object.keys(entry.medications).length > 0)
  }, [timelineSegments])

  // Get unique medications for the chart
  const uniqueMedications = useMemo(() => {
    const meds = new Map<string, { name: string; rxNormCode?: string; hasOverlap: boolean }>()

    timelineSegments.forEach(segment => {
      meds.set(segment.medicationId, {
        name: segment.name,
        rxNormCode: segment.rxNormCode,
        hasOverlap: segment.hasOverlap || false
      })
    })

    return Array.from(meds.entries()).map(([id, info]) => ({ id, ...info }))
  }, [timelineSegments])

  // Color scheme for different medication statuses
  const statusColors = {
    active: '#10b981',
    started: '#3b82f6',
    stopped: '#ef4444',
    completed: '#6b7280',
    changed: '#f59e0b',
    'on-hold': '#8b5cf6'
  }

  const handleBarClick = (data: any) => {
    if (onMedicationClick && data.payload) {
      // Find the most relevant medication in this time period
      const medications = Object.values(data.payload.medications)
      if (medications.length > 0) {
        onMedicationClick((medications[0] as any).resourceRef)
      }
    }
  }

  if (medications.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medication Timeline
          </CardTitle>
          <CardDescription>No medication data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No medication records found
          </div>
        </CardContent>
      </Card>
    )
  }

  // Count overlapping medications for warnings
  const overlapCount = timelineSegments.filter(seg => seg.hasOverlap).length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medication Timeline
          {overlapCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overlapCount} overlaps
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {uniqueMedications.length} medications across {timelineData.length} time periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overlap warnings */}
        {overlapCount > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Medication Overlap Warnings
            </div>
            <div className="mt-2 space-y-1">
              {timelineSegments
                .filter(seg => seg.hasOverlap)
                .map(seg => (
                  <div key={seg.medicationId} className="text-sm text-red-700">
                    <strong>{seg.name}</strong> overlaps with other medications
                    {seg.rxNormCode && (
                      <span className="text-red-600 ml-2">RxNorm: {seg.rxNormCode}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timelineData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Active Medications',
                  angle: -90,
                  position: 'insideLeft'
                }}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const data = payload[0].payload as TimelineData
                  const medications = Object.values(data.medications)

                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg max-w-sm">
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {label}
                      </p>
                      <div className="mt-2 space-y-1">
                        {medications.map((med: any, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: statusColors[med.status as keyof typeof statusColors] }}
                              />
                              <span className="font-medium">{med.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {med.status}
                              </Badge>
                            </div>
                            {med.dosage && (
                              <p className="text-xs text-gray-500 ml-5">{med.dosage}</p>
                            )}
                            {med.rxNormCode && (
                              <p className="text-xs text-gray-400 ml-5">RxNorm: {med.rxNormCode}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click to find in summary
                      </p>
                    </div>
                  )
                }}
              />

              <Bar
                dataKey={(entry) => Object.keys(entry.medications).length}
                fill="#3b82f6"
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                {timelineData.map((entry, index) => {
                  const hasOverlapInPeriod = Object.values(entry.medications).some((med: any) =>
                    timelineSegments.find(seg =>
                      seg.resourceRef === med.resourceRef && seg.hasOverlap
                    )
                  )

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={hasOverlapInPeriod ? '#ef4444' : '#3b82f6'}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500"></div>
            <span>Normal periods</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>Overlap periods</span>
          </div>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>

        {/* Medication List */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Medications in Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {uniqueMedications.map(med => (
              <div key={med.id} className={`p-3 border rounded-lg ${med.hasOverlap ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{med.name}</span>
                  {med.hasOverlap && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overlap
                    </Badge>
                  )}
                </div>
                {med.rxNormCode && (
                  <p className="text-xs text-gray-500 mt-1">RxNorm: {med.rxNormCode}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}