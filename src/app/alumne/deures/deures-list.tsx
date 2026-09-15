"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleAssignmentDone } from "./actions";
import type { StudentAssignmentRow } from "@/types";

export function DeuresList({
  assignments,
}: {
  assignments: StudentAssignmentRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pendents = assignments.filter((a) => !a.done);
  const fets = assignments.filter((a) => a.done);

  function toggle(a: StudentAssignmentRow) {
    startTransition(async () => {
      const result = await toggleAssignmentDone(a.id, !a.done);
      if (!result.success) {
        alert(result.error ?? "No s'ha pogut desar.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Section title={`Pendents (${pendents.length})`}>
        {pendents.map((a) => (
          <AssignmentCard key={a.id} assignment={a} pending={pending} onToggle={() => toggle(a)} />
        ))}
        {pendents.length === 0 && <EmptyRow text="Cap deure pendent, molt bé!" />}
      </Section>

      <Section title={`Fets (${fets.length})`}>
        {fets.map((a) => (
          <AssignmentCard key={a.id} assignment={a} pending={pending} onToggle={() => toggle(a)} />
        ))}
        {fets.length === 0 && <EmptyRow text="Encara no n'hi ha cap." />}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
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
  assignment,
  pending,
  onToggle,
}: {
  assignment: StudentAssignmentRow;
  pending: boolean;
  onToggle: () => void;
}) {
  const { title, description, teacherFirstName, dueDate, done } = assignment;
  return (
    <Card className={cn(done && "bg-arkedia-blue-light/40")}>
      <CardContent className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          disabled={pending}
          aria-label={done ? "Marcar com a pendent" : "Marcar com a fet"}
          className="mt-0.5 shrink-0 text-arkedia-blue disabled:opacity-50"
        >
          {done ? (
            <CheckCircle2 className="size-6" />
          ) : (
            <Circle className="size-6 text-border" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("font-bold", done && "text-muted line-through")}>{title}</p>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {teacherFirstName && <Badge variant="outline">{teacherFirstName}</Badge>}
            {dueDate && (
              <Badge variant="warning">
                <CalendarClock className="size-3" />
                fins{" "}
                {new Date(dueDate).toLocaleDateString("ca-ES", {
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
