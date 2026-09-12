import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  let isAuth = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production-please-32chars');
      await jose.jwtVerify(token, secret);
      isAuth = true;
    } catch {
      isAuth = false;
    }
  }
  const pathname = request.nextUrl.pathname;

  // Protect /saved
  if (pathname.startsWith('/saved') && !isAuth) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/saved/:path*'],
};
