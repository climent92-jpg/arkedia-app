import { AlertTriangle, Clock, MapPin, Music2, Users2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMySchedule, getMyStudentProfile } from "@/lib/student-data";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function AlumneAgendaPage() {
  const student = await getMyStudentProfile();

  if (!student) {
    return (
      <div>
        <PageHeader title="La meva agenda" />
        <NoStudentProfile />
      </div>
    );
  }

  const entries = await getMySchedule(student.id);

  return (
    <div>
      <PageHeader
        title={`Hola, ${student.firstName}! 👋`}
        description="Aquest és el teu horari de classes aquesta setmana."
      />

      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center gap-4 p-4 sm:p-5">
              <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-arkedia-blue-light py-2 text-arkedia-blue">
                <span className="text-[11px] font-bold uppercase">
                  {e.weekday.slice(0, 3)}
                </span>
                <span className="text-lg font-extrabold leading-tight">
                  {e.startTime.slice(0, 5)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Music2 className="size-4 text-arkedia-blue" />
                  <p className="truncate font-bold">{e.instrument}</p>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="size-3.5" />
                  {e.startTime.slice(0, 5)} – {e.endTime.slice(0, 5)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">
                    <Users2 className="size-3" />
                    {e.teacherFirstName} {e.teacherLastName}
                  </Badge>
                  <Badge>{e.modality}</Badge>
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

export function NoStudentProfile() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
        <AlertTriangle className="size-5 shrink-0" />
        <div>
          <p className="font-bold">El teu compte no té cap fitxa d&apos;alumne</p>
          <p className="mt-1">
            Demana a l&apos;administració que et vinculi a una fitxa
            d&apos;alumne des de &ldquo;Gestió d&apos;usuaris&rdquo;.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
