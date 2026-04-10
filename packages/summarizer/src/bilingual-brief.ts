// Bilingual (English + Spanish) visit-prep brief generator

import type { ResourceSelectionResult } from '@plumly/fhir-utils';
import { ClaudeClient } from './claude-client';
import type { BilingualBrief, BilingualBriefRequest, VisitPrepBrief, SummaryResponse } from './types';

const VISIT_PREP_TEMPLATE_OPTIONS = {
  includeSections: ['patient-overview', 'visit-questions', 'bring-checklist', 'medication-review', 'lab-analysis'],
  excludeSections: ['clinical-recommendations'],
};

/**
 * Map a structured SummaryResponse into the constrained VisitPrepBrief shape:
 * - overview: 1 paragraph from the patient-overview section (or summary fallback)
 * - questionsForDoctor: exactly 3 questions extracted from visit-questions section
 * - bringChecklist: exactly 3 items extracted from bring-checklist section
 */
function mapToVisitPrepBrief(response: SummaryResponse, language: 'en' | 'es'): VisitPrepBrief {
  const findSection = (id: string) =>
    response.sections.find(s => s.id === id || s.title.toLowerCase().includes(id.toLowerCase()));

  const overviewSection = findSection('patient-overview') ?? findSection('health summary') ?? findSection('resumen');
  const questionsSection = findSection('visit-questions') ?? findSection('question') ?? findSection('pregunta');
  const checklistSection = findSection('bring-checklist') ?? findSection('bring') ?? findSection('traer') ?? findSection('preparar');
  const medsSection = findSection('medication-review') ?? findSection('medications') ?? findSection('medicamentos');
  const labsSection = findSection('lab-analysis') ?? findSection('labs') ?? findSection('laboratorio');

  const overview = overviewSection?.content ?? response.summary ?? '';

  // Extract list items from section content (numbered or bulleted)
  function extractListItems(content: string | undefined, count: number, fallback: string[]): string[] {
    if (!content) return fallback.slice(0, count);
    const lines = content
      .split('\n')
      .map(l => l.replace(/^[\d\.\-\*\•]\s*/, '').trim())
      .filter(l => l.length > 10);
    const items = lines.slice(0, count);
    // Pad with fallback if not enough items
    while (items.length < count) {
      const fb = fallback[items.length];
      if (fb) items.push(fb);
      else break;
    }
    return items;
  }

  const enFallbackQuestions = [
    'What are my most important health concerns right now?',
    'Are there any changes to my medications I should know about?',
    'What should I focus on before my next visit?',
  ];
  const esFallbackQuestions = [
    '¿Cuáles son mis problemas de salud más importantes en este momento?',
    '¿Hay algún cambio en mis medicamentos que deba saber?',
    '¿En qué debo enfocarme antes de mi próxima visita?',
  ];
  const enFallbackChecklist = [
    'Bring a list of all medications (including vitamins and supplements)',
    'Bring your insurance card and photo ID',
    'Write down any questions or symptoms you want to discuss',
  ];
  const esFallbackChecklist = [
    'Traiga una lista de todos sus medicamentos (incluyendo vitaminas y suplementos)',
    'Traiga su tarjeta de seguro médico e identificación con foto',
    'Anote cualquier pregunta o síntoma que quiera comentar',
  ];

  const fallbackQ = language === 'es' ? esFallbackQuestions : enFallbackQuestions;
  const fallbackC = language === 'es' ? esFallbackChecklist : enFallbackChecklist;

  return {
    overview,
    questionsForDoctor: extractListItems(questionsSection?.content, 3, fallbackQ),
    currentMedsToConfirm: medsSection ? extractListItems(medsSection.content, 3, []) : [],
    labsToReview: labsSection ? extractListItems(labsSection.content, 3, []) : [],
    bringChecklist: extractListItems(checklistSection?.content, 3, fallbackC),
    language,
    readingLevel: language === 'es' ? '6th grade (Spanish)' : '8th grade (English)',
  };
}

/**
 * Generate a bilingual (English + Spanish) visit-prep brief from FHIR resource data.
 *
 * Makes two parallel Claude calls — one for each language — for clean failure isolation.
 * Both calls use the same resourceData; the Spanish call uses the 'patient-es' persona.
 */
export async function generateBilingualBrief(
  request: BilingualBriefRequest,
  apiKey: string
): Promise<BilingualBrief> {
  const startTime = Date.now();
  const client = new ClaudeClient(apiKey);

  const baseTemplateOptions = {
    ...VISIT_PREP_TEMPLATE_OPTIONS,
    customInstructions: buildVisitPrepInstructions(request),
  };

  const [enResponse, esResponse] = await Promise.all([
    client.summarize({
      resourceData: request.resourceData,
      persona: 'patient',
      templateOptions: {
        ...baseTemplateOptions,
        customInstructions:
          `${baseTemplateOptions.customInstructions}\n\n` +
          `CRITICAL: Structure your response with exactly these sections:\n` +
          `1. Section id "patient-overview": One paragraph (3-4 sentences) about the patient's current health status.\n` +
          `2. Section id "visit-questions": Exactly 3 numbered questions for the patient to ask their doctor at the upcoming visit.\n` +
          `3. Section id "medication-review": Up to 3 active medications the patient should confirm with their doctor (name + dose). Omit section if no active medications.\n` +
          `4. Section id "lab-analysis": Up to 3 recent or notable lab results the patient should discuss (name + value + flag if abnormal). Omit section if no labs.\n` +
          `5. Section id "bring-checklist": Exactly 3 numbered items the patient should bring or prepare for the visit.\n` +
          `Write at an 8th grade reading level. Use plain English. Do not use medical jargon without explaining it.`,
      },
      abTestVariant: request.abTestVariant,
    }),
    client.summarize({
      resourceData: request.resourceData,
      persona: 'patient-es',
      templateOptions: {
        ...baseTemplateOptions,
        customInstructions:
          `${baseTemplateOptions.customInstructions}\n\n` +
          `CRITICAL: Responde COMPLETAMENTE EN ESPAÑOL. Usa el registro de "Usted".\n` +
          `Estructura tu respuesta con exactamente estas secciones:\n` +
          `1. Section id "patient-overview": Un párrafo (3-4 oraciones) sobre el estado de salud actual del paciente.\n` +
          `2. Section id "visit-questions": Exactamente 3 preguntas numeradas que el paciente debe hacerle a su médico en la próxima visita.\n` +
          `3. Section id "medication-review": Hasta 3 medicamentos activos que el paciente debe confirmar con su médico (nombre + dosis). Omitir sección si no hay medicamentos activos.\n` +
          `4. Section id "lab-analysis": Hasta 3 resultados de laboratorio recientes o notables que el paciente debe discutir (nombre + valor + indicador si es anormal). Omitir sección si no hay laboratorios.\n` +
          `5. Section id "bring-checklist": Exactamente 3 cosas numeradas que el paciente debe traer o preparar para la visita.\n` +
          `Escribe a un nivel de lectura de 6° grado. Usa lenguaje sencillo. No uses términos médicos sin explicarlos.`,
      },
      abTestVariant: request.abTestVariant,
    }),
  ]);

  const sourceResourceIds = [
    ...(request.resourceData.labValues?.map(l => l.source?.id).filter(Boolean) ?? []),
    ...(request.resourceData.medications?.map(m => m.source?.id).filter(Boolean) ?? []),
    ...(request.resourceData.conditions?.map(c => c.source?.id).filter(Boolean) ?? []),
  ] as string[];

  return {
    en: mapToVisitPrepBrief(enResponse, 'en'),
    es: mapToVisitPrepBrief(esResponse, 'es'),
    metadata: {
      templateId: 'bilingual-visit-prep-v1',
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      model: 'claude-3-5-sonnet-20241022',
      sourceResourceIds,
    },
  };
}

function buildVisitPrepInstructions(request: BilingualBriefRequest): string {
  const parts: string[] = ['This is a VISIT PREPARATION brief — keep it short and actionable.'];

  if (request.patientPreferredName) {
    parts.push(`The patient's preferred name is: ${request.patientPreferredName}`);
  }

  if (request.upcomingEncounterDate) {
    parts.push(`Upcoming appointment date: ${request.upcomingEncounterDate}`);
  }

  parts.push('Focus only on the most clinically important items for this upcoming visit.');
  return parts.join(' ');
}
