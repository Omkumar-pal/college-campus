import { cookies } from 'next/headers';
import { verifySessionToken } from './auth';

const COOKIE_NAME = 'session';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return { id: session.userId, email: session.email, name: session.name };
}
