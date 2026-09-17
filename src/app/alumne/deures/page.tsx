import { PageHeader } from "@/components/page-header";
import { MarkFeedbackSeen } from "@/components/mark-feedback-seen";
import { getMyAssignments, getMyStudentProfile } from "@/lib/student-data";
import { NoStudentProfile } from "@/app/alumne/agenda/page";
import { DeuresList } from "./deures-list";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AlumneDeuresPage() {
  const student = await getMyStudentProfile();

  if (!student) {
    return (
      <div>
        <PageHeader title="Deures" />
        <NoStudentProfile />
      </div>
    );
  }

  const assignments = await getMyAssignments(student.id);

  return (
    <div>
      <MarkFeedbackSeen />
      <PageHeader title="Deures" description="El que cal practicar aquesta setmana." />
      <DeuresList assignments={assignments} studentId={student.id} />
    </div>
  );
}
