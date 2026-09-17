-- ============================================================================
-- ARK#ÈDIA Escola de Música — Esquema de base de dades (Supabase / PostgreSQL)
-- ============================================================================
-- Com aplicar-lo:
--   1. Crea un projecte a https://supabase.com
--   2. Obre el SQL Editor del projecte
--   3. Enganxa aquest fitxer sencer i executa'l ("Run")
--
-- Tot el fitxer és idempotent: es pot re-executar sencer tantes vegades com
-- calgui (per exemple, després d'afegir-hi una secció nova) sense que doni
-- error de "ja existeix" ni dupliqui res.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS — perfil de cada persona que pot entrar a l'app.
--    S'enllaça 1:1 amb auth.users (Supabase Auth) mitjançant el mateix id.
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('familia', 'professor', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'familia',
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  avisos_last_seen_at timestamptz, -- darrer cop que ha obert /avisos (badge de notificació)
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
-- 4. SCHEDULES — horaris de classe (resultat de l'importador Excel/CSV o
--    de la creació manual des de /admin/horaris).
-- ----------------------------------------------------------------------------
do $$ begin
  create type weekday as enum (
    'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'
  );
exception
  when duplicate_object then null;
end $$;

-- Afegit després del llançament inicial: la graella setmanal d'horaris
-- (admin i professor) va de dilluns a diumenge.
alter type weekday add value if not exists 'Diumenge';

do $$ begin
  create type class_modality as enum ('Individual', 'Parelles', 'Col·lectiva');
exception
  when duplicate_object then null;
end $$;

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
  notes text, -- notes lliures sobre la franja horària (admin o professor)
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
  requires_video boolean not null default false, -- el professor demana un vídeo de resposta
  submission_video_path text, -- ex: "<student_id>/<uuid>-<filename>" al bucket submitted_videos
  submission_note text, -- nota opcional de l'alumne en entregar el vídeo
  submitted_at timestamptz,
  teacher_feedback text, -- correcció escrita del professor sobre el vídeo rebut
  feedback_at timestamptz, -- moment en què el professor ha enviat el feedback (i s'ha esborrat el vídeo)
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. MATERIALS — partitures (PDF) i vídeos/àudios que penja el professor.
--    Els fitxers es guarden a Supabase Storage; aquí es referencia el path.
--    student_id null = material general, visible per a tots els alumnes
--    d'aquest professor (vegeu la policy materials_select_family més avall).
-- ----------------------------------------------------------------------------
do $$ begin
  create type material_type as enum ('partitura', 'video', 'audio');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  type material_type not null,
  title text not null,
  description text,
  storage_path text not null, -- ex: "<teacher_id>/<uuid>-<filename>"
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. SUBMITTED_VIDEOS — vídeos que pengen alumnes/famílies perquè el
--    professor els revisi. teacher_id és el destinatari principal, però
--    QUALSEVOL professor assignat a l'alumne (student_teachers) el pot veure
--    i comentar (vegeu les policies "..._teacher" més avall).
-- ----------------------------------------------------------------------------
create table if not exists public.submitted_videos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete cascade, -- nul si l'alumne encara no té cap professor assignat
  title text not null,
  storage_path text not null, -- ex: "<student_id>/<uuid>-<filename>"
  student_note text, -- nota opcional de l'alumne en pujar el vídeo
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
  student_last_read_at timestamptz, -- darrer cop que la família ha obert aquest fil (badge de xat)
  teacher_last_read_at timestamptz, -- darrer cop que el professor ha obert aquest fil (badge de xat)
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
do $$ begin
  create type announcement_audience as enum ('tothom', 'professors', 'families');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users (id) on delete set null,
  title text not null,
  body text not null,
  audience announcement_audience not null default 'tothom',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Backfill de columnes.
--
-- "create table if not exists" NO afegeix columnes noves a una taula que ja
-- existia d'una execució anterior d'aquest fitxer (per exemple, si vas
-- aplicar una versió antiga de l'esquema abans que s'hi afegís alguna
-- columna). Aquests "add column if not exists" garanteixen que totes les
-- columnes esperades existeixin, tant si la taula és nova com si ja hi era.
-- ----------------------------------------------------------------------------
alter table public.users
  add column if not exists role user_role not null default 'familia',
  add column if not exists full_name text not null default '',
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists avisos_last_seen_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table public.teachers
  add column if not exists user_id uuid references public.users (id) on delete cascade,
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists email text,
  add column if not exists instruments text[] not null default '{}',
  add column if not exists bio text,
  add column if not exists created_at timestamptz not null default now();

alter table public.students
  add column if not exists family_user_id uuid references public.users (id) on delete set null,
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists course text,
  add column if not exists father_name text,
  add column if not exists father_email text,
  add column if not exists father_phone text,
  add column if not exists mother_name text,
  add column if not exists mother_email text,
  add column if not exists mother_phone text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

alter table public.schedules
  add column if not exists teacher_id uuid references public.teachers (id) on delete cascade,
  add column if not exists student_id uuid references public.students (id) on delete cascade,
  add column if not exists weekday weekday not null default 'Dilluns',
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists instrument text not null default '',
  add column if not exists modality class_modality not null default 'Individual',
  add column if not exists room text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

-- Un cop la columna existeix i totes les files ja tenen un valor, traiem el
-- valor per defecte: weekday sempre s'ha d'indicar explícitament (com a la
-- definició original de la taula), el default de dalt només era per poder
-- afegir la columna sense trencar files existents.
alter table public.schedules alter column weekday drop default;

alter table public.assignments
  add column if not exists student_id uuid references public.students (id) on delete cascade,
  add column if not exists teacher_id uuid references public.teachers (id) on delete cascade,
  add column if not exists title text not null default '',
  add column if not exists description text,
  add column if not exists assigned_at date not null default current_date,
  add column if not exists due_date date,
  add column if not exists done boolean not null default false,
  add column if not exists requires_video boolean not null default false,
  add column if not exists submission_video_path text,
  add column if not exists submission_note text,
  add column if not exists submitted_at timestamptz,
  add column if not exists teacher_feedback text,
  add column if not exists feedback_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table public.materials
  add column if not exists student_id uuid references public.students (id) on delete cascade,
  add column if not exists teacher_id uuid references public.teachers (id) on delete cascade,
  add column if not exists type material_type,
  add column if not exists title text not null default '',
  add column if not exists description text,
  add column if not exists storage_path text not null default '',
  add column if not exists created_at timestamptz not null default now();

alter table public.submitted_videos
  add column if not exists student_id uuid references public.students (id) on delete cascade,
  add column if not exists teacher_id uuid references public.teachers (id) on delete cascade,
  add column if not exists title text not null default '',
  add column if not exists storage_path text not null default '',
  add column if not exists student_note text,
  add column if not exists reviewed boolean not null default false,
  add column if not exists teacher_comment text,
  add column if not exists teacher_audio_comment_path text,
  add column if not exists created_at timestamptz not null default now();

-- Un alumne pot enviar un vídeo abans de tenir cap professor assignat
-- (l'admin l'hi assignarà més endavant); permetem teacher_id nul perquè la
-- pujada no quedi bloquejada. La policy "submitted_videos_select_teacher" ja
-- es basa en student_teachers, no en aquest camp, així que el vídeo
-- apareixerà igualment al professor en el moment en què se li assigni.
alter table public.submitted_videos alter column teacher_id drop not null;

alter table public.message_threads
  add column if not exists student_id uuid references public.students (id) on delete cascade,
  add column if not exists teacher_id uuid references public.teachers (id) on delete cascade,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists student_last_read_at timestamptz,
  add column if not exists teacher_last_read_at timestamptz;

alter table public.messages
  add column if not exists thread_id uuid references public.message_threads (id) on delete cascade,
  add column if not exists sender_id uuid references public.users (id) on delete cascade,
  add column if not exists body text not null default '',
  add column if not exists created_at timestamptz not null default now();

-- La columna que faltava i que va provocar l'error "Could not find the
-- 'audience' column of 'announcements'" si la taula ja existia d'abans.
alter table public.announcements
  add column if not exists author_id uuid references public.users (id) on delete set null,
  add column if not exists title text not null default '',
  add column if not exists body text not null default '',
  add column if not exists audience announcement_audience not null default 'tothom',
  add column if not exists created_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- Índexs útils
-- ----------------------------------------------------------------------------
create index if not exists idx_schedules_teacher on public.schedules (teacher_id);
create index if not exists idx_schedules_student on public.schedules (student_id);
create index if not exists idx_assignments_student on public.assignments (student_id);
create index if not exists idx_assignments_teacher on public.assignments (teacher_id);
create index if not exists idx_materials_student on public.materials (student_id);
create index if not exists idx_materials_teacher on public.materials (teacher_id);
create index if not exists idx_submitted_videos_teacher on public.submitted_videos (teacher_id);
create index if not exists idx_submitted_videos_student on public.submitted_videos (student_id);
create index if not exists idx_messages_thread on public.messages (thread_id);
create index if not exists idx_message_threads_student on public.message_threads (student_id);
create index if not exists idx_message_threads_teacher on public.message_threads (teacher_id);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.student_teachers enable row level security;
alter table public.schedules enable row level security;
alter table public.assignments enable row level security;
alter table public.materials enable row level security;
alter table public.submitted_videos enable row level security;
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.announcements enable row level security;

-- Un usuari sempre pot veure el seu propi perfil.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

-- Una família veu els seus fills; un professor veu els alumnes que té assignats.
drop policy if exists "students_select_family" on public.students;
create policy "students_select_family" on public.students
  for select using (family_user_id = auth.uid());

drop policy if exists "students_select_teacher" on public.students;
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

drop policy if exists "admin_all_users" on public.users;
create policy "admin_all_users" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_teachers" on public.teachers;
create policy "admin_all_teachers" on public.teachers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_students" on public.students;
create policy "admin_all_students" on public.students
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_student_teachers" on public.student_teachers;
create policy "admin_all_student_teachers" on public.student_teachers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_schedules" on public.schedules;
create policy "admin_all_schedules" on public.schedules
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_assignments" on public.assignments;
create policy "admin_all_assignments" on public.assignments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_materials" on public.materials;
create policy "admin_all_materials" on public.materials
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_submitted_videos" on public.submitted_videos;
create policy "admin_all_submitted_videos" on public.submitted_videos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_message_threads" on public.message_threads;
create policy "admin_all_message_threads" on public.message_threads
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_messages" on public.messages;
create policy "admin_all_messages" on public.messages
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_announcements" on public.announcements;
create policy "admin_all_announcements" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Accés del professorat a les seves pròpies dades (portal /professor).
-- Amb RLS activat, sense aquestes policies un professor no veuria res (ni
-- tan sols la seva pròpia fitxa), encara que la consulta filtri correctament.
-- ----------------------------------------------------------------------------
drop policy if exists "teachers_select_own" on public.teachers;
create policy "teachers_select_own" on public.teachers
  for select using (user_id = auth.uid());

drop policy if exists "student_teachers_select_teacher" on public.student_teachers;
create policy "student_teachers_select_teacher" on public.student_teachers
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = student_teachers.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "schedules_select_teacher" on public.schedules;
create policy "schedules_select_teacher" on public.schedules
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = schedules.teacher_id and t.user_id = auth.uid()
    )
  );

-- El professorat gestiona el seu propi horari des de /professor/horaris,
-- sense passar pel client d'administració (mateix criteri que assignments).
drop policy if exists "schedules_insert_teacher" on public.schedules;
create policy "schedules_insert_teacher" on public.schedules
  for insert with check (
    exists (
      select 1 from public.teachers t
      where t.id = schedules.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "schedules_update_teacher" on public.schedules;
create policy "schedules_update_teacher" on public.schedules
  for update using (
    exists (
      select 1 from public.teachers t
      where t.id = schedules.teacher_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.teachers t
      where t.id = schedules.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "schedules_delete_teacher" on public.schedules;
create policy "schedules_delete_teacher" on public.schedules
  for delete using (
    exists (
      select 1 from public.teachers t
      where t.id = schedules.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "materials_select_teacher" on public.materials;
create policy "materials_select_teacher" on public.materials
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = materials.teacher_id and t.user_id = auth.uid()
    )
  );

-- El professor puja el seu propi material.
drop policy if exists "materials_insert_teacher" on public.materials;
create policy "materials_insert_teacher" on public.materials
  for insert with check (
    exists (
      select 1 from public.teachers t
      where t.id = materials.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "materials_delete_teacher" on public.materials;
create policy "materials_delete_teacher" on public.materials
  for delete using (
    exists (
      select 1 from public.teachers t
      where t.id = materials.teacher_id and t.user_id = auth.uid()
    )
  );

-- Un vídeo enviat per un alumne l'ha de poder veure QUALSEVOL professor que
-- tingui aquest alumne assignat a student_teachers (no només el teacher_id
-- concret que es va desar en pujar-lo).
drop policy if exists "submitted_videos_select_teacher" on public.submitted_videos;
create policy "submitted_videos_select_teacher" on public.submitted_videos
  for select using (
    exists (
      select 1 from public.teachers t
      join public.student_teachers st on st.teacher_id = t.id
      where st.student_id = submitted_videos.student_id and t.user_id = auth.uid()
    )
  );

-- Perquè qualsevol dels seus professors pugui marcar-lo com a revisat i
-- deixar-hi un comentari (des de /professor/material).
drop policy if exists "submitted_videos_update_teacher" on public.submitted_videos;
create policy "submitted_videos_update_teacher" on public.submitted_videos
  for update using (
    exists (
      select 1 from public.teachers t
      join public.student_teachers st on st.teacher_id = t.id
      where st.student_id = submitted_videos.student_id and t.user_id = auth.uid()
    )
  );

-- Perquè qualsevol dels seus professors pugui eliminar un vídeo enviat
-- (per exemple si s'ha adreçat per error o ja no cal).
drop policy if exists "submitted_videos_delete_teacher" on public.submitted_videos;
create policy "submitted_videos_delete_teacher" on public.submitted_videos
  for delete using (
    exists (
      select 1 from public.teachers t
      join public.student_teachers st on st.teacher_id = t.id
      where st.student_id = submitted_videos.student_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "assignments_select_teacher" on public.assignments;
create policy "assignments_select_teacher" on public.assignments
  for select using (
    exists (
      select 1 from public.teachers t
      where t.id = assignments.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "assignments_insert_teacher" on public.assignments;
create policy "assignments_insert_teacher" on public.assignments
  for insert with check (
    exists (
      select 1 from public.teachers t
      where t.id = assignments.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "assignments_update_teacher" on public.assignments;
create policy "assignments_update_teacher" on public.assignments
  for update using (
    exists (
      select 1 from public.teachers t
      where t.id = assignments.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "assignments_delete_teacher" on public.assignments;
create policy "assignments_delete_teacher" on public.assignments
  for delete using (
    exists (
      select 1 from public.teachers t
      where t.id = assignments.teacher_id and t.user_id = auth.uid()
    )
  );

-- Avisos adreçats a "tothom" o específicament al professorat.
drop policy if exists "announcements_select_teacher" on public.announcements;
create policy "announcements_select_teacher" on public.announcements
  for select using (
    audience in ('tothom', 'professors')
    and exists (select 1 from public.teachers t where t.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Accés de la família/alumne a les seves pròpies dades (portal /alumne).
-- ----------------------------------------------------------------------------

-- Necessària perquè la família pugui veure el nom del professor a l'agenda,
-- al material i al xat (sense això, qualsevol "teachers(...)" incrustat en
-- una altra consulta tornaria buit per RLS, encara que la fila principal
-- (schedules, materials...) sí que es pogués llegir).
drop policy if exists "teachers_select_family" on public.teachers;
create policy "teachers_select_family" on public.teachers
  for select using (
    exists (
      select 1 from public.student_teachers st
      join public.students s on s.id = st.student_id
      where st.teacher_id = teachers.id and s.family_user_id = auth.uid()
    )
  );

drop policy if exists "student_teachers_select_family" on public.student_teachers;
create policy "student_teachers_select_family" on public.student_teachers
  for select using (
    exists (
      select 1 from public.students s
      where s.id = student_teachers.student_id and s.family_user_id = auth.uid()
    )
  );

drop policy if exists "schedules_select_family" on public.schedules;
create policy "schedules_select_family" on public.schedules
  for select using (
    exists (
      select 1 from public.students s
      where s.id = schedules.student_id and s.family_user_id = auth.uid()
    )
  );

drop policy if exists "assignments_select_family" on public.assignments;
create policy "assignments_select_family" on public.assignments
  for select using (
    exists (
      select 1 from public.students s
      where s.id = assignments.student_id and s.family_user_id = auth.uid()
    )
  );

-- Només perquè l'alumne pugui marcar un deure com a fet/pendent.
drop policy if exists "assignments_update_family" on public.assignments;
create policy "assignments_update_family" on public.assignments
  for update using (
    exists (
      select 1 from public.students s
      where s.id = assignments.student_id and s.family_user_id = auth.uid()
    )
  );

-- Un material és visible per a la família si és seu, o si és material
-- general (student_id null) d'un dels professors assignats al seu fill/a.
drop policy if exists "materials_select_family" on public.materials;
create policy "materials_select_family" on public.materials
  for select using (
    exists (
      select 1 from public.students s
      where s.id = materials.student_id and s.family_user_id = auth.uid()
    )
    or (
      materials.student_id is null
      and exists (
        select 1 from public.student_teachers st
        join public.students s on s.id = st.student_id
        where st.teacher_id = materials.teacher_id and s.family_user_id = auth.uid()
      )
    )
  );

drop policy if exists "submitted_videos_select_family" on public.submitted_videos;
create policy "submitted_videos_select_family" on public.submitted_videos
  for select using (
    exists (
      select 1 from public.students s
      where s.id = submitted_videos.student_id and s.family_user_id = auth.uid()
    )
  );

-- La família puja els vídeos del seu fill/a.
drop policy if exists "submitted_videos_insert_family" on public.submitted_videos;
create policy "submitted_videos_insert_family" on public.submitted_videos
  for insert with check (
    exists (
      select 1 from public.students s
      where s.id = submitted_videos.student_id and s.family_user_id = auth.uid()
    )
  );

-- L'alumne pot eliminar els seus propis vídeos enviats.
drop policy if exists "submitted_videos_delete_family" on public.submitted_videos;
create policy "submitted_videos_delete_family" on public.submitted_videos
  for delete using (
    exists (
      select 1 from public.students s
      where s.id = submitted_videos.student_id and s.family_user_id = auth.uid()
    )
  );

-- Avisos adreçats a "tothom" o específicament a les famílies.
drop policy if exists "announcements_select_family" on public.announcements;
create policy "announcements_select_family" on public.announcements
  for select using (
    audience in ('tothom', 'families')
    and exists (select 1 from public.students s where s.family_user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Xat (message_threads + messages): hi participen la família de l'alumne i
-- qualsevol dels seus professors.
-- ----------------------------------------------------------------------------
drop policy if exists "message_threads_select_participant" on public.message_threads;
create policy "message_threads_select_participant" on public.message_threads
  for select using (
    exists (
      select 1 from public.students s
      where s.id = message_threads.student_id and s.family_user_id = auth.uid()
    )
    or exists (
      select 1 from public.teachers t
      where t.id = message_threads.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "message_threads_insert_participant" on public.message_threads;
create policy "message_threads_insert_participant" on public.message_threads
  for insert with check (
    exists (
      select 1 from public.students s
      where s.id = message_threads.student_id and s.family_user_id = auth.uid()
    )
    or exists (
      select 1 from public.teachers t
      where t.id = message_threads.teacher_id and t.user_id = auth.uid()
    )
  );

-- Qualsevol de les dues bandes pot eliminar (buidar) la conversa; els seus
-- missatges s'esborren en cascada (messages.thread_id ... on delete cascade).
drop policy if exists "message_threads_delete_participant" on public.message_threads;
create policy "message_threads_delete_participant" on public.message_threads
  for delete using (
    exists (
      select 1 from public.students s
      where s.id = message_threads.student_id and s.family_user_id = auth.uid()
    )
    or exists (
      select 1 from public.teachers t
      where t.id = message_threads.teacher_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.message_threads mt
      left join public.students s on s.id = mt.student_id
      left join public.teachers t on t.id = mt.teacher_id
      where mt.id = messages.thread_id
        and (s.family_user_id = auth.uid() or t.user_id = auth.uid())
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.message_threads mt
      left join public.students s on s.id = mt.student_id
      left join public.teachers t on t.id = mt.teacher_id
      where mt.id = messages.thread_id
        and (s.family_user_id = auth.uid() or t.user_id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- Storage: buckets per a partitures/vídeos del professor i vídeos dels
-- alumnes. Privats (public = false): tot l'accés passa per les policies
-- d'aquí sota, no per una URL pública directa.
--
-- file_size_limit es fixa explícitament a 200 MB (209715200 bytes) perquè
-- no depengui del límit per defecte del projecte de Supabase (sovint més
-- baix): sense això, un vídeo gravat amb el mòbil pot rebutjar-se a
-- Storage encara que el codi de Next.js ja el pugi directament des del
-- navegador (mai passa per cap Server Action).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('materials', 'materials', false, 209715200)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

insert into storage.buckets (id, name, public, file_size_limit)
values ('submitted_videos', 'submitted_videos', false, 209715200)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Convenció de camins: "materials/<teacher_id>/<fitxer>" — el professor
-- propietari hi pot pujar i llegir; qui pugui veure la fila corresponent a
-- public.materials (família inclosa, via materials_select_family) també en
-- pot llegir l'arxiu.
drop policy if exists "materials_storage_insert_teacher" on storage.objects;
create policy "materials_storage_insert_teacher" on storage.objects
  for insert with check (
    bucket_id = 'materials'
    and exists (
      select 1 from public.teachers t
      where t.id::text = (storage.foldername(name))[1] and t.user_id = auth.uid()
    )
  );

drop policy if exists "materials_storage_delete_teacher" on storage.objects;
create policy "materials_storage_delete_teacher" on storage.objects
  for delete using (
    bucket_id = 'materials'
    and exists (
      select 1 from public.teachers t
      where t.id::text = (storage.foldername(name))[1] and t.user_id = auth.uid()
    )
  );

drop policy if exists "materials_storage_select_participant" on storage.objects;
create policy "materials_storage_select_participant" on storage.objects
  for select using (
    bucket_id = 'materials'
    and (
      public.is_admin()
      or exists (
        select 1 from public.teachers t
        where t.id::text = (storage.foldername(name))[1] and t.user_id = auth.uid()
      )
      or exists (
        select 1 from public.materials m
        where m.storage_path = name
          and (
            exists (
              select 1 from public.students s
              where s.id = m.student_id and s.family_user_id = auth.uid()
            )
            or (
              m.student_id is null
              and exists (
                select 1 from public.student_teachers st
                join public.students s on s.id = st.student_id
                where st.teacher_id = m.teacher_id and s.family_user_id = auth.uid()
              )
            )
          )
      )
    )
  );

-- Convenció de camins: "submitted_videos/<student_id>/<fitxer>" — la família
-- de l'alumne hi puja i en pot llegir; qualsevol professor assignat a
-- l'alumne (via student_teachers) també en pot llegir.
drop policy if exists "submitted_videos_storage_insert_family" on storage.objects;
create policy "submitted_videos_storage_insert_family" on storage.objects
  for insert with check (
    bucket_id = 'submitted_videos'
    and exists (
      select 1 from public.students s
      where s.id::text = (storage.foldername(name))[1] and s.family_user_id = auth.uid()
    )
  );

drop policy if exists "submitted_videos_storage_delete_participant" on storage.objects;
create policy "submitted_videos_storage_delete_participant" on storage.objects
  for delete using (
    bucket_id = 'submitted_videos'
    and (
      exists (
        select 1 from public.students s
        where s.id::text = (storage.foldername(name))[1] and s.family_user_id = auth.uid()
      )
      or exists (
        select 1 from public.teachers t
        join public.student_teachers st on st.teacher_id = t.id
        where st.student_id::text = (storage.foldername(name))[1] and t.user_id = auth.uid()
      )
    )
  );

drop policy if exists "submitted_videos_storage_select_participant" on storage.objects;
create policy "submitted_videos_storage_select_participant" on storage.objects
  for select using (
    bucket_id = 'submitted_videos'
    and (
      public.is_admin()
      or exists (
        select 1 from public.students s
        where s.id::text = (storage.foldername(name))[1] and s.family_user_id = auth.uid()
      )
      or exists (
        select 1 from public.teachers t
        join public.student_teachers st on st.teacher_id = t.id
        where st.student_id::text = (storage.foldername(name))[1] and t.user_id = auth.uid()
      )
    )
  );
