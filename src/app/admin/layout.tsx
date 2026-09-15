import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/supabase/auth";

// La sessió depèn de les cookies de cada petició: mai es pot prerenderitzar
// estàticament, o tothom veuria el mateix HTML congelat en build time.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("admin");

  return (
    <AppShell role="admin" userName={profile.fullName}>
      {children}
    </AppShell>
  );
}
