import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getMyStudents, getMyTeacherProfile } from "@/lib/professor-data";
import { getThreadsForTeacher } from "@/lib/chat-data";
import { NoTeacherProfile } from "@/app/professor/page";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function ProfessorXatPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="Xat" />
        <NoTeacherProfile />
      </div>
    );
  }

  const students = await getMyStudents(teacher.id);
  const threads = await getThreadsForTeacher(teacher.id, students);

  return (
    <div>
      <PageHeader title="Xat" description="Converses amb les famílies." />

      <div className="flex flex-col gap-2.5">
        {threads.map((t) => (
          <Link key={t.id} href={`/professor/xat/${t.id}`}>
            <Card className="transition-colors hover:border-arkedia-blue">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arkedia-blue-light font-bold text-arkedia-blue">
                  {t.studentFirstName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    Família {t.studentLastName.split(" ")[0]}
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

        {threads.length === 0 && students.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no tens cap alumne assignat per poder xatejar-hi.
            </CardContent>
          </Card>
        )}

        {threads.length === 0 && students.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Tens {students.length} alumne{students.length === 1 ? "" : "s"} assignat
              {students.length === 1 ? "" : "s"}, però no s&apos;han pogut carregar les
              converses. Torna-ho a provar en uns segons.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
