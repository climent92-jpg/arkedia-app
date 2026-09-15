import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/supabase/auth";

// La sessió depèn de les cookies de cada petició: mai es pot prerenderitzar
// estàticament, o tothom veuria el mateix HTML congelat en build time.
export const dynamic = "force-dynamic";

export default async function FamiliaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("familia");

  return (
    <AppShell role="familia" userName={profile.fullName}>
      {children}
    </AppShell>
  );
}
