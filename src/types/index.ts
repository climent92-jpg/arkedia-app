export type Instrument =
  | "Piano"
  | "Guitarra"
  | "Bateria"
  | "Cant"
  | "Violí"
  | "Baix"
  | "Ukelele"
  | "Llenguatge Musical";

export type Modalitat = "Individual" | "Parelles" | "Col·lectiva";

export type DiaSetmana =
  | "Dilluns"
  | "Dimarts"
  | "Dimecres"
  | "Dijous"
  | "Divendres"
  | "Dissabte";

export interface Teacher {
  id: string;
  nom: string;
  cognoms: string;
  email: string;
  instruments: Instrument[];
  avatarColor: string;
  bio?: string;
}

export interface Guardian {
  nom?: string;
  email?: string;
  telefon?: string;
}

export interface Student {
  id: string;
  nom: string;
  cognoms: string;
  curs: string; // ex: "5è EPRI", "1r ESO"
  pare?: Guardian;
  mare?: Guardian;
  teacherIds: string[];
}

export interface ScheduleEntry {
  id: string;
  dia: DiaSetmana;
  horaInici: string; // "16:30"
  horaFi: string; // "17:00"
  instrument: Instrument;
  modalitat: Modalitat;
  aula?: string;
  teacherId: string;
  studentIds: string[];
}

export interface Assignment {
  id: string;
  studentId: string;
  teacherId: string;
  titol: string;
  descripcio: string;
  dataAssignacio: string;
  dataLimit?: string;
  fet: boolean;
}

export interface Material {
  id: string;
  studentId: string;
  teacherId: string;
  tipus: "partitura" | "video" | "audio";
  titol: string;
  descripcio?: string;
  dataPujada: string;
  url: string;
  miniatura?: string;
}

export interface SubmittedVideo {
  id: string;
  studentId: string;
  teacherId: string;
  titol: string;
  dataPujada: string;
  url: string;
  miniatura?: string;
  comentariProfessor?: string;
  revisat: boolean;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  autor: "familia" | "professor";
  autorNom: string;
  text: string;
  data: string;
}

export interface ChatThread {
  id: string;
  studentId: string;
  teacherId: string;
  ultimMissatge: string;
  ultimaData: string;
  nonLlegits: number;
}

export interface Announcement {
  id: string;
  titol: string;
  cos: string;
  destinataris: "tothom" | "professors" | "families";
  data: string;
  autor: string;
}

export type UserRole = "familia" | "professor" | "admin";
