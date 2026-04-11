import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18n = createIntlMiddleware(routing);

// Routes that bypass the demo-auth check entirely
const AUTH_EXEMPT = [
  '/login',
  '/api/', // all API routes pass through (SMART OAuth callback needs this)
  '/_next/',
  '/favicon',
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Check demo auth cookie
  const authCookie = request.cookies.get('demo-auth');
  const token = process.env['PORTAL_AUTH_TOKEN'] ?? 'gigi-demo-2024';
  const isAuthed = authCookie?.value === token;

  const isExempt = AUTH_EXEMPT.some(p => pathname.startsWith(p));

  if (!isExempt && !isAuthed) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Quality portal routes skip next-intl (English-only, no locale prefix)
  if (pathname.startsWith('/quality')) {
    return NextResponse.next();
  }

  // All other routes go through next-intl locale middleware
  return handleI18n(request) as NextResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
