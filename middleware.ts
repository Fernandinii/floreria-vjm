import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Proteger rutas /admin (excepto /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      // Propagar cookies en la redirección
      supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c.name, c.value));
      return response;
    }

    // Consultar el rol directamente en la tabla user_roles
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('email', user.email)
      .single();

    const allowedRoles = ['admin', 'superadmin'];

    // Si el usuario no tiene rol permitido, rebotar al login
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      const response = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c.name, c.value));
      return response;
    }
  }

  // Si ya inició sesión y visita /admin/login, redirigir al dashboard
  if (pathname === '/admin/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c.name, c.value));
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};