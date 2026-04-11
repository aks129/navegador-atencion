import { type NextRequest, NextResponse } from 'next/server';

// Routes that bypass auth
const AUTH_EXEMPT = [
  '/login',
  '/api/',
  '/_next/',
  '/favicon',
  '/share/', // share links are publicly accessible
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get('demo-auth');
  const token = process.env['PORTAL_AUTH_TOKEN'] ?? 'gigi-demo-2024';
  const isAuthed = authCookie?.value === token;

  const isExempt = AUTH_EXEMPT.some(p => pathname.startsWith(p));

  if (!isExempt && !isAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
