import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabaseClient, handleSupabaseRateLimit } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/reset-password', 
    '/unauthorized', 
    '/privacy', 
    '/terms'
  ];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Fetch the session
  const { data: { session }, error } = await supabase.auth.getSession();

  // Handle rate-limited requests
  if (error?.status === 429) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' }, 
      { status: 429 }
    );
  }

  // Redirect logic for authenticated routes
  if (!isPublicRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Optional: Role-based access control
    const userRole = session.user.user_metadata?.role;
    const restrictedRoutes = {
      EMPLOYEE: ['/dashboard/billing', '/dashboard/team'],
      CLIENT: ['/dashboard/team', '/dashboard/work-orders', '/dashboard/customers'],
    };

    if (userRole && restrictedRoutes[userRole as keyof typeof restrictedRoutes]) {
      const restrictedRoutePrefixes = restrictedRoutes[userRole as keyof typeof restrictedRoutes];
      if (restrictedRoutePrefixes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Handle rate-limited requests for specific routes
  const rateControlledRoutes = [
    '/api/auth', 
    '/api/trpc', 
    '/dashboard/api'
  ];

  if (rateControlledRoutes.some(route => pathname.startsWith(route))) {
    try {
      return await handleSupabaseRateLimit(request, async () => {
        // Your original request handling logic
        return NextResponse.next();
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Request failed due to rate limiting' }, 
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|manifest.json).*)',
  ],
}; 