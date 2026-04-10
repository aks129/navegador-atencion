import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('qp-auth', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
