import { AppShell } from "@/components/app-shell";
import { getMyTeacherProfile } from "@/lib/professor-data";
import { getTeacherNavBadges } from "@/lib/nav-badges";
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
  const teacher = await getMyTeacherProfile();
  const badges = teacher ? await getTeacherNavBadges(teacher.id, profile.id) : undefined;

  return (
    <AppShell role="professor" userName={profile.fullName} badges={badges}>
      {children}
    </AppShell>
  );
}
