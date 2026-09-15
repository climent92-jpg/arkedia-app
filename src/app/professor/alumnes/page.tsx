import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMySchedule, getMyStudents, getMyTeacherProfile } from "@/lib/professor-data";
import { NoTeacherProfile } from "@/app/professor/page";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

export default async function ProfessorAlumnesPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="Els meus alumnes" />
        <NoTeacherProfile />
      </div>
    );
  }

  const [alumnes, schedule] = await Promise.all([
    getMyStudents(teacher.id),
    getMySchedule(teacher.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Els meus alumnes"
        description={`${alumnes.length} alumnes assignats`}
      />

      <div className="flex flex-col gap-3">
        {alumnes.map((s) => {
          const classes = schedule.filter((e) => e.studentId === s.id);
          return (
            <Card key={s.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-sm text-muted">{s.course}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {classes.map((c) => (
                      <Badge key={c.id} variant="outline">
                        {c.weekday.slice(0, 3)} {c.startTime.slice(0, 5)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
                  {s.fatherName || s.fatherEmail || s.fatherPhone ? (
                    <ContactRow
                      label="Pare"
                      name={s.fatherName}
                      email={s.fatherEmail}
                      phone={s.fatherPhone}
                    />
                  ) : null}
                  {s.motherName || s.motherEmail || s.motherPhone ? (
                    <ContactRow
                      label="Mare"
                      name={s.motherName}
                      email={s.motherEmail}
                      phone={s.motherPhone}
                    />
                  ) : null}
                  {!s.fatherEmail && !s.fatherPhone && !s.motherEmail && !s.motherPhone && (
                    <p className="text-xs text-muted sm:col-span-2">
                      Contacte pendent d&apos;importar.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {alumnes.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no tens alumnes assignats. Un administrador te&apos;ls pot
              assignar des de &ldquo;Gestió d&apos;usuaris&rdquo;.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  label,
  name,
  email,
  phone,
}: {
  label: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}) {
  return (
    <div className="rounded-lg bg-black/[0.02] p-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      {name && <p className="text-sm font-semibold">{name}</p>}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 text-xs text-arkedia-blue"
        >
          <Mail className="size-3" />
          {email}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-xs text-muted">
          <Phone className="size-3" />
          {phone}
        </a>
      )}
    </div>
  );
}
