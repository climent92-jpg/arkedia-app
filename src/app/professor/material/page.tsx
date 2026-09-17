import { PageHeader } from "@/components/page-header";
import { MarkMaterialSeen } from "@/components/mark-material-seen";
import { getMyMaterials, getMyStudents, getMyTeacherProfile } from "@/lib/professor-data";
import { NoTeacherProfile } from "@/app/professor/page";
import { MaterialTabs } from "./material-tabs";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function ProfessorMaterialPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="Material" />
        <NoTeacherProfile />
      </div>
    );
  }

  const [students, materials] = await Promise.all([
    getMyStudents(teacher.id),
    getMyMaterials(teacher.id),
  ]);

  return (
    <div>
      <MarkMaterialSeen />
      <PageHeader
        title="Material"
        description="Partitures, vídeos i àudios per als teus alumnes."
      />
      <MaterialTabs teacherId={teacher.id} students={students} initialMaterials={materials} />
    </div>
  );
}
