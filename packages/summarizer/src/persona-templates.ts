// Persona-specific template definitions
import type { PersonaTemplate, SectionManifest } from './types';

// Common section manifests used across personas
export const SECTION_MANIFESTS = {
  // Overview sections
  PATIENT_OVERVIEW: {
    id: 'patient-overview',
    title: 'Health Summary',
    description: 'High-level overview of current health status',
    required: true,
    enabledByDefault: true,
    priority: 10
  } as SectionManifest,

  CLINICAL_OVERVIEW: {
    id: 'clinical-overview',
    title: 'Clinical Summary',
    description: 'Professional clinical assessment',
    required: true,
    enabledByDefault: true,
    priority: 10
  } as SectionManifest,

  CARE_OVERVIEW: {
    id: 'care-overview',
    title: 'Care Status',
    description: 'Current care needs and status',
    required: true,
    enabledByDefault: true,
    priority: 10
  } as SectionManifest,

  // Condition sections
  ACTIVE_CONDITIONS: {
    id: 'active-conditions',
    title: 'Your Health Conditions',
    description: 'Current health conditions in simple terms',
    required: false,
    enabledByDefault: true,
    priority: 8,
    conditions: { hasChronicConditions: true }
  } as SectionManifest,

  CLINICAL_CONDITIONS: {
    id: 'clinical-conditions',
    title: 'Active Diagnoses',
    description: 'Current diagnoses with clinical context',
    required: false,
    enabledByDefault: true,
    priority: 8,
    conditions: { hasChronicConditions: true }
  } as SectionManifest,

  CARE_CONDITIONS: {
    id: 'care-conditions',
    title: 'Conditions to Monitor',
    description: 'Health conditions requiring ongoing care',
    required: false,
    enabledByDefault: true,
    priority: 8,
    conditions: { hasChronicConditions: true }
  } as SectionManifest,

  // Medication sections
  CURRENT_MEDICATIONS: {
    id: 'current-medications',
    title: 'Your Medications',
    description: 'Current medications in understandable terms',
    required: false,
    enabledByDefault: true,
    priority: 7,
    conditions: { hasActiveMedications: true }
  } as SectionManifest,

  MEDICATION_REVIEW: {
    id: 'medication-review',
    title: 'Medication Analysis',
    description: 'Clinical medication review and interactions',
    required: false,
    enabledByDefault: true,
    priority: 7,
    conditions: { hasActiveMedications: true }
  } as SectionManifest,

  MEDICATION_MANAGEMENT: {
    id: 'medication-management',
    title: 'Medication Care Tasks',
    description: 'Practical medication management for caregivers',
    required: false,
    enabledByDefault: true,
    priority: 7,
    conditions: { hasActiveMedications: true }
  } as SectionManifest,

  // Lab results sections
  IMPORTANT_RESULTS: {
    id: 'important-results',
    title: 'Important Test Results',
    description: 'Key lab results explained simply',
    required: false,
    enabledByDefault: true,
    priority: 6,
    conditions: { hasLabValues: true }
  } as SectionManifest,

  LAB_ANALYSIS: {
    id: 'lab-analysis',
    title: 'Laboratory Analysis',
    description: 'Detailed lab result interpretation',
    required: false,
    enabledByDefault: true,
    priority: 6,
    conditions: { hasLabValues: true }
  } as SectionManifest,

  MONITORING_VALUES: {
    id: 'monitoring-values',
    title: 'Values to Watch',
    description: 'Lab values requiring caregiver monitoring',
    required: false,
    enabledByDefault: true,
    priority: 6,
    conditions: { hasLabValues: true }
  } as SectionManifest,

  // Action sections
  NEXT_STEPS: {
    id: 'next-steps',
    title: 'What You Should Do',
    description: 'Simple, actionable next steps',
    required: false,
    enabledByDefault: true,
    priority: 5
  } as SectionManifest,

  CLINICAL_RECOMMENDATIONS: {
    id: 'clinical-recommendations',
    title: 'Clinical Recommendations',
    description: 'Evidence-based clinical guidance',
    required: false,
    enabledByDefault: true,
    priority: 5
  } as SectionManifest,

  CARE_TASKS: {
    id: 'care-tasks',
    title: 'Daily Care Tasks',
    description: 'Practical caregiving activities and schedules',
    required: false,
    enabledByDefault: true,
    priority: 5
  } as SectionManifest,

  // Alert sections
  IMPORTANT_ALERTS: {
    id: 'important-alerts',
    title: 'Important Alerts',
    description: 'Critical information requiring attention',
    required: false,
    enabledByDefault: true,
    priority: 9,
    conditions: { hasAbnormalValues: true }
  } as SectionManifest,

  CLINICAL_ALERTS: {
    id: 'clinical-alerts',
    title: 'Clinical Alerts',
    description: 'Clinical findings requiring immediate attention',
    required: false,
    enabledByDefault: true,
    priority: 9,
    conditions: { hasAbnormalValues: true }
  } as SectionManifest,

  CARE_ALERTS: {
    id: 'care-alerts',
    title: 'Care Alerts',
    description: 'Urgent care needs or changes',
    required: false,
    enabledByDefault: true,
    priority: 9,
    conditions: { hasAbnormalValues: true }
  } as SectionManifest
};

// Patient-focused template (8th grade reading level)
export const PATIENT_TEMPLATE: PersonaTemplate = {
  id: 'patient-v2.1',
  name: 'Patient-Friendly Summary',
  persona: 'patient',
  version: '2.1.0',
  description: 'Clear, easy-to-understand health summary for patients and families',
  targetAudience: {
    primary: 'Patients and their families',
    readingLevel: '8th grade',
    clinicalExpertise: 'none'
  },
  sections: [
    SECTION_MANIFESTS.PATIENT_OVERVIEW,
    SECTION_MANIFESTS.IMPORTANT_ALERTS,
    SECTION_MANIFESTS.ACTIVE_CONDITIONS,
    SECTION_MANIFESTS.CURRENT_MEDICATIONS,
    SECTION_MANIFESTS.IMPORTANT_RESULTS,
    SECTION_MANIFESTS.NEXT_STEPS
  ],
  promptTemplate: `You are creating a health summary for a patient and their family. Write in simple, clear language that an 8th grader can understand. Avoid medical jargon and explain any necessary medical terms in parentheses.

IMPORTANT GUIDELINES:
- Use short sentences and simple words
- Explain medical terms in plain language
- Focus on what the patient needs to know and do
- Be reassuring but honest about concerns
- Use "you" and "your" to speak directly to the patient
- Include specific numbers and dates when helpful
- End each section with clear next steps

TONE: Caring, supportive, and encouraging while being informative
AVOID: Technical medical terms, complex explanations, alarming language without context

Generate sections based on the available clinical data:

{{SECTIONS}}

Remember: This summary should help the patient understand their health and feel confident about their care.`,
  styleGuidelines: {
    tone: 'Caring, supportive, encouraging',
    language: 'Simple, conversational, direct',
    technicalLevel: 'Minimal - explain all medical terms',
    urgencyHandling: 'Clear but reassuring, provide context',
    uncertaintyExpression: 'Honest but not alarming, suggest follow-up'
  }
};

// Provider-focused template (clinical assessment)
export const PROVIDER_TEMPLATE: PersonaTemplate = {
  id: 'provider-v2.1',
  name: 'Clinical Assessment Summary',
  persona: 'provider',
  version: '2.1.0',
  description: 'Comprehensive clinical summary for healthcare providers',
  targetAudience: {
    primary: 'Healthcare providers and clinical teams',
    readingLevel: 'Graduate/Professional',
    clinicalExpertise: 'expert'
  },
  sections: [
    SECTION_MANIFESTS.CLINICAL_OVERVIEW,
    SECTION_MANIFESTS.CLINICAL_ALERTS,
    SECTION_MANIFESTS.CLINICAL_CONDITIONS,
    SECTION_MANIFESTS.MEDICATION_REVIEW,
    SECTION_MANIFESTS.LAB_ANALYSIS,
    SECTION_MANIFESTS.CLINICAL_RECOMMENDATIONS
  ],
  promptTemplate: `You are providing a clinical summary for healthcare professionals. Use precise medical terminology and focus on clinically relevant information for care decisions.

IMPORTANT GUIDELINES:
- Use standard medical terminology and clinical language
- Include relevant clinical context and differential considerations
- Highlight abnormal values with clinical significance
- Provide evidence-based recommendations
- Note any drug interactions, contraindications, or monitoring needs
- Include relevant clinical guidelines and quality measures
- Structure information for rapid clinical decision-making

TONE: Professional, precise, objective, evidence-based
FOCUS: Clinical significance, care optimization, risk assessment

Generate sections based on the available clinical data:

{{SECTIONS}}

Include specific clinical markers, trending data, and actionable clinical insights. Prioritize information that impacts care decisions and patient outcomes.`,
  styleGuidelines: {
    tone: 'Professional, objective, precise',
    language: 'Medical terminology, clinical precision',
    technicalLevel: 'Expert - full clinical detail',
    urgencyHandling: 'Direct, specific, action-oriented',
    uncertaintyExpression: 'Clinical probability, recommend further evaluation'
  }
};

// Caregiver-focused template (practical care tasks)
export const CAREGIVER_TEMPLATE: PersonaTemplate = {
  id: 'caregiver-v2.1',
  name: 'Caregiver Care Plan',
  persona: 'caregiver',
  version: '2.1.0',
  description: 'Practical care guidance for family caregivers and care teams',
  targetAudience: {
    primary: 'Family caregivers and care team members',
    readingLevel: '10th grade',
    clinicalExpertise: 'basic'
  },
  sections: [
    SECTION_MANIFESTS.CARE_OVERVIEW,
    SECTION_MANIFESTS.CARE_ALERTS,
    SECTION_MANIFESTS.CARE_CONDITIONS,
    SECTION_MANIFESTS.MEDICATION_MANAGEMENT,
    SECTION_MANIFESTS.MONITORING_VALUES,
    SECTION_MANIFESTS.CARE_TASKS
  ],
  promptTemplate: `You are creating a care plan for family caregivers and care team members. Focus on practical, actionable information that helps them provide the best daily care.

IMPORTANT GUIDELINES:
- Provide specific, practical care instructions
- Include timing, frequency, and "what to watch for" guidance
- Explain why each care task is important
- Give clear warning signs and when to seek help
- Include medication schedules and administration tips
- Suggest organization tools and care routines
- Address common caregiver concerns and challenges

TONE: Supportive, practical, organized, empowering
FOCUS: Daily care activities, safety, organization, when to get help

Generate sections based on the available clinical data:

{{SECTIONS}}

Organize information to help caregivers feel confident and prepared. Include specific numbers, schedules, and clear action steps.`,
  styleGuidelines: {
    tone: 'Supportive, practical, organized',
    language: 'Clear instructions, helpful tips',
    technicalLevel: 'Basic - explain medical concepts simply',
    urgencyHandling: 'Clear warning signs, specific action steps',
    uncertaintyExpression: 'When in doubt guidance, escalation paths'
  }
};

// Spanish-first patient template (6th grade / primaria reading level)
export const PATIENT_ES_TEMPLATE: PersonaTemplate = {
  id: 'patient-es-v1.0',
  name: 'Resumen de Salud en Español',
  persona: 'patient-es',
  version: '1.0.0',
  description: 'Resumen de salud en español sencillo para pacientes de habla hispana (nivel de 6° grado)',
  targetAudience: {
    primary: 'Pacientes de habla hispana y sus familias',
    readingLevel: '6° grado de primaria',
    clinicalExpertise: 'none'
  },
  sections: [
    {
      ...SECTION_MANIFESTS.PATIENT_OVERVIEW,
      id: 'patient-overview',
      title: 'Su Salud Hoy',
    },
    {
      ...SECTION_MANIFESTS.IMPORTANT_ALERTS,
      id: 'important-alerts',
      title: 'Alertas Importantes',
    },
    {
      ...SECTION_MANIFESTS.ACTIVE_CONDITIONS,
      id: 'active-conditions',
      title: 'Sus Condiciones de Salud',
    },
    {
      ...SECTION_MANIFESTS.CURRENT_MEDICATIONS,
      id: 'current-medications',
      title: 'Sus Medicamentos',
    },
    {
      id: 'visit-questions',
      title: 'Preguntas para Su Médico',
      description: 'Exactamente 3 preguntas para hacer en la próxima visita',
      required: true,
      enabledByDefault: true,
      priority: 9,
    },
    {
      id: 'bring-checklist',
      title: 'Qué Traer a Su Cita',
      description: 'Exactamente 3 cosas que preparar antes de la visita',
      required: true,
      enabledByDefault: true,
      priority: 8,
    },
  ],
  promptTemplate: `Eres un asistente de salud que crea resúmenes de salud EN ESPAÑOL para pacientes hispanohablantes. Escribe en español sencillo, usando el registro de "Usted". El nivel de lectura debe ser de 6° grado de primaria — oraciones cortas, palabras simples.

INSTRUCCIONES IMPORTANTES:
- Escribe COMPLETAMENTE EN ESPAÑOL
- Usa oraciones cortas y palabras simples
- Explica los términos médicos con palabras sencillas
- Usa "Usted" y "su" para hablar directamente al paciente
- Sé tranquilizador pero honesto
- Incluye números y fechas específicas cuando sea útil
- Esta es la preparación para una visita médica — sé breve y directo

TONO: Cálido, comprensivo y alentador
EVITAR: Jerga médica sin explicar, oraciones largas y complejas

Genera las secciones basándote en los datos clínicos disponibles:

{{SECTIONS}}

Recuerda: Este resumen debe ayudar al paciente a entender su salud y sentirse preparado para su próxima cita.`,
  styleGuidelines: {
    tone: 'Cálido, comprensivo, alentador',
    language: 'Español sencillo, registro de "Usted", nivel de primaria',
    technicalLevel: 'Mínimo — explicar todos los términos médicos en español simple',
    urgencyHandling: 'Claro pero tranquilizador, dar contexto',
    uncertaintyExpression: 'Honesto pero no alarmante, sugerir seguimiento'
  }
};

// Default template registry
export const TEMPLATE_REGISTRY: Record<string, PersonaTemplate> = {
  'patient': PATIENT_TEMPLATE,
  'provider': PROVIDER_TEMPLATE,
  'caregiver': CAREGIVER_TEMPLATE,
  'patient-es': PATIENT_ES_TEMPLATE,
};

// A/B test variants
export const AB_TEST_VARIANTS = {
  patient: {
    'patient-v2.1-conversational': {
      ...PATIENT_TEMPLATE,
      id: 'patient-v2.1-conversational',
      abTestVariant: 'conversational',
      styleGuidelines: {
        ...PATIENT_TEMPLATE.styleGuidelines,
        tone: 'Very conversational, like talking to a friend'
      }
    },
    'patient-v2.1-structured': {
      ...PATIENT_TEMPLATE,
      id: 'patient-v2.1-structured',
      abTestVariant: 'structured',
      styleGuidelines: {
        ...PATIENT_TEMPLATE.styleGuidelines,
        language: 'Simple but more formal structure'
      }
    }
  }
};