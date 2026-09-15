import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/types";

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

// Retorna el perfil complet (auth.users + public.users) de l'usuari actual,
// o null si no ha iniciat sessió, si Supabase encara no està configurat, o
// si el compte no té cap fila a public.users (encara no assignat a l'escola).
export async function getCurrentProfile(): Promise<AuthProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role as UserRole,
  };
}

// Per als layouts dels portals protegits: exigeix sessió i el rol correcte.
// Sense sessió -> redirigeix al login. Amb el rol equivocat -> redirigeix
// al seu propi portal (una família mai veu l'admin, ni al revés).
export async function requireRole(role: UserRole): Promise<AuthProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }
  if (profile.role !== role) {
    redirect(`/${profile.role}`);
  }

  return profile;
}

// Per a Server Actions: en lloc de redirigir, llança un error que l'acció
// converteix en { success: false } perquè la UI el pugui mostrar sense
// trencar la pàgina (un redirect() a mig d'una Server Action no es pot
// "atrapar" i convertir en un resultat net).
export async function requireProfile(role: UserRole): Promise<AuthProfile> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== role) {
    throw new Error("No autoritzat.");
  }

  return profile;
}

export async function requireAdminProfile(): Promise<AuthProfile> {
  return requireProfile("admin");
}
