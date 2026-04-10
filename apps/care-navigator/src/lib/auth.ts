import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/types/session';

export { type SessionData };

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-min-32-characters!!',
  cookieName: 'cn_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

/** Get the current iron-session from Next.js App Router cookies() */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
