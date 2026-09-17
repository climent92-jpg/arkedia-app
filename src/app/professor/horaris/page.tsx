import { PageHeader } from "@/components/page-header";
import { getMySchedule, getMyStudents, getMyTeacherProfile } from "@/lib/professor-data";
import { NoTeacherProfile } from "@/app/professor/page";
import { HorarisManager } from "./horaris-manager";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function ProfessorHorarisPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="Horaris" />
        <NoTeacherProfile />
      </div>
    );
  }

  const [schedule, students] = await Promise.all([
    getMySchedule(teacher.id),
    getMyStudents(teacher.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Horaris"
        description="Gestiona les teves pròpies franges horàries, dia a dia."
      />
      <HorarisManager schedule={schedule} students={students} />
    </div>
  );
}
