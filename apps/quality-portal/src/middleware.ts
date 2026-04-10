import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard'];

// Routes that are always public
const PUBLIC_PREFIXES = ['/login', '/pitch', '/api/auth', '/_next', '/favicon'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check protected routes
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Verify session cookie
  const authCookie = request.cookies.get('qp-auth');
  const expectedToken = process.env['PORTAL_AUTH_TOKEN'] ?? 'gigi-demo-2024';

  if (authCookie?.value === expectedToken) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
