import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('nexora_role')?.value;
  const isAuthenticated = !!role;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // /admin/approvals is also accessible to FACULTY (Coordinators & HoDs for student verification)
    if (pathname === '/admin/approvals' && role === 'FACULTY') {
      return NextResponse.next();
    }

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      // Forbidden for students: redirect back to student app
      const appUrl = new URL('/app', request.url);
      appUrl.searchParams.set('error', 'unauthorized_admin_access');
      return NextResponse.redirect(appUrl);
    }
  }

  // Protect /app routes - requires authenticated user
  if (pathname.startsWith('/app')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
