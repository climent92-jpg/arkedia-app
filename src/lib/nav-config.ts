import {
  CalendarDays,
  CheckSquare,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Megaphone,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Ruta base de cada rol. El rol tal com es desa a Supabase (public.users.role)
// es manté com a "familia" (no migrem l'enum de la base de dades), però
// l'aplicació ja no fa servir mai "/familia" com a URL: el portal de
// l'alumnat viu a "/alumne". Fes servir sempre ROLE_HOME en lloc de construir
// una ruta amb `/${role}`.
export const ROLE_HOME: Record<UserRole, string> = {
  familia: "/alumne",
  professor: "/professor",
  admin: "/admin",
};

export const navByRole: Record<UserRole, NavItem[]> = {
  familia: [
    { href: "/alumne/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/alumne/deures", label: "Deures", icon: CheckSquare },
    { href: "/alumne/material", label: "Material", icon: FolderOpen },
    { href: "/alumne/xat", label: "Xat", icon: MessageCircle },
  ],
  professor: [
    { href: "/professor", label: "Agenda", icon: CalendarDays },
    { href: "/professor/alumnes", label: "Alumnes", icon: Users },
    { href: "/professor/deures", label: "Deures", icon: CheckSquare },
    { href: "/professor/material", label: "Material", icon: FolderOpen },
    { href: "/professor/xat", label: "Xat", icon: MessageCircle },
  ],
  admin: [
    { href: "/admin", label: "Panell", icon: LayoutDashboard },
    { href: "/admin/importador", label: "Importador", icon: UploadCloud },
    { href: "/admin/horaris", label: "Horaris", icon: CalendarDays },
    { href: "/admin/usuaris", label: "Usuaris", icon: Users },
    { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
  ],
};

export const roleLabel: Record<UserRole, string> = {
  familia: "Alumne",
  professor: "Professor/a",
  admin: "Administració",
};
