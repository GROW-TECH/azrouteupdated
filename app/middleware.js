// middleware.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
  const token = request.cookies.get("auth-token");
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  if (pathname.startsWith('/auth/') || pathname === '/') {
    return NextResponse.next();
  }

  try {
    if (!token) {
      throw new Error('No token found');
    }

    // Verify JWT
    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // Add role to headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-id', payload.id);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Check role-based access
    if (pathname.startsWith('/dashboard/student') && payload.role !== 'student') {
      throw new Error('Unauthorized');
    }

    if (pathname.startsWith('/dashboard/teacher') && payload.role !== 'teacher') {
      throw new Error('Unauthorized');
    }

    return NextResponse.next();
  } catch (error) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine redirect path based on current URL
    const redirectPath = pathname.includes('teacher')
      ? '/auth/teacher/login'
      : '/auth/student/login';

    const redirectUrl = new URL(redirectPath, request.url);
    redirectUrl.searchParams.set('callbackUrl', pathname);
    
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/courses/:path',
    'learn/:path',
    '/api/dashboard/:path*',
    '/api/upload/:path*',
  ]
};



