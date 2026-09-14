import Link from "next/link";
import {
  CalendarDays,
  GraduationCap,
  MessageCircle,
  Music4,
  UploadCloud,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { chatThreads, schedule, students, teachers } from "@/lib/mock-data";

export default function AdminPanellPage() {
  const stats = [
    { label: "Professors", value: teachers.length, icon: Music4 },
    { label: "Alumnes", value: students.length, icon: GraduationCap },
    { label: "Classes / setmana", value: schedule.length, icon: CalendarDays },
    { label: "Converses actives", value: chatThreads.length, icon: MessageCircle },
  ];

  return (
    <div>
      <PageHeader
        title="Panell de control"
        description="Visió general de l'escola ARK#ÈDIA."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <s.icon className="size-5 text-arkedia-blue" />
              <p className="mt-2 text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs font-semibold text-muted">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
        Professorat
      </h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {teachers.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: t.avatarColor }}
              >
                {t.nom[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {t.nom} {t.cognoms}
                </p>
                <p className="truncate text-xs text-muted">
                  {t.instruments.join(" · ")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link
        href="/admin/importador"
        className="mt-8 flex items-center gap-4 rounded-card border border-dashed border-arkedia-blue/40 bg-arkedia-blue-light/40 p-5 text-arkedia-blue hover:bg-arkedia-blue-light"
      >
        <UploadCloud className="size-8 shrink-0" />
        <div>
          <p className="font-bold">Importar horaris des d&apos;Excel/CSV</p>
          <p className="text-sm">
            Puja els fulls de càlcul dels professors i genera els horaris automàticament.
          </p>
        </div>
      </Link>
    </div>
  );
}
