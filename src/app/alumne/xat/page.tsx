import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getMyStudentProfile, getMyTeachers } from "@/lib/student-data";
import { getThreadsForStudent } from "@/lib/chat-data";
import { NoStudentProfile } from "@/app/alumne/agenda/page";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AlumneXatPage() {
  const student = await getMyStudentProfile();

  if (!student) {
    return (
      <div>
        <PageHeader title="Xat" />
        <NoStudentProfile />
      </div>
    );
  }

  const teachers = await getMyTeachers(student.id);
  const threads = await getThreadsForStudent(student.id, teachers);

  return (
    <div>
      <PageHeader title="Xat" description="Converses amb el teu professorat." />

      <div className="flex flex-col gap-2.5">
        {threads.map((t) => (
          <Link key={t.id} href={`/alumne/xat/${t.id}`}>
            <Card className="transition-colors hover:border-arkedia-blue">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arkedia-blue-light font-bold text-arkedia-blue">
                  {t.teacherFirstName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {t.teacherFirstName} {t.teacherLastName}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {t.lastMessage ?? "Encara no hi ha cap missatge"}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted" />
              </CardContent>
            </Card>
          </Link>
        ))}

        {threads.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no tens cap professor/a assignat per poder xatejar-hi.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
