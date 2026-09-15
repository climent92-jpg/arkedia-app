import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllStudents, getAllTeachers, getAllUsers } from "@/lib/admin-data";
import { isAdminConfigured } from "@/lib/supabase/config";
import { StudentsManager } from "./students-manager";
import { TeachersManager } from "./teachers-manager";
import { UsersManager } from "./users-manager";

// Depèn de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AdminUsuarisPage() {
  const configured = isAdminConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader
          title="Gestió d'usuaris"
          description="Professors, alumnes i comptes d'accés a l'escola."
        />
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

  const [users, teachers, students] = await Promise.all([
    getAllUsers(),
    getAllTeachers(),
    getAllStudents(),
  ]);

  return (
    <div>
      <PageHeader
        title="Gestió d'usuaris"
        description="Professors, alumnes i comptes d'accés — dades reals de Supabase."
      />

      <Tabs defaultValue="usuaris">
        <TabsList>
          <TabsTrigger value="usuaris">Usuaris ({users.length})</TabsTrigger>
          <TabsTrigger value="professors">Professors ({teachers.length})</TabsTrigger>
          <TabsTrigger value="alumnes">Alumnes ({students.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="usuaris">
          <UsersManager initialUsers={users} />
        </TabsContent>

        <TabsContent value="professors">
          <TeachersManager initialTeachers={teachers} availableUsers={users} />
        </TabsContent>

        <TabsContent value="alumnes">
          <StudentsManager
            initialStudents={students}
            availableUsers={users}
            availableTeachers={teachers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
