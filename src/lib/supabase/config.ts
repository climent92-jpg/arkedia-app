// Comprova si les variables d'entorn de Supabase estan definides. Es pot
// cridar tant des del client (NEXT_PUBLIC_*) com des del servidor.
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
