import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase is not configured, fail closed for /admin but never crash.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (
      request.nextUrl.pathname.startsWith('/admin') &&
      request.nextUrl.pathname !== '/admin/login'
    ) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    // Auth service unreachable — treat as logged out (fail closed below).
    user = null;
  }

  // Protect /admin routes except /admin/login
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      // If already logged in, redirect to dashboard
      if (user) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return supabaseResponse;
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
