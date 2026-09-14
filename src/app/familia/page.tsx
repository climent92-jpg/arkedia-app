import { Clock, MapPin, Music2, Users2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import {
  getStudentById,
  getTeacherById,
  scheduleForStudent,
} from "@/lib/mock-data";

export default function FamiliaHorariPage() {
  const student = getStudentById(DEMO_STUDENT_ID)!;
  const entries = scheduleForStudent(DEMO_STUDENT_ID);

  return (
    <div>
      <PageHeader
        title={`Hola, ${student.nom}! 👋`}
        description="Aquest és el teu horari de classes aquesta setmana."
      />

      <div className="flex flex-col gap-3">
        {entries.map((e) => {
          const teacher = getTeacherById(e.teacherId)!;
          return (
            <Card key={e.id}>
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-arkedia-blue-light py-2 text-arkedia-blue">
                  <span className="text-[11px] font-bold uppercase">
                    {e.dia.slice(0, 3)}
                  </span>
                  <span className="text-lg font-extrabold leading-tight">
                    {e.horaInici}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Music2 className="size-4 text-arkedia-blue" />
                    <p className="truncate font-bold">{e.instrument}</p>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <Clock className="size-3.5" />
                    {e.horaInici} – {e.horaFi}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                      <Users2 className="size-3" />
                      {teacher.nom} {teacher.cognoms}
                    </Badge>
                    <Badge>{e.modalitat}</Badge>
                    {e.aula && (
                      <Badge variant="outline">
                        <MapPin className="size-3" />
                        {e.aula}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {entries.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha classes programades.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
