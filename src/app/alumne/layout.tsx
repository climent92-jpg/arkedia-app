import { AppShell } from "@/components/app-shell";
import { getMyStudentProfile } from "@/lib/student-data";
import { getStudentNavBadges } from "@/lib/nav-badges";
import { requireRole } from "@/lib/supabase/auth";

// La sessió depèn de les cookies de cada petició: mai es pot prerenderitzar
// estàticament, o tothom veuria el mateix HTML congelat en build time.
export const dynamic = "force-dynamic";

export default async function AlumneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("familia");
  const student = await getMyStudentProfile();
  const badges = student ? await getStudentNavBadges(student.id, profile.id) : undefined;

  return (
    <AppShell role="familia" userName={profile.fullName} badges={badges}>
      {children}
    </AppShell>
  );
}
