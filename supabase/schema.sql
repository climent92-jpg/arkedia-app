-- ============================================================================
-- ARK#ÈDIA Escola de Música — Esquema de base de dades (Supabase / PostgreSQL)
-- ============================================================================
-- Com aplicar-lo:
--   1. Crea un projecte a https://supabase.com
--   2. Obre el SQL Editor del projecte
--   3. Enganxa aquest fitxer sencer i executa'l ("Run")
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS — perfil de cada persona que pot entrar a l'app.
--    S'enllaça 1:1 amb auth.users (Supabase Auth) mitjançant el mateix id.
-- ----------------------------------------------------------------------------
create type user_role as enum ('familia', 'professor', 'admin');

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'familia',
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. TEACHERS — dades específiques de professorat.
-- ----------------------------------------------------------------------------
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  instruments text[] not null default '{}',
  bio text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. STUDENTS — alumnes i dades de contacte de les famílies.
-- ----------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  family_user_id uuid references public.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  course text, -- ex: "5è EPRI", "1r ESO"
  father_name text,
  father_email text,
  father_phone text,
  mother_name text,
  mother_email text,
  mother_phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- Relació N:N alumne <-> professor (un alumne pot tenir més d'un professor)
create table if not exists public.student_teachers (
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  primary key (student_id, teacher_id)
);

-- ----------------------------------------------------------------------------
-- 4. SCHEDULES — horaris de classe (resultat de l'importador Excel/CSV).
-- ----------------------------------------------------------------------------
create type weekday as enum (
  'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'
);
create type class_modality as enum ('Individual', 'Parelles', 'Col·lectiva');

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  weekday weekday not null,
  start_time time not null,
  end_time time not null,
  instrument text not null,
  modality class_modality not null default 'Individual',
  room text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. ASSIGNMENTS — deures / tasques setmanals assignades per un professor.
-- ----------------------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  title text not null,
  description text,
  assigned_at date not null default current_date,
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. MATERIALS — partitures (PDF) i vídeos/àudios que penja el professor.
--    Els fitxers es guarden a Supabase Storage; aquí es referencia el path.
-- ----------------------------------------------------------------------------
create type material_type as enum ('partitura', 'video', 'audio');

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students (id) on delete cascade, -- null = material general del professor
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  type material_type not null,
  title text not null,
  description text,
  storage_path text not null, -- ex: "materials/<teacher_id>/<uuid>.pdf"
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. SUBMITTED_VIDEOS — vídeos que pengen alumnes/famílies perquè el
--    professor els revisi.
-- ----------------------------------------------------------------------------
create table if not exists public.submitted_videos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  title text not null,
  storage_path text not null,
  reviewed boolean not null default false,
  teacher_comment text,
  teacher_audio_comment_path text, -- nota de veu opcional
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. MESSAGES — xat entre família i professor (un fil per alumne+professor).
-- ----------------------------------------------------------------------------
create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. ANNOUNCEMENTS — avisos i comunicats de direcció/administració.
-- ----------------------------------------------------------------------------
create type announcement_audience as enum ('tothom', 'professors', 'families');

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users (id) on delete set null,
  title text not null,
  body text not null,
  audience announcement_audience not null default 'tothom',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Índexs útils
-- ----------------------------------------------------------------------------
create index if not exists idx_schedules_teacher on public.schedules (teacher_id);
create index if not exists idx_schedules_student on public.schedules (student_id);
create index if not exists idx_assignments_student on public.assignments (student_id);
create index if not exists idx_materials_student on public.materials (student_id);
create index if not exists idx_submitted_videos_teacher on public.submitted_videos (teacher_id);
create index if not exists idx_messages_thread on public.messages (thread_id);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS) — activa-la i defineix policies abans de producció.
-- Exemple orientatiu (ajusta segons el teu model d'autenticació):
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.schedules enable row level security;
alter table public.assignments enable row level security;
alter table public.materials enable row level security;
alter table public.submitted_videos enable row level security;
alter table public.messages enable row level security;
alter table public.announcements enable row level security;

-- Un usuari sempre pot veure el seu propi perfil.
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

-- Un professor veu els alumnes que té assignats; una família veu els seus fills.
create policy "students_select_family" on public.students
  for select using (family_user_id = auth.uid());

create policy "students_select_teacher" on public.students
  for select using (
    exists (
      select 1 from public.student_teachers st
      join public.teachers t on t.id = st.teacher_id
      where st.student_id = students.id and t.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Accés total per a administradors.
--
-- El panell d'administració (/admin) fa servir el client amb la service
-- role key (SUPABASE_SERVICE_ROLE_KEY), que es salta RLS del tot — així que
-- aquestes policies NO calen perquè el panell funcioni. Es defineixen igualment
-- com a defensa en profunditat, per si mai s'hi accedeix amb el client normal
-- (anon/authenticated) autenticat com a admin.
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.teachers enable row level security;
alter table public.student_teachers enable row level security;

create policy "admin_all_users" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_teachers" on public.teachers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_students" on public.students
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_student_teachers" on public.student_teachers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_schedules" on public.schedules
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_assignments" on public.assignments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_materials" on public.materials
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_submitted_videos" on public.submitted_videos
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_messages" on public.messages
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_all_announcements" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Accés del professorat a les seves pròpies dades (portal /professor).
-- Amb RLS activat, sense aquestes policies un professor no veuria res
-- (ni tan sols la seva pròpia fitxa), encara que la consulta filtri
-- correctament per teacher_id.
-- ----------------------------------------------------------------------------
create policy "teachers_select_own" on public.teachers
  for select using (user_id = auth.uid());

create policy "student_teachers_select_teacher" on public.student_teachers
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = student_teachers.teacher_id and t.user_id = auth.uid()
    )
  );

create policy "schedules_select_teacher" on public.schedules
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = schedules.teacher_id and t.user_id = auth.uid()
    )
  );

create policy "materials_select_teacher" on public.materials
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = materials.teacher_id and t.user_id = auth.uid()
    )
  );

create policy "submitted_videos_select_teacher" on public.submitted_videos
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = submitted_videos.teacher_id and t.user_id = auth.uid()
    )
  );

-- Perquè el professor pugui marcar un vídeo com a revisat i deixar-hi un
-- comentari (des de /professor/material).
create policy "submitted_videos_update_teacher" on public.submitted_videos
  for update using (
    exists (
      select 1 from public.teachers t
      where t.id = submitted_videos.teacher_id and t.user_id = auth.uid()
    )
  );
