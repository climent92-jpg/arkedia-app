import { PageHeader } from "@/components/page-header";
import {
  getMyMaterials,
  getMyStudents,
  getMySubmittedVideos,
  getMyTeacherProfile,
} from "@/lib/professor-data";
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

  const [students, materials, submittedVideos] = await Promise.all([
    getMyStudents(teacher.id),
    getMyMaterials(teacher.id),
    getMySubmittedVideos(teacher.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Material"
        description="Partitures i vídeos, i revisió dels vídeos dels alumnes."
      />
      <MaterialTabs
        teacherId={teacher.id}
        students={students}
        initialMaterials={materials}
        initialSubmittedVideos={submittedVideos}
      />
    </div>
  );
}
