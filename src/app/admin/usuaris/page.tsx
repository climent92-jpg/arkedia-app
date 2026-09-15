"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Mail } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { students, teachers } from "@/lib/mock-data";

function generatePassword(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const suffix = (hash % 9000) + 1000;
  const namePart = seed.split("@")[0].split(".")[0];
  const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1, 4);
  return `${capitalized}${suffix}!`;
}

interface Row {
  id: string;
  nom: string;
  email: string;
  rol: "Professor/a" | "Família";
}

export default function AdminUsuarisPage() {
  const teacherRows: Row[] = teachers.map((t) => ({
    id: t.id,
    nom: `${t.nom} ${t.cognoms}`,
    email: t.email,
    rol: "Professor/a",
  }));

  const familyRows: Row[] = students.flatMap((s) => {
    const contacts: Row[] = [];
    if (s.mare?.email) {
      contacts.push({
        id: `${s.id}-mare`,
        nom: `${s.mare.nom} (mare de ${s.nom})`,
        email: s.mare.email,
        rol: "Família",
      });
    } else if (s.pare?.email) {
      contacts.push({
        id: `${s.id}-pare`,
        nom: `${s.pare.nom} (pare de ${s.nom})`,
        email: s.pare.email,
        rol: "Família",
      });
    }
    return contacts;
  });

  return (
    <div>
      <PageHeader
        title="Usuaris"
        description="Credencials generades automàticament a partir del correu electrònic."
      />

      <Section title="Professorat" rows={teacherRows} />
      <Section title="Famílies" rows={familyRows} />
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
        {title} ({rows.length})
      </h2>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <UserRow key={r.id} row={r} />
        ))}
      </div>
    </div>
  );
}

function UserRow({ row }: { row: Row }) {
  const [copied, setCopied] = useState(false);
  const password = generatePassword(row.email);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{row.nom}</p>
            <Badge variant={row.rol === "Professor/a" ? "default" : "outline"}>
              {row.rol}
            </Badge>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Mail className="size-3" />
            {row.email}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-2 self-start sm:self-auto">
          <KeyRound className="size-4 text-arkedia-blue" />
          <code className="text-sm font-semibold">{password}</code>
          <button
            onClick={copy}
            className="text-muted hover:text-arkedia-blue"
            aria-label="Copiar contrasenya"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
