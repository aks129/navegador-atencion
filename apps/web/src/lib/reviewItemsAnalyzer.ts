import type { ResourceSelectionResult, ProcessedLabValue, ProcessedMedication, ProcessedCondition } from '@plumly/fhir-utils'

export interface ReviewItem {
  id: string
  type: 'lab-abnormal' | 'lab-delta' | 'med-interaction' | 'med-adherence' | 'care-gap'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  details: string
  resourceRef?: string
  chartLink?: {
    tab: 'labs' | 'lab-trends' | 'medications' | 'med-timeline' | 'conditions'
    code?: string
    medicationId?: string
  }
  actionRequired: boolean
  dateIdentified: string
}

export interface CareGapRule {
  id: string
  name: string
  description: string
  applies: (patient: any) => boolean
  checkGap: (selection: ResourceSelectionResult) => boolean
  recommendation: string
}

// Care gap screening rules based on clinical guidelines
export const CARE_GAP_RULES: CareGapRule[] = [
  {
    id: 'mammography-screening',
    name: 'Mammography Screening',
    description: 'Annual mammography for women 50-74',
    applies: (patient) => {
      const age = calculateAge(patient.birthDate)
      return patient.gender === 'female' && age >= 50 && age <= 74
    },
    checkGap: (selection) => {
      const mammograms = selection.labValues.filter(lab =>
        lab.loincCode === '24606-6' || // Mammography study
        lab.display.toLowerCase().includes('mammogram') ||
        lab.display.toLowerCase().includes('mammography')
      )
      if (mammograms.length === 0) return true

      // Check if most recent is within 2 years
      const mostRecent = mammograms.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
      const daysSinceLastMammogram = (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastMammogram > 730 // 2 years
    },
    recommendation: 'Schedule annual mammography screening'
  },
  {
    id: 'colonoscopy-screening',
    name: 'Colorectal Cancer Screening',
    description: 'Colonoscopy every 10 years for adults 45-75',
    applies: (patient) => {
      const age = calculateAge(patient.birthDate)
      return age >= 45 && age <= 75
    },
    checkGap: (selection) => {
      const colonoscopies = selection.labValues.filter(lab =>
        lab.loincCode === '33747-0' || // Colonoscopy study
        lab.display.toLowerCase().includes('colonoscopy')
      )
      if (colonoscopies.length === 0) return true

      const mostRecent = colonoscopies.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
      const daysSinceLastColonoscopy = (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastColonoscopy > 3650 // 10 years
    },
    recommendation: 'Schedule colonoscopy screening'
  },
  {
    id: 'hba1c-diabetic',
    name: 'HbA1c Monitoring for Diabetes',
    description: 'HbA1c every 3-6 months for diabetic patients',
    applies: (patient) => true, // Will check conditions in checkGap
    checkGap: (selection) => {
      // Check if patient has diabetes
      const hasDiabetes = selection.conditions.some(condition =>
        condition.name.toLowerCase().includes('diabetes') &&
        condition.isActive
      )
      if (!hasDiabetes) return false

      const hba1cTests = selection.labValues.filter(lab =>
        lab.loincCode === '4548-4' // HbA1c
      )
      if (hba1cTests.length === 0) return true

      const mostRecent = hba1cTests.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
      const daysSinceLastHbA1c = (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastHbA1c > 180 // 6 months
    },
    recommendation: 'Order HbA1c test for diabetes monitoring'
  },
  {
    id: 'lipid-screening',
    name: 'Lipid Panel Screening',
    description: 'Lipid panel every 5 years for adults 40+',
    applies: (patient) => {
      const age = calculateAge(patient.birthDate)
      return age >= 40
    },
    checkGap: (selection) => {
      const lipidTests = selection.labValues.filter(lab =>
        lab.loincCode === '2093-3' || // Total cholesterol
        lab.loincCode === '2085-9' || // HDL cholesterol
        lab.loincCode === '2089-1' || // LDL cholesterol
        lab.display.toLowerCase().includes('lipid') ||
        lab.display.toLowerCase().includes('cholesterol')
      )
      if (lipidTests.length === 0) return true

      const mostRecent = lipidTests.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]
      const daysSinceLastLipid = (Date.now() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastLipid > 1825 // 5 years
    },
    recommendation: 'Order lipid panel screening'
  }
]

// Known medication interactions (simplified set for demonstration)
export const MEDICATION_INTERACTIONS = [
  {
    rxNormCodes: ['1191', '1191'], // Aspirin + Aspirin (duplicate)
    severity: 'medium' as const,
    description: 'Duplicate aspirin therapy detected',
    action: 'Review dosing and consider consolidation'
  },
  {
    rxNormCodes: ['6809', '4821'], // Metformin + Insulin
    severity: 'low' as const,
    description: 'Metformin and insulin combination requires monitoring',
    action: 'Monitor blood glucose levels closely'
  },
  {
    rxNormCodes: ['29046', '1191'], // Lisinopril + Aspirin
    severity: 'medium' as const,
    description: 'ACE inhibitor and aspirin may increase bleeding risk',
    action: 'Monitor for signs of bleeding'
  }
]

// Helper function to calculate age from birth date
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Analyze lab values for abnormal results and significant deltas
export function analyzeLabs(labValues: ProcessedLabValue[]): ReviewItem[] {
  const items: ReviewItem[] = []

  // Group labs by LOINC code to detect trends
  const labsByCode = new Map<string, ProcessedLabValue[]>()
  labValues.forEach(lab => {
    if (!labsByCode.has(lab.loincCode)) {
      labsByCode.set(lab.loincCode, [])
    }
    labsByCode.get(lab.loincCode)!.push(lab)
  })

  labsByCode.forEach((labs, loincCode) => {
    // Sort by date
    labs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Check for abnormal values
    labs.forEach((lab, index) => {
      if (lab.isAbnormal && lab.referenceRange) {
        items.push({
          id: `lab-abnormal-${lab.source?.id || index}`,
          type: 'lab-abnormal',
          severity: 'medium',
          title: `Abnormal ${lab.display}`,
          description: `${lab.value} ${lab.unit} (Normal: ${lab.referenceRange.low || 'N/A'}-${lab.referenceRange.high || 'N/A'})`,
          details: `Lab result is outside normal reference range. Date: ${new Date(lab.date).toLocaleDateString()}`,
          resourceRef: `Observation/${lab.source?.id || 'unknown'}`,
          chartLink: {
            tab: 'lab-trends',
            code: lab.loincCode
          },
          actionRequired: true,
          dateIdentified: lab.date
        })
      }

      // Check for significant deltas (>30% change from previous)
      if (index > 0) {
        const prevLab = labs[index - 1]
        const currentValue = parseFloat(String(lab.normalizedValue || lab.value))
        const prevValue = parseFloat(String(prevLab.normalizedValue || prevLab.value))

        if (!isNaN(currentValue) && !isNaN(prevValue) && prevValue !== 0) {
          const percentChange = Math.abs((currentValue - prevValue) / prevValue) * 100

          if (percentChange > 30) {
            const direction = currentValue > prevValue ? 'increased' : 'decreased'
            items.push({
              id: `lab-delta-${lab.source?.id || index}`,
              type: 'lab-delta',
              severity: percentChange > 50 ? 'high' : 'medium',
              title: `Significant ${lab.display} Change`,
              description: `${direction} ${percentChange.toFixed(1)}% from ${prevValue} to ${currentValue} ${lab.unit}`,
              details: `Significant change from ${new Date(prevLab.date).toLocaleDateString()} to ${new Date(lab.date).toLocaleDateString()}`,
              resourceRef: `Observation/${lab.source?.id || 'unknown'}`,
              chartLink: {
                tab: 'lab-trends',
                code: lab.loincCode
              },
              actionRequired: percentChange > 50,
              dateIdentified: lab.date
            })
          }
        }
      }
    })
  })

  return items
}

// Analyze medications for interactions and adherence risks
export function analyzeMedications(medications: ProcessedMedication[]): ReviewItem[] {
  const items: ReviewItem[] = []

  // Check for medication interactions
  const activeMeds = medications.filter(med => med.isActive)

  for (let i = 0; i < activeMeds.length; i++) {
    for (let j = i + 1; j < activeMeds.length; j++) {
      const med1 = activeMeds[i]
      const med2 = activeMeds[j]

      // Check for known interactions
      const med1Code = (med1 as any).rxNormCode
      const med2Code = (med2 as any).rxNormCode

      if (!med1Code || !med2Code) continue

      const interaction = MEDICATION_INTERACTIONS.find(interaction =>
        (interaction.rxNormCodes.includes(med1Code) &&
         interaction.rxNormCodes.includes(med2Code))
      )

      if (interaction) {
        items.push({
          id: `med-interaction-${med1.source?.id}-${med2.source?.id}`,
          type: 'med-interaction',
          severity: interaction.severity,
          title: 'Medication Interaction',
          description: `${med1.name} + ${med2.name}: ${interaction.description}`,
          details: interaction.action,
          chartLink: {
            tab: 'med-timeline'
          },
          actionRequired: interaction.severity === 'medium',
          dateIdentified: new Date().toISOString()
        })
      }

      // Check for duplicate medications (same RxNorm code)
      if (med1Code && med2Code && med1Code === med2Code) {
        items.push({
          id: `med-duplicate-${med1.source?.id}-${med2.source?.id}`,
          type: 'med-interaction',
          severity: 'medium',
          title: 'Duplicate Medication',
          description: `Multiple prescriptions for ${med1.name}`,
          details: 'Review for potential duplicate therapy and consolidate if appropriate',
          chartLink: {
            tab: 'med-timeline'
          },
          actionRequired: true,
          dateIdentified: new Date().toISOString()
        })
      }
    }
  }

  // Check for adherence risks (gaps in medication)
  medications.forEach(med => {
    if (med.authoredDate) {
      const daysSinceOrdered = (Date.now() - new Date(med.authoredDate).getTime()) / (1000 * 60 * 60 * 24)

      // Flag medications ordered >90 days ago that are still active (potential adherence issue)
      if (med.isActive && daysSinceOrdered > 90) {
        items.push({
          id: `med-adherence-${med.source?.id}`,
          type: 'med-adherence',
          severity: 'low',
          title: 'Long-term Active Medication',
          description: `${med.name} active for ${Math.round(daysSinceOrdered)} days`,
          details: 'Review medication adherence and consider refill needs',
          resourceRef: `MedicationRequest/${med.source?.id || 'unknown'}`,
          chartLink: {
            tab: 'medications'
          },
          actionRequired: false,
          dateIdentified: new Date().toISOString()
        })
      }
    }
  })

  return items
}

// Analyze care gaps based on patient demographics and existing care
export function analyzeCareGaps(selection: ResourceSelectionResult): ReviewItem[] {
  const items: ReviewItem[] = []

  if (!selection.patient) return items

  CARE_GAP_RULES.forEach(rule => {
    if (rule.applies(selection.patient) && rule.checkGap(selection)) {
      items.push({
        id: `care-gap-${rule.id}`,
        type: 'care-gap',
        severity: 'medium',
        title: `Care Gap: ${rule.name}`,
        description: rule.description,
        details: rule.recommendation,
        chartLink: {
          tab: 'labs' // Default to labs tab for screening orders
        },
        actionRequired: true,
        dateIdentified: new Date().toISOString()
      })
    }
  })

  return items
}

// Main function to compute all review items
export function computeReviewItems(selection: ResourceSelectionResult): ReviewItem[] {
  if (!selection) return []

  const items: ReviewItem[] = []

  // Analyze different categories
  items.push(...analyzeLabs(selection.labValues))
  items.push(...analyzeMedications(selection.medications))
  items.push(...analyzeCareGaps(selection))

  // Sort by severity and date
  items.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return new Date(b.dateIdentified).getTime() - new Date(a.dateIdentified).getTime()
  })

  return items
}