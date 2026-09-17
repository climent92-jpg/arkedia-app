import { Megaphone } from "lucide-react";
import { MarkAvisosSeen } from "@/components/mark-avisos-seen";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getMyAnnouncements, getMyTeacherProfile } from "@/lib/professor-data";
import { NoTeacherProfile } from "@/app/professor/page";

// Depèn de la sessió i de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

const AUDIENCE_LABEL = {
  tothom: "Tothom",
  professors: "Professorat",
  families: "Famílies",
} as const;

export default async function ProfessorAvisosPage() {
  const teacher = await getMyTeacherProfile();

  if (!teacher) {
    return (
      <div>
        <PageHeader title="Avisos" />
        <NoTeacherProfile />
      </div>
    );
  }

  const announcements = await getMyAnnouncements();

  return (
    <div>
      <MarkAvisosSeen />
      <PageHeader title="Avisos" description="Comunicats de l'administració." />

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-arkedia-blue-light text-arkedia-blue">
                <Megaphone className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{a.title}</p>
                  <Badge variant="outline">{AUDIENCE_LABEL[a.audience]}</Badge>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{a.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {new Date(a.createdAt).toLocaleDateString("ca-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {announcements.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha cap avís.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
