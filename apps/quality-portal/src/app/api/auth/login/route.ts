import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { password } = (await req.json()) as { password?: string };

  const correctPassword = process.env['PORTAL_AUTH_PASSWORD'] ?? 'gigidemo';
  const authToken = process.env['PORTAL_AUTH_TOKEN'] ?? 'gigi-demo-2024';

  if (password !== correctPassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('qp-auth', authToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}
