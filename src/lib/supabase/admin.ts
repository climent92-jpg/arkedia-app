import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdminConfigured } from "@/lib/supabase/config";

// Client amb la service role key de Supabase: es salta la Row Level
// Security i pot administrar Auth (crear/eliminar usuaris).
//
// NOMÉS s'ha d'utilitzar dins de Server Actions / Server Components que ja
// hagin comprovat amb requireAdminProfile() que qui truca és un admin
// autenticat. El paquet "server-only" fa fallar el build si algun dia
// s'importa per error des d'un component de client.
export function createAdminClient() {
  if (!isAdminConfigured()) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY (i NEXT_PUBLIC_SUPABASE_URL) per a les operacions d'administració."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
