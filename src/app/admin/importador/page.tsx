"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  UploadCloud,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  REAL_SAMPLE_CSV,
  SAMPLE_CSV,
  detectColumnMapping,
  parseImportRows,
  type ImportedRow,
} from "@/lib/csv-import";

export default function AdminImportadorPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [imported, setImported] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    setImported(false);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const mapping = detectColumnMapping(headers);
        setRows(parseImportRows(results.data, mapping));
      },
    });
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arkedia-horaris-exemple.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadRealSample() {
    setFileName("horari-real-noelia.csv (exemple)");
    setImported(false);
    Papa.parse<Record<string, string>>(REAL_SAMPLE_CSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const mapping = detectColumnMapping(headers);
        setRows(parseImportRows(results.data, mapping));
      },
    });
  }

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  return (
    <div>
      <PageHeader
        title="Importador d'horaris"
        description="Puja el full de càlcul (CSV) d'un professor per generar els horaris i alumnes automàticament."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadSample}>
              <Download className="size-4" />
              Plantilla
            </Button>
            <Button variant="secondary" size="sm" onClick={loadRealSample}>
              <FileSpreadsheet className="size-4" />
              Provar amb dades reals
            </Button>
          </div>
        }
      />

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-arkedia-blue hover:bg-arkedia-blue-light/40">
        <UploadCloud className="size-9 text-arkedia-blue" />
        <p className="font-semibold">
          {fileName ? fileName : "Toca per seleccionar un fitxer CSV"}
        </p>
        <p className="text-xs text-muted">
          Exporta l&apos;Excel/Google Sheets del professor com a CSV i puja&apos;l aquí
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {rows.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="success">
              <CheckCircle2 className="size-3" />
              {validRows.length} files vàlides
            </Badge>
            {invalidRows.length > 0 && (
              <Badge variant="warning">
                <AlertTriangle className="size-3" />
                {invalidRows.length} amb errors
              </Badge>
            )}
          </div>

          <div className="mt-4 overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-black/[0.03] text-left text-xs font-bold uppercase text-muted">
                <tr>
                  <th className="px-3 py-2.5">Dia</th>
                  <th className="px-3 py-2.5">Horari</th>
                  <th className="px-3 py-2.5">Modalitat</th>
                  <th className="px-3 py-2.5">Alumne</th>
                  <th className="px-3 py-2.5">Curs</th>
                  <th className="px-3 py-2.5">Professor/a</th>
                  <th className="px-3 py-2.5">Contacte</th>
                  <th className="px-3 py-2.5">Estat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      i % 2 ? "bg-surface" : "bg-black/[0.015]"
                    }
                  >
                    <td className="px-3 py-2.5">{r.dia ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {r.horaInici && r.horaFi ? `${r.horaInici}–${r.horaFi}` : "—"}
                    </td>
                    <td className="px-3 py-2.5">{r.modalitat ?? "—"}</td>
                    <td className="px-3 py-2.5 font-medium">
                      {r.nom} {r.cognoms}
                    </td>
                    <td className="px-3 py-2.5">{r.curs || "—"}</td>
                    <td className="px-3 py-2.5">{r.professor || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {r.mailMare || r.mailPare || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.errors.length === 0 ? (
                        <Badge variant="success">OK</Badge>
                      ) : (
                        <Badge variant="warning" title={r.errors.join(", ")}>
                          {r.errors.length} error(s)
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button disabled={validRows.length === 0} onClick={() => setImported(true)}>
              <FileSpreadsheet className="size-4" />
              Importar {validRows.length} files
            </Button>
            {imported && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" />
                Importat correctament (demo)
              </span>
            )}
          </div>

          {imported && (
            <Card className="mt-4 border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 text-sm text-emerald-800">
                S&apos;han creat/actualitzat <strong>{validRows.length}</strong> classes,
                amb els alumnes i les dades de contacte corresponents. Un cop
                connectat Supabase, aquesta acció escriurà directament a les
                taules <code>students</code> i <code>schedules</code>.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
