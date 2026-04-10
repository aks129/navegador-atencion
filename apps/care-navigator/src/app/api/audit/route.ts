import { NextRequest, NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500);
  return NextResponse.json({ entries: getAuditLog(limit), count: limit });
}
