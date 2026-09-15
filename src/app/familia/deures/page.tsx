"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DEMO_STUDENT_ID } from "@/lib/demo-session";
import { assignmentsForStudent, getTeacherById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function FamiliaDeuresPage() {
  const initial = assignmentsForStudent(DEMO_STUDENT_ID);
  const [done, setDone] = useState<Record<string, boolean>>(
    Object.fromEntries(initial.map((a) => [a.id, a.fet]))
  );

  const pendents = initial.filter((a) => !done[a.id]);
  const fets = initial.filter((a) => done[a.id]);

  return (
    <div>
      <PageHeader
        title="Deures"
        description="El que cal practicar aquesta setmana."
      />

      <Section title={`Pendents (${pendents.length})`}>
        {pendents.map((a) => (
          <AssignmentCard
            key={a.id}
            titol={a.titol}
            descripcio={a.descripcio}
            professor={getTeacherById(a.teacherId)?.nom ?? ""}
            dataLimit={a.dataLimit}
            done={!!done[a.id]}
            onToggle={() => setDone((d) => ({ ...d, [a.id]: !d[a.id] }))}
          />
        ))}
        {pendents.length === 0 && (
          <EmptyRow text="Cap deure pendent, molt bé!" />
        )}
      </Section>

      <Section title={`Fets (${fets.length})`}>
        {fets.map((a) => (
          <AssignmentCard
            key={a.id}
            titol={a.titol}
            descripcio={a.descripcio}
            professor={getTeacherById(a.teacherId)?.nom ?? ""}
            dataLimit={a.dataLimit}
            done={!!done[a.id]}
            onToggle={() => setDone((d) => ({ ...d, [a.id]: !d[a.id] }))}
          />
        ))}
        {fets.length === 0 && <EmptyRow text="Encara no n'hi ha cap." />}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-sm text-muted">{text}</CardContent>
    </Card>
  );
}

function AssignmentCard({
  titol,
  descripcio,
  professor,
  dataLimit,
  done,
  onToggle,
}: {
  titol: string;
  descripcio: string;
  professor: string;
  dataLimit?: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className={cn(done && "bg-arkedia-blue-light/40")}>
      <CardContent className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          aria-label={done ? "Marcar com a pendent" : "Marcar com a fet"}
          className="mt-0.5 shrink-0 text-arkedia-blue"
        >
          {done ? (
            <CheckCircle2 className="size-6" />
          ) : (
            <Circle className="size-6 text-border" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold", done && "text-muted line-through")}>
            {titol}
          </p>
          <p className="mt-0.5 text-sm text-muted">{descripcio}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{professor}</Badge>
            {dataLimit && (
              <Badge variant="warning">
                <CalendarClock className="size-3" />
                fins {new Date(dataLimit).toLocaleDateString("ca-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
