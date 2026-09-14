import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_TEACHER_ID } from "@/lib/demo-session";
import { scheduleForTeacher, studentsForTeacher } from "@/lib/mock-data";

export default function ProfessorAlumnesPage() {
  const alumnes = studentsForTeacher(DEMO_TEACHER_ID);

  return (
    <div>
      <PageHeader
        title="Els meus alumnes"
        description={`${alumnes.length} alumnes assignats`}
      />

      <div className="flex flex-col gap-3">
        {alumnes.map((s) => {
          const classes = scheduleForTeacher(DEMO_TEACHER_ID).filter((e) =>
            e.studentIds.includes(s.id)
          );
          return (
            <Card key={s.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {s.nom} {s.cognoms}
                    </p>
                    <p className="text-sm text-muted">{s.curs}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {classes.map((c) => (
                      <Badge key={c.id} variant="outline">
                        {c.dia.slice(0, 3)} {c.horaInici}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
                  {s.pare && <ContactRow label="Pare" contact={s.pare} />}
                  {s.mare && <ContactRow label="Mare" contact={s.mare} />}
                  {!s.pare && !s.mare && (
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
              Encara no tens alumnes assignats.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ContactRow({
  label,
  contact,
}: {
  label: string;
  contact: { nom?: string; email?: string; telefon?: string };
}) {
  return (
    <div className="rounded-lg bg-black/[0.02] p-2.5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-sm font-semibold">{contact.nom}</p>
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-1.5 text-xs text-arkedia-blue"
        >
          <Mail className="size-3" />
          {contact.email}
        </a>
      )}
      {contact.telefon && (
        <a
          href={`tel:${contact.telefon}`}
          className="flex items-center gap-1.5 text-xs text-muted"
        >
          <Phone className="size-3" />
          {contact.telefon}
        </a>
      )}
    </div>
  );
}
