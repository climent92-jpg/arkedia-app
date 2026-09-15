import type { DiaSetmana, Modalitat } from "@/types";

export interface ImportedRow {
  raw: Record<string, string>;
  dia: DiaSetmana | null;
  horaInici: string | null;
  horaFi: string | null;
  modalitat: Modalitat | null;
  nom: string;
  cognoms: string;
  curs: string;
  mailPare: string;
  telefonPare: string;
  mailMare: string;
  telefonMare: string;
  professor: string;
  errors: string[];
}

const DAY_MAP: Record<string, DiaSetmana> = {
  dilluns: "Dilluns",
  dl: "Dilluns",
  dimarts: "Dimarts",
  dt: "Dimarts",
  dimecres: "Dimecres",
  dc: "Dimecres",
  dijous: "Dijous",
  dj: "Dijous",
  divendres: "Divendres",
  dv: "Divendres",
  dissabte: "Dissabte",
  ds: "Dissabte",
};

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function norm(s: string) {
  return stripAccents(s).toLowerCase().trim();
}

// Maps many possible header spellings (Catalan/Spanish, accents, spacing) to
// our internal field keys.
const HEADER_ALIASES: Record<string, keyof Omit<ImportedRow, "raw" | "errors">> = {
  dia: "dia",
  "interval horari": "horaInici",
  horari: "horaInici",
  hora: "horaInici",
  modalitat: "modalitat",
  nom: "nom",
  "nom alumne": "nom",
  cognoms: "cognoms",
  curs: "curs",
  "mail pare": "mailPare",
  "email pare": "mailPare",
  "correu pare": "mailPare",
  "telefon pare": "telefonPare",
  "mail mare": "mailMare",
  "email mare": "mailMare",
  "correu mare": "mailMare",
  "telefon mare": "telefonMare",
  professor: "professor",
  "professor/a": "professor",
  professora: "professor",
};

export function detectColumnMapping(headers: string[]) {
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const key = HEADER_ALIASES[norm(h)];
    if (key) mapping[h] = key;
  }
  return mapping;
}

function parseInterval(raw: string): { inici: string | null; fi: string | null } {
  if (!raw) return { inici: null, fi: null };
  const cleaned = raw.replace(/h/gi, ":").replace(/\./g, ":");
  const match = cleaned.match(
    /(\d{1,2})[:.]?(\d{2})?\s*(?:a|-|fins|to)\s*(\d{1,2})[:.]?(\d{2})?/i
  );
  if (!match) return { inici: null, fi: null };
  const [, h1, m1 = "00", h2, m2 = "00"] = match;
  return {
    inici: `${h1.padStart(2, "0")}:${m1}`,
    fi: `${h2.padStart(2, "0")}:${m2}`,
  };
}

function parseModalitat(raw: string): Modalitat | null {
  const n = norm(raw || "");
  if (!n) return "Individual"; // moltes graelles no indiquen modalitat -> individual per defecte
  if (n.includes("parell")) return "Parelles";
  if (n.includes("col")) return "Col·lectiva";
  if (n.includes("individual")) return "Individual";
  return null;
}

function parseDia(raw: string): DiaSetmana | null {
  return DAY_MAP[norm(raw || "")] ?? null;
}

export function parseImportRows(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): ImportedRow[] {
  return rows.map((row) => {
    const get = (field: string) => {
      const header = Object.keys(mapping).find((h) => mapping[h] === field);
      return header ? (row[header] ?? "").trim() : "";
    };

    const { inici, fi } = parseInterval(get("horaInici"));
    const errors: string[] = [];
    const dia = parseDia(get("dia"));
    const modalitat = parseModalitat(get("modalitat"));
    const nom = get("nom");
    const cognoms = get("cognoms");

    if (!dia) errors.push("Dia no reconegut");
    if (!inici || !fi) errors.push("Interval horari no reconegut");
    if (!modalitat) errors.push("Modalitat no reconeguda");
    if (!nom) errors.push("Falta el nom de l'alumne");

    return {
      raw: row,
      dia,
      horaInici: inici,
      horaFi: fi,
      modalitat,
      nom,
      cognoms,
      curs: get("curs"),
      mailPare: get("mailPare"),
      telefonPare: get("telefonPare"),
      mailMare: get("mailMare"),
      telefonMare: get("telefonMare"),
      professor: get("professor"),
      errors,
    };
  });
}

export const SAMPLE_CSV = `Dia,Interval horari,Modalitat,Nom,Cognoms,Curs,Professor,Mail pare,Telefon pare,Mail mare,Telefon mare
Dilluns,16.30 a 17.00,CLASSE INDIVIDUAL,Júlia,Roca Ferrer,5è EPRI,Noelia,jordi.roca@gmail.com,600111222,anna.ferrer@gmail.com,600111223
Dimarts,17.00 a 17.45,CLASSE PARELLES,Martí,Puigdemont Soler,1r ESO,Sol,david.puig@gmail.com,600222333,laia.soler@gmail.com,600222334
Dimecres,18.00 a 18.30,CLASSE INDIVIDUAL,Arnau,Vidal Camps,3r EPRI,Manel,,,marta.camps@gmail.com,600333444
`;

// Extret real de l'horari "HORARIS DE MÚSICA" d'ARK#ÈDIA (full de la
// professora Noelia) — sense modalitat ni contactes, tal com arriba
// habitualment del full de càlcul original.
export const REAL_SAMPLE_CSV = `Dia,Interval horari,Nom,Cognoms,Curs,Professor
DILLUNS,16.30 a 17.00,Mateo,Ramírez Alegría,5è EPRI,Noelia
DILLUNS,17.00 a 17.30,Toni,Fernández,6è EPRI,Noelia
DILLUNS,17.30 a 18.15,Eduard,Marin Ruiz,1r ESO,Noelia
DILLUNS,17.30 a 18.15,Enric,Marin Ruiz,3r ESO,Noelia
DIMARTS,09.00 a 09.30,Ignasi,Polo Navarro,5è EPRI,Noelia
DIMARTS,09.30 a 10.00,Axel,Triano Rincon,4t EPRI,Noelia
DIMARTS,10.00 a 10.30,Teo,Font Alonso,4t EPRI,Noelia
DIMECRES,09.00 a 09.30,Jordi,Bou Molins,4t EPRI,Noelia
DIMECRES,09.30 a 10.00,Teo,Ballester Hurtado,3r EPRI,Noelia
DIMECRES,10.00 a 10.30,Eduardo,Esteban Riaza,6è EPRI,Noelia
DIMECRES,10.30 a 11.00,Mathias,Veloz Chinea,2n EPRI,Noelia
`;
