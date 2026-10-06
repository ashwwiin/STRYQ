import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('stryq_session')?.value;

  const isAuth = Boolean(sessionCookie);
  const isAuthPage = pathname === '/login';
  const isRootPage = pathname === '/';
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/workout') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings');

  // Root route '/' -> redirect to /dashboard if logged in, otherwise /login
  if (isRootPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is already authenticated and visits /login -> redirect to /dashboard
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access a protected page -> redirect to /login
  if (isProtectedPage && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, and static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
