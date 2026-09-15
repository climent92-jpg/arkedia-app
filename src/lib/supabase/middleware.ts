import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types";

const PROTECTED_ROLE_BY_PREFIX: Record<string, UserRole> = {
  "/familia": "familia",
  "/professor": "professor",
  "/admin": "admin",
};

function requiredRoleFor(pathname: string): UserRole | null {
  for (const [prefix, role] of Object.entries(PROTECTED_ROLE_BY_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }
  return null;
}

function redirectTo(request: NextRequest, pathname: string, keepNext = false) {
  const url = request.nextUrl.clone();
  const original = url.pathname;
  url.pathname = pathname;
  if (keepNext) {
    url.searchParams.set("next", original);
  } else {
    url.searchParams.delete("next");
  }
  return NextResponse.redirect(url);
}

// Refresca la sessió de Supabase Auth a cada petició i bloqueja l'accés als
// portals (/familia, /professor, /admin) sense sessió vàlida o amb el rol
// equivocat. Es crida des de src/proxy.ts.
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiredRole = requiredRoleFor(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Sense Supabase configurat no hi ha manera d'autenticar-se: mai deixem
    // passar cap accés directe als portals.
    if (requiredRole) {
      return redirectTo(request, "/login", true);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (requiredRole) {
    if (!user) {
      return redirectTo(request, "/login", true);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // Sessió vàlida però encara sense fila a public.users: no assignat.
      return redirectTo(request, "/login");
    }
    if (profile.role !== requiredRole) {
      return redirectTo(request, `/${profile.role}`);
    }
  } else if (pathname === "/login" && user) {
    // Ja ha iniciat sessió i visita el login: el portem al seu portal.
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) {
      return redirectTo(request, `/${profile.role}`);
    }
  }

  return response;
}
