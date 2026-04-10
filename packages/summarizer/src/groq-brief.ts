/**
 * Bilingual visit-prep brief generator using Groq (free tier).
 * Drop-in replacement for generateBilingualBrief when GROQ_API_KEY is set.
 */

import Groq from 'groq-sdk';
import type { ResourceSelectionResult } from '@plumly/fhir-utils';
import type { BilingualBrief, BilingualBriefRequest, VisitPrepBrief } from './types';

const MODEL = 'llama-3.3-70b-versatile';

function buildContextSummary(resourceData: ResourceSelectionResult): string {
  const lines: string[] = [];

  const patient = resourceData.patient;
  if (patient?.name?.[0]) {
    const n = patient.name[0];
    const name = [n.given?.join(' '), n.family].filter(Boolean).join(' ');
    if (name) lines.push(`Patient: ${name}`);
  }

  if (resourceData.conditions.length > 0) {
    const active = resourceData.conditions.filter(c => c.isActive || c.isChronic);
    if (active.length > 0) {
      lines.push(`Conditions: ${active.map(c => c.name).join(', ')}`);
    }
  }

  if (resourceData.medications.length > 0) {
    const meds = resourceData.medications.filter(m => m.isActive);
    if (meds.length > 0) {
      lines.push(`Active medications: ${meds.map(m => m.name + (m.dosage ? ` ${m.dosage}` : '')).join(', ')}`);
    }
  }

  if (resourceData.labValues.length > 0) {
    const notable = resourceData.labValues.slice(0, 6).map(l => {
      const flag = l.isAbnormal ? ' [ABNORMAL]' : '';
      return `${l.display}: ${l.value} ${l.unit ?? ''}${flag}`.trim();
    });
    lines.push(`Recent labs: ${notable.join('; ')}`);
  }

  if (resourceData.encounters.length > 0) {
    const enc = resourceData.encounters[0];
    const date = enc.period?.start ? ` (${enc.period.start.substring(0, 10)})` : '';
    lines.push(`Most recent encounter: ${enc.type?.[0]?.text ?? enc.class?.display ?? 'visit'}${date}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'No detailed clinical data available.';
}

const EN_SYSTEM = `You are a healthcare assistant preparing a concise visit summary for a patient.
Return ONLY valid JSON — no markdown, no explanation outside JSON.
Schema:
{
  "overview": "string — 2-3 sentence summary of current health status in plain 8th-grade English",
  "questionsForDoctor": ["string", "string", "string"],
  "bringChecklist": ["string", "string", "string"]
}`;

const ES_SYSTEM = `Eres un asistente de salud preparando un resumen de visita para un paciente hispanohablante.
Responde SOLO con JSON válido — sin markdown ni texto fuera del JSON.
Usa el registro de "Usted". Escribe a nivel de 6° grado de primaria.
Esquema:
{
  "overview": "cadena — resumen de 2-3 oraciones del estado de salud actual en español sencillo",
  "questionsForDoctor": ["cadena", "cadena", "cadena"],
  "bringChecklist": ["cadena", "cadena", "cadena"]
}`;

function makeUserPrompt(context: string, lang: 'en' | 'es', request: BilingualBriefRequest): string {
  const lines = [`Clinical summary:\n${context}`];
  if (request.patientPreferredName) {
    lines.push(lang === 'es'
      ? `Nombre preferido del paciente: ${request.patientPreferredName}`
      : `Patient preferred name: ${request.patientPreferredName}`);
  }
  if (request.upcomingEncounterDate) {
    lines.push(lang === 'es'
      ? `Fecha de la próxima cita: ${request.upcomingEncounterDate}`
      : `Upcoming appointment date: ${request.upcomingEncounterDate}`);
  }
  lines.push(lang === 'es'
    ? 'Genera el resumen en español usando el esquema JSON indicado.'
    : 'Generate the visit summary using the JSON schema provided.');
  return lines.join('\n\n');
}

const EN_FALLBACK: Omit<VisitPrepBrief, 'language' | 'readingLevel'> = {
  overview: 'Your health summary is being prepared. Please discuss your current health status with your doctor.',
  questionsForDoctor: [
    'What are my most important health concerns right now?',
    'Are there any changes to my medications I should know about?',
    'What should I focus on before my next visit?',
  ],
  bringChecklist: [
    'Bring a list of all medications (including vitamins and supplements)',
    'Bring your insurance card and photo ID',
    'Write down any questions or symptoms you want to discuss',
  ],
};

const ES_FALLBACK: Omit<VisitPrepBrief, 'language' | 'readingLevel'> = {
  overview: 'Su resumen de salud está siendo preparado. Por favor hable con su médico sobre su estado de salud actual.',
  questionsForDoctor: [
    '¿Cuáles son mis problemas de salud más importantes en este momento?',
    '¿Hay algún cambio en mis medicamentos que deba saber?',
    '¿En qué debo enfocarme antes de mi próxima visita?',
  ],
  bringChecklist: [
    'Traiga una lista de todos sus medicamentos (incluyendo vitaminas y suplementos)',
    'Traiga su tarjeta de seguro médico e identificación con foto',
    'Anote cualquier pregunta o síntoma que quiera comentar',
  ],
};

function parseGroqResponse(
  text: string,
  lang: 'en' | 'es',
): Omit<VisitPrepBrief, 'language' | 'readingLevel'> {
  const fallback = lang === 'en' ? EN_FALLBACK : ES_FALLBACK;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);
    const questions = Array.isArray(parsed.questionsForDoctor)
      ? parsed.questionsForDoctor.slice(0, 3).map(String)
      : fallback.questionsForDoctor;
    const checklist = Array.isArray(parsed.bringChecklist)
      ? parsed.bringChecklist.slice(0, 3).map(String)
      : fallback.bringChecklist;
    // Pad to 3 if model returned fewer
    while (questions.length < 3) questions.push(fallback.questionsForDoctor[questions.length]);
    while (checklist.length < 3) checklist.push(fallback.bringChecklist[checklist.length]);
    return {
      overview: typeof parsed.overview === 'string' ? parsed.overview : fallback.overview,
      questionsForDoctor: questions,
      bringChecklist: checklist,
    };
  } catch {
    return fallback;
  }
}

export async function generateBilingualBriefWithGroq(
  request: BilingualBriefRequest,
  apiKey: string,
): Promise<BilingualBrief> {
  const startTime = Date.now();
  const client = new Groq({ apiKey });
  const context = buildContextSummary(request.resourceData);

  const [enRaw, esRaw] = await Promise.all([
    client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        { role: 'system', content: EN_SYSTEM },
        { role: 'user', content: makeUserPrompt(context, 'en', request) },
      ],
    }),
    client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        { role: 'system', content: ES_SYSTEM },
        { role: 'user', content: makeUserPrompt(context, 'es', request) },
      ],
    }),
  ]);

  const enText = enRaw.choices[0]?.message?.content ?? '';
  const esText = esRaw.choices[0]?.message?.content ?? '';

  const enData = parseGroqResponse(enText, 'en');
  const esData = parseGroqResponse(esText, 'es');

  const sourceResourceIds = [
    ...(request.resourceData.labValues?.map(l => l.source?.id).filter(Boolean) ?? []),
    ...(request.resourceData.medications?.map(m => m.source?.id).filter(Boolean) ?? []),
    ...(request.resourceData.conditions?.map(c => c.source?.id).filter(Boolean) ?? []),
  ] as string[];

  return {
    en: { ...enData, language: 'en', readingLevel: '8th grade (English)' },
    es: { ...esData, language: 'es', readingLevel: '6th grade (Spanish)' },
    metadata: {
      templateId: 'groq-bilingual-visit-prep-v1',
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      model: MODEL,
      sourceResourceIds,
    },
  };
}
