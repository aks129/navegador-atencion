import { NextRequest, NextResponse } from 'next/server';
import type { NarrativeRequest } from '@plumly/cql-measures';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a healthcare quality analyst writing a narrative summary for a Federally Qualified Health Center (FQHC) quality report.
Write 2-3 paragraphs (200-300 words total) in professional but accessible language for a clinical care team.
Your narrative should:
1. Open with a concise overall performance summary (1 sentence with the top highlight)
2. Discuss 2-3 specific strengths and 1-2 priority improvement areas with concrete context
3. Close with an actionable recommendation that a care team can act on this quarter

Return ONLY the narrative text — no headers, no JSON, no markdown. Plain paragraphs only.`;

function buildUserPrompt(req: NarrativeRequest): string {
  const lines: string[] = [
    `Facility: ${req.facilityName}`,
    `Reporting Period: ${req.reportingPeriod.start} to ${req.reportingPeriod.end}`,
    `Total Active Patients: ${req.totalPatients.toLocaleString()}`,
    '',
    'UDS Quality Measure Performance:',
  ];

  for (const score of req.scores) {
    const def = req.definitions.find(d => d.id === score.measureId);
    if (!def) continue;
    const direction = score.trend === 'up' ? 'improving' : score.trend === 'down' ? 'declining' : 'stable';
    const vs = def.nationalAverage !== undefined
      ? ` (HRSA national avg: ${def.nationalAverage}%)`
      : '';
    const level = score.performanceLevel === 'high' ? 'HIGH' : score.performanceLevel === 'medium' ? 'MEDIUM' : 'LOW';
    lines.push(
      `- ${def.shortName} [${level}]: ${score.rate.toFixed(1)}%${vs} — ${direction} (${score.trendDelta >= 0 ? '+' : ''}${score.trendDelta.toFixed(1)}% vs prior period). N=${score.denominator} eligible.`,
    );
  }

  lines.push('', 'Write a narrative report for the care team based on this data.');
  return lines.join('\n');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY not configured' },
      { status: 503 },
    );
  }

  let body: NarrativeRequest;
  try {
    body = (await req.json()) as NarrativeRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { default: Groq } = await import('groq-sdk');
    const client = new Groq({ apiKey: groqKey });

    const completion = await client.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 500,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
      ],
    });

    const narrative = completion.choices[0]?.message?.content?.trim() ?? '';

    return NextResponse.json({
      narrative,
      model: GROQ_MODEL,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
