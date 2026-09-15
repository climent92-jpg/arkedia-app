import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_TEACHER_ID } from "@/lib/demo-session";
import { chatThreads, getStudentById } from "@/lib/mock-data";

export default function ProfessorXatPage() {
  const threads = chatThreads.filter((t) => t.teacherId === DEMO_TEACHER_ID);

  return (
    <div>
      <PageHeader title="Xat" description="Converses amb les famílies." />

      <div className="flex flex-col gap-2.5">
        {threads.map((t) => {
          const student = getStudentById(t.studentId);
          return (
            <Link key={t.id} href={`/professor/xat/${t.id}`}>
              <Card className="transition-colors hover:border-arkedia-blue">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arkedia-blue-light font-bold text-arkedia-blue">
                    {student?.nom[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold">
                        Família {student?.cognoms.split(" ")[0]}
                      </p>
                      {t.nonLlegits > 0 && (
                        <Badge className="bg-arkedia-accent text-white">
                          {t.nonLlegits}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted">{t.ultimMissatge}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {threads.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no tens cap conversa.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
