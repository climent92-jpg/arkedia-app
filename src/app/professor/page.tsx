import { Clock, MapPin, Music2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_TEACHER_ID } from "@/lib/demo-session";
import { getStudentById, scheduleForTeacher } from "@/lib/mock-data";

const DIA_ORDER = [
  "Dilluns",
  "Dimarts",
  "Dimecres",
  "Dijous",
  "Divendres",
  "Dissabte",
] as const;

export default function ProfessorAgendaPage() {
  const entries = [...scheduleForTeacher(DEMO_TEACHER_ID)].sort(
    (a, b) =>
      DIA_ORDER.indexOf(a.dia) - DIA_ORDER.indexOf(b.dia) ||
      a.horaInici.localeCompare(b.horaInici)
  );

  const byDay = DIA_ORDER.map((dia) => ({
    dia,
    items: entries.filter((e) => e.dia === dia),
  })).filter((d) => d.items.length > 0);

  return (
    <div>
      <PageHeader
        title="La meva agenda"
        description={`${entries.length} classes aquesta setmana`}
      />

      <div className="flex flex-col gap-6">
        {byDay.map(({ dia, items }) => (
          <div key={dia}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
              {dia}
            </h2>
            <div className="flex flex-col gap-2.5">
              {items.map((e) => {
                const student = getStudentById(e.studentIds[0]);
                return (
                  <Card key={e.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-arkedia-blue-light py-2 text-arkedia-blue">
                        <Clock className="size-3.5" />
                        <span className="text-sm font-extrabold leading-tight">
                          {e.horaInici}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">
                          {student?.nom} {student?.cognoms}
                        </p>
                        <p className="text-sm text-muted">{student?.curs}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge>
                            <Music2 className="size-3" />
                            {e.instrument}
                          </Badge>
                          <Badge variant="outline">{e.modalitat}</Badge>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
