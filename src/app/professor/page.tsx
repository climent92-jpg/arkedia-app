import { AlertTriangle, Clock, MapPin, Music2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMySchedule, getMyTeacherProfile } from "@/lib/professor-data";
import type { DiaSetmana } from "@/types";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

const DIA_ORDER: DiaSetmana[] = [
  "Dilluns",
  "Dimarts",
  "Dimecres",
  "Dijous",
  "Divendres",
  "Dissabte",
];

export default async function ProfessorAgendaPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="La meva agenda" />
        <NoTeacherProfile />
      </div>
    );
  }

  const entries = (await getMySchedule(teacher.id)).sort(
    (a, b) =>
      DIA_ORDER.indexOf(a.weekday) - DIA_ORDER.indexOf(b.weekday) ||
      a.startTime.localeCompare(b.startTime)
  );

  const byDay = DIA_ORDER.map((dia) => ({
    dia,
    items: entries.filter((e) => e.weekday === dia),
  })).filter((d) => d.items.length > 0);

  return (
    <div>
      <PageHeader
        title="La meva agenda"
        description={`${entries.length} classes aquesta setmana`}
      />

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted">
            Encara no tens cap classe a l&apos;horari. Un administrador les pot
            assignar des de &ldquo;Gestió d&apos;usuaris&rdquo; o important un CSV.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {byDay.map(({ dia, items }) => (
            <div key={dia}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                {dia}
              </h2>
              <div className="flex flex-col gap-2.5">
                {items.map((e) => (
                  <Card key={e.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-arkedia-blue-light py-2 text-arkedia-blue">
                        <Clock className="size-3.5" />
                        <span className="text-sm font-extrabold leading-tight">
                          {e.startTime.slice(0, 5)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">
                          {e.studentFirstName} {e.studentLastName}
                        </p>
                        <p className="text-sm text-muted">{e.studentCourse}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge>
                            <Music2 className="size-3" />
                            {e.instrument}
                          </Badge>
                          <Badge variant="outline">{e.modality}</Badge>
                          {e.room && (
                            <Badge variant="outline">
                              <MapPin className="size-3" />
                              {e.room}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NoTeacherProfile() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
        <AlertTriangle className="size-5 shrink-0" />
        <div>
          <p className="font-bold">El teu compte no té cap fitxa de professor</p>
          <p className="mt-1">
            Demana a l&apos;administració que et vinculi a una fitxa de
            professor/a des de &ldquo;Gestió d&apos;usuaris&rdquo;.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
