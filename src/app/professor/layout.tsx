import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/supabase/auth";

// La sessió depèn de les cookies de cada petició: mai es pot prerenderitzar
// estàticament, o tothom veuria el mateix HTML congelat en build time.
export const dynamic = "force-dynamic";

export default async function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("professor");

  return (
    <AppShell role="professor" userName={profile.fullName}>
      {children}
    </AppShell>
  );
}
