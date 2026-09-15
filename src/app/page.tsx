import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { ROLE_HOME } from "@/lib/nav-config";

// Depèn de la cookie de sessió de cada petició: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const profile = await getCurrentProfile();
  redirect(profile ? ROLE_HOME[profile.role] : "/login");
}
