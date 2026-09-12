'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword, createSessionToken } from '@/lib/auth';

const COOKIE_NAME = 'session';

export async function signup(formData: FormData): Promise<void> {
  const name = formData.get('name')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!name || !email || !password) return;
  if (password.length < 6) return;
  if (!email.includes('@')) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/');
}

export async function login(formData: FormData): Promise<void> {
  const email = formData.get('email')?.toString().trim().toLowerCase();
  const password = formData.get('password')?.toString();

  if (!email || !password) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return;

  const token = await createSessionToken({ userId: user.id, email: user.email, name: user.name });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/');
}
