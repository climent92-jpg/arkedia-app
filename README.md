# ARK#ÈDIA · App de gestió de l'escola de música

Aplicació web i PWA per a la gestió integral d'ARK#ÈDIA Escola de Música:
horaris, deures, partitures, vídeos i xat entre famílies, professorat i
administració.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** amb el tema visual d'ARK#ÈDIA (blau `#1E51A4`)
- **Lucide React** per a les icones
- **PWA**: instal·lable a mòbil i escriptori (`manifest.webmanifest` + service worker)
- **Supabase Auth**: login real per correu/contrasenya, obligatori per a
  tots els portals (sense sessió vàlida no es pot veure cap pantalla)

## Executar en local

```bash
npm install
npm run dev
```

Obre <http://localhost:3000> — et redirigirà a `/login`, on trobaràs el
formulari de login real: **no hi ha cap accés directe ni mode demo**. Per
entrar necessites un compte creat a Supabase Auth amb una fila corresponent
a `public.users` (vegeu
["Connectar Supabase"](#connectar-supabase-obligatori-per-iniciar-sessió) més
avall). Sense les variables d'entorn de Supabase configurades, el formulari
mostra un avís i no deixa iniciar sessió — i tampoc es pot accedir a cap
portal directament per URL, ja que el middleware (`src/proxy.ts`) redirigeix
`/familia`, `/professor` i `/admin` a `/login` sense sessió vàlida.

El **panell d'administració** (`/admin`, avisos inclosos) i el **portal de
professorat** (agenda, alumnes i material a `/professor`) ja llegeixen i
escriuen dades reals de Supabase, filtrades pel professor connectat. Només
el **portal de família** i `/professor/deures` i `/professor/xat` encara
mostren dades de mostra (`src/lib/mock-data.ts`) — connectar-los a les
taules reals és el següent pas natural.

Per provar-ho com a PWA al mòbil: obre l'adreça amb Chrome/Safari des del
mateix Wi-Fi que l'ordinador (`npm run dev -- -H 0.0.0.0` i usa la IP local)
i selecciona "Afegir a la pantalla d'inici".

## Estructura del projecte

```
src/
  app/
    page.tsx              Redirigeix a /login o al portal segons la sessió
    login/page.tsx          Formulari de login real (Supabase Auth)
    familia/               Portal de família (horari, deures, material, xat — mostra)
    professor/              Portal de professorat: agenda/alumnes/material (reals),
                              deures i xat (encara mostra)
    admin/                 Portal d'administració (panell, importador, usuaris, avisos)
    manifest.ts            Manifest de la PWA
  components/
    ui/                    Components base (botó, targeta, pestanyes, diàleg...)
    app-shell.tsx           Navegació (barra lateral a escriptori, barra inferior a mòbil)
    chat-thread.tsx          Xat família <-> professor
    video-player.tsx         Reproductor de vídeo
    upload-video.tsx          Pujada de vídeo de l'alumne
  lib/
    mock-data.ts            Dades de mostra (família i deures/xat de professor)
    admin-data.ts            Lectures reals de Supabase per al panell d'admin
    professor-data.ts         Lectures reals per al portal de professorat (amb RLS)
    csv-import.ts            Parseig del CSV (encara no escriu a la BD)
    supabase/                Clients de Supabase (navegador, servidor, middleware, admin)
    supabase/auth.ts          getCurrentProfile() / requireRole() / requireProfile()
    supabase/admin.ts         Client amb la service role key (només servidor)
  types/                    Tipus TypeScript compartits
  proxy.ts                  Middleware: protegeix /familia, /professor, /admin
  app/admin/usuaris/actions.ts       Server Actions: CRUD d'usuaris/professors/alumnes
  app/admin/avisos/actions.ts        Server Actions: CRUD d'avisos
  app/admin/importador/actions.ts    Server Action: importa el CSV a Supabase
  app/professor/material/actions.ts  Server Action: marcar un vídeo com a revisat
supabase/
  schema.sql                Esquema complet de la base de dades (SQL) + RLS d'admin
```

## Fases completades

1. **Estructura i tema visual** — Next.js + Tailwind, PWA, logotip ARK#ÈDIA.
2. **Base de dades** — esquema SQL a `supabase/schema.sql` (`users`,
   `teachers`, `students`, `schedules`, `assignments`, `materials`,
   `submitted_videos`, `messages`, `announcements`).
3. **Dades de mostra** — professorat i horaris reals de l'escola
   (Noelia, Griselda, Joana, Sol, Manel, Pablo, Dalibor, Marc).
4. **Portal de família** — horari, deures, partitures, vídeos del
   professor, pujada de vídeo propi i xat.
5. **Portal de professorat** — agenda, fitxa d'alumnes i material/revisió
   de vídeos **connectats a Supabase** (filtrats pel professor autenticat,
   amb pantalla buida real si no té classes/alumnes/material); deures i
   xat encara amb dades de mostra.
6. **Autenticació real i protecció de rutes** — login amb Supabase Auth
   (`src/components/login-form.tsx`), sense mode demo. El middleware
   (`src/proxy.ts` + `src/lib/supabase/middleware.ts`) i els layouts dels
   portals (`src/lib/supabase/auth.ts` → `requireRole()`) bloquegen l'accés
   a qui no tingui sessió vàlida o tingui un rol diferent del portal que
   visita.
7. **Panell d'administració 100% connectat a Supabase**:
   - **Gestió d'usuaris** (`/admin/usuaris`, tres pestanyes) — crear,
     editar i eliminar **usuaris**, **professors** i **alumnes** amb dades
     reals; canviar el `role` d'un usuari (`admin`/`professor`/`familia`)
     des de la web.
   - **Alta amb accés real**: en crear un professor o un alumne pots
     "Crear un compte nou" (genera l'usuari a Supabase Auth + la seva fila
     a `public.users` en el mateix pas i et mostra la contrasenya inicial
     un sol cop) o "Vincular a un usuari existent".
   - **Importador d'Excel/CSV connectat**: `/admin/importador` ja
     insereix els professors, alumnes i horaris que falten directament a
     Supabase (`student_teachers` i `schedules` inclosos), evitant
     duplicats si es torna a importar el mateix full.
   - **Panell i llistats sense dades fictícies**: `/admin`, `/admin/usuaris`
     i `/admin/avisos` només mostren el que hi ha realment a les taules
     `users`, `teachers`, `students` i `announcements`.
   - **Avisos i comunicats** (`/admin/avisos`) amb CRUD real (crear,
     editar i eliminar) sobre `public.announcements`.
   - Al formulari d'alumne pots **assignar-li un o diversos professors**
     (es desa a `student_teachers`), a banda de l'accés a la web.
8. **Portal de professorat connectat** — `/professor` (agenda),
   `/professor/alumnes` i `/professor/material` fan consultes reals amb el
   client autenticat normal (respecten RLS: un professor només veu les
   seves pròpies dades), i marquen un vídeo enviat com a revisat de debò
   (`src/app/professor/material/actions.ts`).

## Connectar Supabase (obligatori per iniciar sessió)

1. Crea un projecte a [supabase.com](https://supabase.com).
2. Al **SQL Editor** del projecte, enganxa i executa `supabase/schema.sql`.
3. A **Storage**, crea dos buckets: `materials` (partitures/vídeos del
   professor) i `submitted-videos` (vídeos dels alumnes).
4. Copia `.env.local.example` a `.env.local` i omple les tres variables (a
   Settings → API del projecte): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` i **`SUPABASE_SERVICE_ROLE_KEY`** (aquesta
   última és obligatòria perquè funcioni el panell d'administració — sense
   ella, `/admin` mostra un avís i no deixa crear ni importar res). A
   Vercel, afegeix-les a Project Settings → Environment Variables (marca
   `SUPABASE_SERVICE_ROLE_KEY` com a variable només de servidor, sense el
   prefix `NEXT_PUBLIC_`). Reinicia `npm run dev` / torna a desplegar
   perquè les llegeixi.
5. **Crea el primer usuari** (un administrador, per poder-hi entrar la
   primera vegada — els següents ja els podràs crear tu mateix des de
   `/admin/usuaris`):
   - A **Authentication → Users** del projecte, clica "Add user" i crea'l
     amb correu i contrasenya.
   - Copia el seu `UID`.
   - Al **SQL Editor**, insereix la seva fila de perfil:
     ```sql
     insert into public.users (id, role, full_name, email)
     values ('<UID copiat>', 'admin', 'Direcció ARK#ÈDIA', 'direccio@arkedia.cat');
     ```
     (usa `'familia'` o `'professor'` com a `role` per als altres tipus
     d'usuari). Sense aquesta fila, el login funciona però l'app no sap a
     quin portal enviar l'usuari i el bloqueja amb un avís.
6. Ja pots iniciar sessió a `http://localhost:3000/login` amb aquest compte
   — et portarà automàticament al portal que correspongui al seu `role`.
7. Ja pots gestionar l'escola des de `/admin/usuaris`: crear professors i
   alumnes, assignar-los professors, donar-los accés a la web (o
   vincular-los a un usuari existent), i canviar rols. Si inicies sessió
   com a `professor` i tens una fitxa vinculada amb alumnes assignats,
   `/professor` ja mostrarà la teva agenda, alumnes i material reals.
   **Següent pas**: connecta el portal de família i `/professor/deures` +
   `/professor/xat` (encara `src/lib/mock-data.ts`) amb `createClient()`
   de `src/lib/supabase/client.ts` (client) o `src/lib/supabase/server.ts`
   (Server Components).

## Gestió d'usuaris (`/admin/usuaris`)

Tres pestanyes amb CRUD complet sobre Supabase:

- **Usuaris** — tots els comptes de `public.users`, amb el seu `role`.
  Es pot crear un usuari nou (crea l'auth.users + la fila de perfil en un
  sol pas i mostra una contrasenya inicial), editar el nom/telèfon/**rol**,
  o eliminar-lo (elimina també el seu accés a Supabase Auth).
- **Professors** — dades de `public.teachers` (nom, instruments, bio). En
  crear-ne un pots triar "Sense accés", "Crear un compte nou" (correu +
  contrasenya, rol `professor`) o "Vincular a un usuari existent".
- **Alumnes** — dades de `public.students`, contactes de pare/mare, i el
  mateix mecanisme d'accés (rol `familia`) per a la família.

Totes les mutacions passen per Server Actions (`src/app/admin/usuaris/actions.ts`)
que primer comproven amb `requireAdminProfile()` que qui truca és realment
un admin autenticat, i després fan servir el client de la service role
(`src/lib/supabase/admin.ts`) per escriure sense limitacions de RLS.

## Importador d'horaris (Excel/CSV) → Supabase

A `/admin/importador` puges un CSV exportat des de l'Excel/Google Sheets de
cada professor. Reconeix automàticament columnes com *Dia*, *Interval
horari* (`16.30 a 17.00`), *Modalitat*, *Nom*, *Cognoms*, *Curs*,
*Professor* i els mails/telèfons de pare i mare (el botó **"Provar amb
dades reals"** carrega l'horari real de la Noelia com a exemple).

En prémer **"Importar"**, la Server Action `importScheduleRows`
(`src/app/admin/importador/actions.ts`):

1. Busca cada professor pel nom; si no existeix, en crea un de nou
   (sense instruments assignats — edita'l després a "Gestió d'usuaris").
2. Busca cada alumne per nom i cognoms; si no existeix, el crea amb el
   curs i els contactes del CSV.
3. Vincula alumne i professor a `student_teachers`.
4. Crea la classe a `schedules` — o la ignora si ja existia una classe
   idèntica (mateix professor, alumne, dia i hora), per poder re-importar
   el mateix full sense duplicar-ho tot.

L'instrument de cada classe s'agafa automàticament del professor quan
només en té un assignat; si en té diversos (o cap), queda com "Pendent
d'especificar" i cal ajustar-lo manualment.

## Avisos i comunicats (`/admin/avisos`)

CRUD complet sobre `public.announcements`: crear, editar i eliminar avisos,
amb destinataris (Tothom / Professorat / Famílies). Sense cap avís
d'exemple — la llista només mostra el que s'ha publicat de debò.

## Portal de professorat connectat (`/professor`)

`/professor` (agenda), `/professor/alumnes` i `/professor/material` ja no
fan servir `mock-data.ts`: consulten Supabase amb el client autenticat
normal (`src/lib/professor-data.ts`), filtrant sempre pel `teacher_id`
vinculat a l'usuari connectat. Per això calen les policies RLS
"..._select_teacher" de `supabase/schema.sql` — sense elles, un professor
no veuria res encara que la consulta ja filtri correctament.

- Si el compte del professor no té cap fila a `public.teachers` vinculada
  (`teachers.user_id`), les tres pàgines mostren un avís clar en lloc de
  dades falses.
- Si té fitxa però encara no té classes, alumnes o material assignats,
  mostren una pantalla buida real ("Encara no tens..."), mai els 11
  alumnes ficticis d'abans.
- A "Vídeos alumnes" (`/professor/material`), marcar un vídeo com a
  revisat i escriure-hi un comentari ja escriu a `public.submitted_videos`
  de debò. Pujar material nou des d'aquí encara no és possible — requereix
  connectar Supabase Storage, indicat com a properament a la pròpia pàgina.
- `/professor/deures` i `/professor/xat` **no** s'han tocat en aquesta
  ronda: continuen amb dades de mostra.
