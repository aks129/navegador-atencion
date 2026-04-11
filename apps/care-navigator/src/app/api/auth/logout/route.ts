import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  session.destroy();
  // Derive origin from the incoming request — works on any deployment without env vars
  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL('/es/patient/launch', origin));
}
