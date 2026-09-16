import { PageHeader } from "@/components/page-header";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getMyStudentProfile } from "@/lib/student-data";

// Depèn de la sessió: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AlumnePerfilPage() {
  const student = await getMyStudentProfile();

  return (
    <div>
      <PageHeader
        title="El meu perfil"
        description={
          student ? `${student.firstName} ${student.lastName}` : "Configuració del compte."
        }
      />
      <ChangePasswordForm />
    </div>
  );
}
