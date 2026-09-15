export type Instrument =
  | "Piano"
  | "Guitarra"
  | "Bateria"
  | "Cant"
  | "Violí"
  | "Baix"
  | "Ukelele"
  | "Saxòfon"
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


export type UserRole = "familia" | "professor" | "admin";

// ---------------------------------------------------------------------------
// Tipus de les taules reals de Supabase, tal com es fan servir al panell
// d'administració (independents dels tipus de dades de mostra de dalt).
// ---------------------------------------------------------------------------
export interface AdminUserRow {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export interface AdminTeacherRow {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  instruments: string[];
  bio: string | null;
  linkedUserEmail: string | null;
}

export interface AdminScheduleRow {
  id: string;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room: string | null;
}

export interface AdminAnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience: "tothom" | "professors" | "families";
  authorName: string | null;
  createdAt: string;
}

export interface AdminStudentRow {
  id: string;
  familyUserId: string | null;
  firstName: string;
  lastName: string;
  course: string | null;
  fatherName: string | null;
  fatherEmail: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  motherEmail: string | null;
  motherPhone: string | null;
  notes: string | null;
  linkedUserEmail: string | null;
  teacherIds: string[];
}

// ---------------------------------------------------------------------------
// Dades reals per al portal de professorat (/professor), llegides amb el
// client autenticat normal (RLS), filtrades pel professor connectat.
// ---------------------------------------------------------------------------
export interface MyTeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  instruments: string[];
}

export interface ProfessorScheduleRow {
  id: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room: string | null;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentCourse: string | null;
}

export interface ProfessorStudentRow {
  id: string;
  firstName: string;
  lastName: string;
  course: string | null;
  fatherName: string | null;
  fatherEmail: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  motherEmail: string | null;
  motherPhone: string | null;
}

export interface ProfessorMaterialRow {
  id: string;
  studentId: string | null;
  studentName: string | null;
  type: "partitura" | "video" | "audio";
  title: string;
  description: string | null;
  url: string | null;
  createdAt: string;
}

export interface ProfessorSubmittedVideoRow {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  studentNote: string | null;
  reviewed: boolean;
  teacherComment: string | null;
  url: string | null;
  createdAt: string;
}

export interface ProfessorAssignmentRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Dades reals per al portal de l'alumne (/alumne), llegides amb el client
// autenticat normal (RLS), filtrades per l'alumne/família connectat.
// ---------------------------------------------------------------------------
export interface MyStudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  course: string | null;
}

export interface StudentScheduleRow {
  id: string;
  weekday: DiaSetmana;
  startTime: string;
  endTime: string;
  instrument: string;
  modality: Modalitat;
  room: string | null;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
}

export interface StudentTeacherRow {
  id: string;
  firstName: string;
  lastName: string;
  instruments: string[];
}

export interface StudentAssignmentRow {
  id: string;
  title: string;
  description: string | null;
  teacherFirstName: string;
  dueDate: string | null;
  done: boolean;
}

export interface StudentMaterialRow {
  id: string;
  type: "partitura" | "video" | "audio";
  title: string;
  description: string | null;
  teacherFirstName: string;
  teacherLastName: string;
  url: string | null;
}

export interface StudentSubmittedVideoRow {
  id: string;
  title: string;
  studentNote: string | null;
  reviewed: boolean;
  teacherComment: string | null;
  url: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Xat (compartit entre /alumne/xat i /professor/xat).
// ---------------------------------------------------------------------------
export interface ChatThreadRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}
