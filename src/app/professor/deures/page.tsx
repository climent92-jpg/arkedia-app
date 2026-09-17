import { PageHeader } from "@/components/page-header";
import { RefreshNavBadges } from "@/components/refresh-nav-badges";
import { getMyAssignments, getMyStudents, getMyTeacherProfile } from "@/lib/professor-data";
import { NoTeacherProfile } from "@/app/professor/page";
import { AssignmentsManager } from "./assignments-manager";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function ProfessorDeuresPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="Deures" />
        <NoTeacherProfile />
      </div>
    );
  }

  const [students, assignments] = await Promise.all([
    getMyStudents(teacher.id),
    getMyAssignments(teacher.id),
  ]);

  return (
    <div>
      <RefreshNavBadges />
      <PageHeader title="Deures" description="Assigna tasques i exercicis setmanals." />
      <AssignmentsManager students={students} assignments={assignments} />
    </div>
  );
}
