import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAllSchedules, getAllStudents, getAllTeachers } from "@/lib/admin-data";
import { isAdminConfigured } from "@/lib/supabase/config";
import { SchedulesManager } from "./schedules-manager";

// Depèn de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AdminHorarisPage() {
  const configured = isAdminConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader title="Horaris" description="Creació manual de classes." />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="font-bold">Falta configurar la connexió d&apos;administració</p>
              <p className="mt-1">
                Defineix <code>SUPABASE_SERVICE_ROLE_KEY</code> a les variables
                d&apos;entorn (Vercel o <code>.env.local</code>) perquè aquest panell
                pugui llegir i escriure a Supabase. Consulta el README.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [schedules, teachers, students] = await Promise.all([
    getAllSchedules(),
    getAllTeachers(),
    getAllStudents(),
  ]);

  return (
    <div>
      <PageHeader
        title="Horaris"
        description="Tria un professor per veure i gestionar la seva graella setmanal."
      />
      <SchedulesManager initialSchedules={schedules} teachers={teachers} students={students} />
    </div>
  );
}
