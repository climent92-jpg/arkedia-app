import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client de Supabase per a Server Components / Server Actions / Route Handlers.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Es pot ignorar si es crida des d'un Server Component:
            // el middleware ja refresca la sessió en aquest cas.
          }
        },
      },
    }
  );
}
