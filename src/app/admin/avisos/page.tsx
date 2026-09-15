import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAllAnnouncements } from "@/lib/admin-data";
import { isAdminConfigured } from "@/lib/supabase/config";
import { AnnouncementsManager } from "./announcements-manager";

// Depèn de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AdminAvisosPage() {
  const configured = isAdminConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader
          title="Avisos i comunicats"
          description="Envia missatges col·lectius a tota l'escola o a grups concrets."
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="font-bold">Falta configurar la connexió d&apos;administració</p>
              <p className="mt-1">
                Defineix <code>SUPABASE_SERVICE_ROLE_KEY</code> a les variables
                d&apos;entorn perquè aquest panell pugui llegir i escriure avisos
                a Supabase. Consulta el README.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const announcements = await getAllAnnouncements();

  return (
    <div>
      <PageHeader
        title="Avisos i comunicats"
        description="Envia missatges col·lectius a tota l'escola o a grups concrets."
      />
      <AnnouncementsManager initialAnnouncements={announcements} />
    </div>
  );
}
