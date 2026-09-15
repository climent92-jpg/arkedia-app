import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  GraduationCap,
  Music4,
  UploadCloud,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminStats, getAllTeachers } from "@/lib/admin-data";
import { isAdminConfigured } from "@/lib/supabase/config";

// Depèn de dades en viu de Supabase: no es pot prerenderitzar.
export const dynamic = "force-dynamic";

const AVATAR_COLORS = [
  "#1E51A4",
  "#7c3aed",
  "#e11d48",
  "#059669",
  "#d97706",
  "#0891b2",
  "#4338ca",
  "#be123c",
];

export default async function AdminPanellPage() {
  const configured = isAdminConfigured();

  if (!configured) {
    return (
      <div>
        <PageHeader
          title="Panell de control"
          description="Visió general de l'escola ARK#ÈDIA."
        />
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
            <AlertTriangle className="size-5 shrink-0" />
            <div>
              <p className="font-bold">Falta configurar la connexió d&apos;administració</p>
              <p className="mt-1">
                Defineix <code>SUPABASE_SERVICE_ROLE_KEY</code> a les variables
                d&apos;entorn perquè el panell pugui llegir dades reals de
                Supabase. Consulta el README.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [stats, teachers] = await Promise.all([getAdminStats(), getAllTeachers()]);

  const statCards = [
    { label: "Professors", value: stats.teachers, icon: Music4 },
    { label: "Alumnes", value: stats.students, icon: GraduationCap },
    { label: "Classes / setmana", value: stats.schedules, icon: CalendarDays },
    { label: "Usuaris totals", value: stats.users, icon: Users },
  ];

  return (
    <div>
      <PageHeader
        title="Panell de control"
        description="Visió general de l'escola ARK#ÈDIA — dades reals de Supabase."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
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
        {teachers.map((t, i) => (
          <Card key={t.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {t.firstName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {t.firstName} {t.lastName}
                </p>
                <p className="truncate text-xs text-muted">
                  {t.instruments.length > 0 ? t.instruments.join(" · ") : "Sense instrument assignat"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {teachers.length === 0 && (
          <Card className="sm:col-span-2">
            <CardContent className="p-6 text-center text-sm text-muted">
              Encara no hi ha professorat donat d&apos;alta.{" "}
              <Link href="/admin/usuaris" className="font-semibold text-arkedia-blue">
                Afegeix-ne un
              </Link>{" "}
              o importa&apos;ls des d&apos;un CSV.
            </CardContent>
          </Card>
        )}
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
