// Comprova si les variables d'entorn de Supabase estan definides. Es pot
// cridar tant des del client (NEXT_PUBLIC_*) com des del servidor.
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// La service role key només existeix al servidor: fa falta per a les
// operacions d'administració (crear usuaris d'Auth, saltar-se RLS des del
// panell d'admin). Si no hi és, el panell d'administració mostra un avís
// en lloc de trencar-se.
export function isAdminConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
