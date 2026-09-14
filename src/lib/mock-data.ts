import type {
  Announcement,
  Assignment,
  ChatMessage,
  ChatThread,
  Material,
  ScheduleEntry,
  Student,
  SubmittedVideo,
  Teacher,
} from "@/types";

// Professorat real d'ARK#ÈDIA (instruments segons l'horari de l'escola).
export const teachers: Teacher[] = [
  {
    id: "t-noelia",
    nom: "Noelia",
    cognoms: "Fernández",
    email: "noelia@arkedia.cat",
    instruments: ["Violí"],
    avatarColor: "#1E51A4",
  },
  {
    id: "t-griselda",
    nom: "Griselda",
    cognoms: "Puig",
    email: "griselda@arkedia.cat",
    instruments: ["Cant"],
    avatarColor: "#7c3aed",
  },
  {
    id: "t-joana",
    nom: "Joana",
    cognoms: "Martí",
    email: "joana@arkedia.cat",
    instruments: ["Piano"],
    avatarColor: "#e11d48",
  },
  {
    id: "t-sol",
    nom: "Sol",
    cognoms: "Ramírez",
    email: "sol@arkedia.cat",
    instruments: ["Piano", "Guitarra"],
    avatarColor: "#059669",
  },
  {
    id: "t-manel",
    nom: "Manel",
    cognoms: "Costa",
    email: "manel@arkedia.cat",
    instruments: ["Piano"],
    avatarColor: "#d97706",
  },
  {
    id: "t-pablo",
    nom: "Pablo",
    cognoms: "Serrano",
    email: "pablo@arkedia.cat",
    instruments: ["Guitarra"],
    avatarColor: "#0891b2",
  },
  {
    id: "t-dalibor",
    nom: "Dalibor",
    cognoms: "Novak",
    email: "dalibor@arkedia.cat",
    instruments: ["Guitarra"],
    avatarColor: "#4338ca",
  },
  {
    id: "t-marc",
    nom: "Marc",
    cognoms: "Vila",
    email: "marc@arkedia.cat",
    instruments: ["Bateria", "Piano"],
    avatarColor: "#be123c",
  },
];

// Alumnes i horaris reals extrets del full de càlcul "HORARIS DE MÚSICA"
// d'ARK#ÈDIA. Les dades de contacte de pare/mare no hi consten, així que
// s'importaran més endavant amb l'Importador d'Excel/CSV (Fase 5).
export const students: Student[] = [
  // --- Noelia (Violí) ---
  { id: "s-mateo-ramirez", nom: "Mateo", cognoms: "Ramírez Alegría", curs: "5è EPRI", teacherIds: ["t-noelia"] },
  { id: "s-toni-fernandez", nom: "Toni", cognoms: "Fernández", curs: "6è EPRI", teacherIds: ["t-noelia"] },
  { id: "s-eduard-marin", nom: "Eduard", cognoms: "Marin Ruiz", curs: "1r ESO", teacherIds: ["t-noelia"] },
  { id: "s-enric-marin", nom: "Enric", cognoms: "Marin Ruiz", curs: "3r ESO", teacherIds: ["t-noelia"] },
  { id: "s-ignasi-polo", nom: "Ignasi", cognoms: "Polo Navarro", curs: "5è EPRI", teacherIds: ["t-noelia"] },
  { id: "s-axel-triano", nom: "Axel", cognoms: "Triano Rincon", curs: "4t EPRI", teacherIds: ["t-noelia"] },
  { id: "s-teo-font", nom: "Teo", cognoms: "Font Alonso", curs: "4t EPRI", teacherIds: ["t-noelia"] },
  { id: "s-jordi-bou", nom: "Jordi", cognoms: "Bou Molins", curs: "4t EPRI", teacherIds: ["t-noelia"] },
  { id: "s-teo-ballester", nom: "Teo", cognoms: "Ballester Hurtado", curs: "3r EPRI", teacherIds: ["t-noelia"] },
  { id: "s-eduardo-esteban", nom: "Eduardo", cognoms: "Esteban Riaza", curs: "6è EPRI", teacherIds: ["t-noelia"] },
  { id: "s-mathias-veloz", nom: "Mathias", cognoms: "Veloz Chinea", curs: "2n EPRI", teacherIds: ["t-noelia"] },

  // --- Griselda (Cant) ---
  { id: "s-alvaro-gonzalez", nom: "Alvaro", cognoms: "Gonzalez Marcos", curs: "6è EPRI", teacherIds: ["t-griselda"] },
  { id: "s-carles-sucarrades", nom: "Carles", cognoms: "Sucarrades", curs: "5è EPRI", teacherIds: ["t-griselda"] },

  // --- Dalibor (Guitarra) ---
  { id: "s-pere-pifarre", nom: "Pere", cognoms: "Pifarré Villar", curs: "1r ESO", teacherIds: ["t-dalibor"] },
  { id: "s-leo-simon", nom: "Leo", cognoms: "Simon Carreras", curs: "6è EPRI", teacherIds: ["t-dalibor"] },
  { id: "s-nico-postrelov", nom: "Nico", cognoms: "Postrelov", curs: "6è EPRI", teacherIds: ["t-dalibor"] },
  { id: "s-alvaro-ramirez", nom: "Álvaro", cognoms: "Ramírez Alegría", curs: "6è EPRI", teacherIds: ["t-dalibor"] },

  // --- Manel (Piano) ---
  { id: "s-lucas-baro", nom: "Lucas", cognoms: "Baró Bonilla", curs: "5è EPRI", teacherIds: ["t-manel"] },
  { id: "s-thaigo-baro", nom: "Thaigo", cognoms: "Baró Bonilla", curs: "2n EPRI", teacherIds: ["t-manel"] },
  { id: "s-pablo-costa", nom: "Pablo", cognoms: "Costa Maldonado", curs: "3r EPRI", teacherIds: ["t-manel"] },

  // --- Marc (Bateria / Piano) ---
  { id: "s-guillermo-garriga", nom: "Guillermo", cognoms: "Garriga Rocabert", curs: "2n EPRI", teacherIds: ["t-marc"] },
  { id: "s-thomas-herranz", nom: "Thomas", cognoms: "Herranz Pettersen", curs: "3r EPRI", teacherIds: ["t-marc"] },
  { id: "s-jan-cornellana", nom: "Jan", cognoms: "Cornellana", curs: "6è EPRI", teacherIds: ["t-marc"] },

  // --- Joana (Piano) ---
  { id: "s-samuel-agustench", nom: "Samuel", cognoms: "Agustench Brao", curs: "4t EPRI", teacherIds: ["t-joana"] },
  { id: "s-nil-fabregat", nom: "NIL", cognoms: "Fabregat Sanchez", curs: "5è EPRI", teacherIds: ["t-joana"] },
  { id: "s-artemii-voronov", nom: "Artemii", cognoms: "Voronov", curs: "6è EPRI", teacherIds: ["t-joana"] },

  // --- Sol (Piano / Guitarra) ---
  { id: "s-tomas-garcia", nom: "Tomàs", cognoms: "Garcia Torrent", curs: "1r EPRI", teacherIds: ["t-sol"] },
  { id: "s-martin-sanchez", nom: "Martín", cognoms: "Sánchez Oller", curs: "1r EPRI", teacherIds: ["t-sol"] },
  { id: "s-carlota-sanchez", nom: "Carlota", cognoms: "Sánchez Oller", curs: "1r EPRI", teacherIds: ["t-sol"] },

  // --- Pablo (Guitarra) ---
  { id: "s-jaime-dawid", nom: "Jaime", cognoms: "Dawid Jimena", curs: "1r EPRI A", teacherIds: ["t-pablo"] },
  { id: "s-pere-bononad", nom: "Pere", cognoms: "Bononad", curs: "3r d'ESO A", teacherIds: ["t-pablo"] },
  { id: "s-enrico-maionchi", nom: "Enrico", cognoms: "Maionchi de Oliveira Califre", curs: "4t EPRI A", teacherIds: ["t-pablo"] },
];

export const schedule: ScheduleEntry[] = [
  // Noelia — Violí
  { id: "sch-noelia-1", dia: "Dilluns", horaInici: "16:30", horaFi: "17:00", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-mateo-ramirez"] },
  { id: "sch-noelia-2", dia: "Dilluns", horaInici: "17:00", horaFi: "17:30", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-toni-fernandez"] },
  { id: "sch-noelia-3", dia: "Dilluns", horaInici: "17:30", horaFi: "18:15", instrument: "Violí", modalitat: "Parelles", teacherId: "t-noelia", studentIds: ["s-eduard-marin", "s-enric-marin"] },
  { id: "sch-noelia-4", dia: "Dimarts", horaInici: "09:00", horaFi: "09:30", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-ignasi-polo"] },
  { id: "sch-noelia-5", dia: "Dimarts", horaInici: "09:30", horaFi: "10:00", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-axel-triano"] },
  { id: "sch-noelia-6", dia: "Dimarts", horaInici: "10:00", horaFi: "10:30", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-teo-font"] },
  { id: "sch-noelia-7", dia: "Dimecres", horaInici: "09:00", horaFi: "09:30", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-jordi-bou"] },
  { id: "sch-noelia-8", dia: "Dimecres", horaInici: "09:30", horaFi: "10:00", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-teo-ballester"] },
  { id: "sch-noelia-9", dia: "Dimecres", horaInici: "10:00", horaFi: "10:30", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-eduardo-esteban"] },
  { id: "sch-noelia-10", dia: "Dimecres", horaInici: "10:30", horaFi: "11:00", instrument: "Violí", modalitat: "Individual", teacherId: "t-noelia", studentIds: ["s-mathias-veloz"] },

  // Griselda — Cant
  { id: "sch-griselda-1", dia: "Dijous", horaInici: "10:10", horaFi: "10:55", instrument: "Cant", modalitat: "Col·lectiva", teacherId: "t-griselda", studentIds: ["s-alvaro-gonzalez", "s-carles-sucarrades"] },

  // Dalibor — Guitarra
  { id: "sch-dalibor-1", dia: "Dimarts", horaInici: "08:30", horaFi: "09:00", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-dalibor", studentIds: ["s-pere-pifarre"] },
  { id: "sch-dalibor-2", dia: "Dijous", horaInici: "08:30", horaFi: "09:00", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-dalibor", studentIds: ["s-leo-simon"] },
  { id: "sch-dalibor-3", dia: "Dijous", horaInici: "09:00", horaFi: "09:30", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-dalibor", studentIds: ["s-nico-postrelov"] },
  { id: "sch-dalibor-4", dia: "Dijous", horaInici: "10:30", horaFi: "11:00", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-dalibor", studentIds: ["s-alvaro-ramirez"] },

  // Manel — Piano
  { id: "sch-manel-1", dia: "Dimarts", horaInici: "08:25", horaFi: "08:55", instrument: "Piano", modalitat: "Individual", teacherId: "t-manel", studentIds: ["s-lucas-baro"] },
  { id: "sch-manel-2", dia: "Dimarts", horaInici: "08:55", horaFi: "09:25", instrument: "Piano", modalitat: "Individual", teacherId: "t-manel", studentIds: ["s-thaigo-baro"] },
  { id: "sch-manel-3", dia: "Dimarts", horaInici: "10:15", horaFi: "10:45", instrument: "Piano", modalitat: "Individual", teacherId: "t-manel", studentIds: ["s-pablo-costa"] },

  // Marc — Bateria / Piano
  { id: "sch-marc-1", dia: "Dimecres", horaInici: "08:25", horaFi: "08:55", instrument: "Bateria", modalitat: "Individual", teacherId: "t-marc", studentIds: ["s-guillermo-garriga"] },
  { id: "sch-marc-2", dia: "Dimecres", horaInici: "09:00", horaFi: "09:30", instrument: "Piano", modalitat: "Individual", teacherId: "t-marc", studentIds: ["s-thomas-herranz"] },
  { id: "sch-marc-3", dia: "Dimecres", horaInici: "14:00", horaFi: "14:30", instrument: "Bateria", modalitat: "Individual", teacherId: "t-marc", studentIds: ["s-jan-cornellana"] },

  // Joana — Piano
  { id: "sch-joana-1", dia: "Dimarts", horaInici: "08:30", horaFi: "09:00", instrument: "Piano", modalitat: "Individual", teacherId: "t-joana", studentIds: ["s-samuel-agustench"] },
  { id: "sch-joana-2", dia: "Dimarts", horaInici: "09:25", horaFi: "09:55", instrument: "Piano", modalitat: "Individual", teacherId: "t-joana", studentIds: ["s-nil-fabregat"] },
  { id: "sch-joana-3", dia: "Dimarts", horaInici: "09:55", horaFi: "10:25", instrument: "Piano", modalitat: "Individual", teacherId: "t-joana", studentIds: ["s-artemii-voronov"] },

  // Sol — Piano / Guitarra
  { id: "sch-sol-1", dia: "Dilluns", horaInici: "08:25", horaFi: "08:55", instrument: "Piano", modalitat: "Individual", teacherId: "t-sol", studentIds: ["s-tomas-garcia"] },
  { id: "sch-sol-2", dia: "Dimarts", horaInici: "16:30", horaFi: "17:00", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-sol", studentIds: ["s-martin-sanchez"] },
  { id: "sch-sol-3", dia: "Dimarts", horaInici: "17:00", horaFi: "17:30", instrument: "Piano", modalitat: "Individual", teacherId: "t-sol", studentIds: ["s-carlota-sanchez"] },

  // Pablo — Guitarra
  { id: "sch-pablo-1", dia: "Dilluns", horaInici: "13:15", horaFi: "13:45", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-pablo", studentIds: ["s-jaime-dawid"] },
  { id: "sch-pablo-2", dia: "Dilluns", horaInici: "13:45", horaFi: "14:30", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-pablo", studentIds: ["s-pere-bononad"] },
  { id: "sch-pablo-3", dia: "Dilluns", horaInici: "16:30", horaFi: "17:00", instrument: "Guitarra", modalitat: "Individual", teacherId: "t-pablo", studentIds: ["s-enrico-maionchi"] },
];

export const assignments: Assignment[] = [
  {
    id: "a-1",
    studentId: "s-mateo-ramirez",
    teacherId: "t-noelia",
    titol: "Escales de Sol i Re Major",
    descripcio: "Una octava, arc separat. Vigilar la posició del canell esquerre.",
    dataAssignacio: "2026-09-08",
    dataLimit: "2026-09-15",
    fet: false,
  },
  {
    id: "a-2",
    studentId: "s-mateo-ramirez",
    teacherId: "t-noelia",
    titol: "\"Twinkle Twinkle\" variacions 1 i 2",
    descripcio: "Mètode Suzuki, llibre 1. Practicar amb el metrònom a 80.",
    dataAssignacio: "2026-09-08",
    dataLimit: "2026-09-15",
    fet: true,
  },
  {
    id: "a-3",
    studentId: "s-toni-fernandez",
    teacherId: "t-noelia",
    titol: "Estudi núm. 5 - Wohlfahrt",
    descripcio: "Compassos 1 a 12, atenció a l'afinació dels dobles corda.",
    dataAssignacio: "2026-09-09",
    dataLimit: "2026-09-16",
    fet: false,
  },
  {
    id: "a-4",
    studentId: "s-eduard-marin",
    teacherId: "t-noelia",
    titol: "Duet amb l'Enric - primera veu",
    descripcio: "Assajar junts abans de la classe de parelles.",
    dataAssignacio: "2026-09-10",
    dataLimit: "2026-09-17",
    fet: false,
  },
];

export const materials: Material[] = [
  {
    id: "m-1",
    studentId: "s-mateo-ramirez",
    teacherId: "t-noelia",
    tipus: "partitura",
    titol: "Suzuki Llibre 1 - Twinkle Variacions",
    descripcio: "PDF amb la digitació marcada.",
    dataPujada: "2026-09-08",
    url: "#",
  },
  {
    id: "m-2",
    studentId: "s-mateo-ramirez",
    teacherId: "t-noelia",
    tipus: "video",
    titol: "Explicació de la posició de l'arc",
    descripcio: "Vídeo demostratiu de la Noelia.",
    dataPujada: "2026-09-08",
    url: "#",
  },
  {
    id: "m-3",
    studentId: "s-toni-fernandez",
    teacherId: "t-noelia",
    tipus: "partitura",
    titol: "Wohlfahrt - Estudi núm. 5",
    dataPujada: "2026-09-09",
    url: "#",
  },
  {
    id: "m-4",
    studentId: "s-toni-fernandez",
    teacherId: "t-noelia",
    tipus: "video",
    titol: "Com afinar els dobles corda",
    dataPujada: "2026-09-09",
    url: "#",
  },
];

export const submittedVideos: SubmittedVideo[] = [
  {
    id: "sv-1",
    studentId: "s-mateo-ramirez",
    teacherId: "t-noelia",
    titol: "Twinkle Twinkle - variació 1",
    dataPujada: "2026-09-12",
    url: "#",
    revisat: true,
    comentariProfessor: "Molt bé! Ara prova-ho una mica més lent i ben igualat.",
  },
  {
    id: "sv-2",
    studentId: "s-toni-fernandez",
    teacherId: "t-noelia",
    titol: "Estudi núm. 5 - intent 1",
    dataPujada: "2026-09-13",
    url: "#",
    revisat: false,
  },
];

export const chatThreads: ChatThread[] = [
  {
    id: "th-1",
    studentId: "s-mateo-ramirez",
    teacherId: "t-noelia",
    ultimMissatge: "Perfecte, gràcies per l'explicació!",
    ultimaData: "2026-09-13T18:22:00",
    nonLlegits: 0,
  },
  {
    id: "th-2",
    studentId: "s-toni-fernandez",
    teacherId: "t-noelia",
    ultimMissatge: "Demà portarà el violí nou per la classe.",
    ultimaData: "2026-09-14T09:05:00",
    nonLlegits: 2,
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: "cm-1",
    threadId: "th-1",
    autor: "professor",
    autorNom: "Noelia",
    text: "Hola! Us envio el vídeo amb l'explicació de la posició de l'arc d'aquesta setmana.",
    data: "2026-09-08T17:10:00",
  },
  {
    id: "cm-2",
    threadId: "th-1",
    autor: "familia",
    autorNom: "Família Ramírez Alegría",
    text: "Genial, moltes gràcies! Ho practicarem aquesta setmana.",
    data: "2026-09-08T19:40:00",
  },
  {
    id: "cm-3",
    threadId: "th-1",
    autor: "professor",
    autorNom: "Noelia",
    text: "Perfecte, gràcies per l'explicació!",
    data: "2026-09-13T18:22:00",
  },
];

export const announcements: Announcement[] = [
  {
    id: "an-1",
    titol: "Audició de Nadal",
    cos: "L'audició de Nadal serà el 18 de desembre a les 18:00 a la sala principal. Us hi esperem a tots!",
    destinataris: "tothom",
    data: "2026-09-10",
    autor: "Direcció ARK#ÈDIA",
  },
  {
    id: "an-2",
    titol: "Canvi d'horari - setmana del 22 de setembre",
    cos: "Per festivitat local, les classes de dilluns es traslladen a dimarts la mateixa setmana.",
    destinataris: "families",
    data: "2026-09-12",
    autor: "Secretaria",
  },
];

export function getTeacherById(id: string) {
  return teachers.find((t) => t.id === id);
}

export function getStudentById(id: string) {
  return students.find((s) => s.id === id);
}

export function studentsForTeacher(teacherId: string) {
  return students.filter((s) => s.teacherIds.includes(teacherId));
}

export function scheduleForTeacher(teacherId: string) {
  return schedule.filter((s) => s.teacherId === teacherId);
}

export function scheduleForStudent(studentId: string) {
  return schedule.filter((s) => s.studentIds.includes(studentId));
}

export function assignmentsForStudent(studentId: string) {
  return assignments.filter((a) => a.studentId === studentId);
}

export function materialsForStudent(studentId: string) {
  return materials.filter((m) => m.studentId === studentId);
}
