# ARK#ÈDIA · App de gestió de l'escola de música

Aplicació web i PWA per a la gestió integral d'ARK#ÈDIA Escola de Música:
horaris, deures, partitures, vídeos i xat entre alumnat, professorat i
administració. **100% connectada a Supabase — sense dades de mostra.**

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** amb el tema visual d'ARK#ÈDIA (blau `#1E51A4`)
- **Lucide React** per a les icones
- **PWA**: instal·lable a mòbil i escriptori (`manifest.webmanifest` + service worker)
- **Supabase Auth**: login real per correu/contrasenya, obligatori per a
  tots els portals (sense sessió vàlida no es pot veure cap pantalla)
- **Supabase Postgres + RLS**: totes les taules amb Row Level Security,
  cada rol només veu les seves pròpies dades
- **Supabase Storage**: pujada real de partitures/vídeos del professor i
  vídeos dels alumnes (buckets privats)

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
`/alumne`, `/professor` i `/admin` a `/login` sense sessió vàlida.

**Regla d'or de tota l'aplicació**: si no hi ha dades a Supabase per a un
alumne o professor concret, la pantalla mostra un estat buit real ("Sense
classes assignades", "Encara no tens cap deure...") — mai dades de mostra.
No queda cap importació de `mock-data.ts` ni `demo-session.ts` enlloc del
codi (aquests fitxers ja no existeixen al repositori).

Per provar-ho com a PWA al mòbil: obre l'adreça amb Chrome/Safari des del
mateix Wi-Fi que l'ordinador (`npm run dev -- -H 0.0.0.0` i usa la IP local)
i selecciona "Afegir a la pantalla d'inici".

## Portals

### Alumne (`/alumne`)

El perfil de l'alumne es resol per `auth.uid()` contra `public.students`
(`family_user_id`). Amb sessió vàlida i fitxa d'alumne vinculada:

- **Agenda** (`/alumne/agenda`) — només els horaris reals de `schedules`
  de l'alumne, amb el nom del professor de cada classe.
- **Deures** (`/alumne/deures`) — només els deures de `assignments`
  assignats a aquest alumne; es pot marcar cada un com a fet.
- **Material** (`/alumne/material`) — les partitures/vídeos/àudios que el
  seu professor li ha penjat (o ha penjat per a tots els seus alumnes), més
  els seus propis vídeos enviats i el seu estat de revisió; permet pujar un
  vídeo nou (Storage) amb una nota per al professor.
- **Xat** (`/alumne/xat`) — un fil per professor assignat, amb missatges
  reals de `messages`/`message_threads`.

Si el compte no té cap fila vinculada a `public.students`, totes les
pàgines mostren un avís clar en lloc de qualsevol dada.

### Professorat (`/professor`)

Igual que l'alumne, però resolt via `public.teachers.user_id`:

- **Agenda** — horaris reals filtrats pel professor connectat.
- **Alumnes** (`/professor/alumnes`) — fitxes dels alumnes que té
  assignats a `student_teachers`.
- **Deures** (`/professor/deures`) — assigna deures nous (formulari
  Alumne + Títol + Descripció + Data límit) i veu els que ja ha assignat.
- **Material** (`/professor/material`) — dues pestanyes:
  - *Material penjat*: puja partitures/vídeos/àudios reals a Supabase
    Storage (bucket `materials`), triant si són per a **un alumne concret**
    o per a **tots els seus alumnes** (visible automàticament a
    `/alumne/material` de cadascun).
  - *Vídeos alumnes*: mostra els vídeos enviats per **tots** els alumnes
    assignats — encara que el vídeo s'hagi adreçat a un altre dels seus
    professors, qualsevol professor de l'alumne el pot veure, reproduir i
    comentar. Marcar-lo com a revisat escriu de debò a
    `public.submitted_videos`.
- **Xat** (`/professor/xat`) — un fil per alumne assignat.

### Administració (`/admin`)

- **Panell** (`/admin`) — comptadors reals (professors, alumnes, classes,
  usuaris).
- **Horaris** (`/admin/horaris`) — creació manual d'una classe individual
  triant Professor, Alumne, Dia, Hora d'inici/fi, Instrument i Modalitat;
  llista i eliminació de classes existents a `schedules`.
- **Usuaris** (`/admin/usuaris`, tres pestanyes) — CRUD complet
  d'**usuaris**, **professors** i **alumnes**, incloent-hi l'edició real
  (no cal eliminar per corregir un alumne o canviar-li els professors
  assignats a `student_teachers`). En crear un compte nou es mostra un
  **diàleg modal** amb la contrasenya temporal i un botó per copiar-la.
- **Importador** (`/admin/importador`) — puja un CSV/Excel d'horaris i
  l'insereix a Supabase (professors, alumnes, `student_teachers` i
  `schedules`), evitant duplicats en reimportar.
- **Avisos** (`/admin/avisos`) — CRUD real sobre `public.announcements`,
  amb el destinatari (`tothom` / `professors` / `families`) desat a la
  columna `audience`.

## Regles de visibilitat creuada

- **Vídeos dels alumnes**: quan un alumne puja un vídeo, **tots** els
  professors que té assignats via `student_teachers` el veuen a la seva
  pestanya "Vídeos alumnes", encara que el vídeo s'hagi adreçat només a un
  d'ells.
- **Material del professorat**: quan un professor puja material marcat com
  a "Tots els meus alumnes" (`student_id` nul), **tots** els alumnes que té
  assignats el veuen i el poden descarregar immediatament des del seu
  portal.

Aquestes regles es fan complir a dos nivells: a les consultes de
`src/lib/professor-data.ts` / `src/lib/student-data.ts`, i — de manera
independent i obligatòria — a les policies RLS de `supabase/schema.sql`
(`submitted_videos_select_teacher`, `materials_select_family`, etc.), de
manera que cap client pot saltar-se-les encara que hi hagi un error a la
consulta.

## Estructura del projecte

```
src/
  app/
    page.tsx              Redirigeix a /login o al portal segons la sessió (ROLE_HOME)
    login/page.tsx          Formulari de login real (Supabase Auth)
    alumne/                 Portal de l'alumne: agenda, deures, material, xat (tot real)
    professor/              Portal de professorat: agenda, alumnes, deures, material, xat (tot real)
    admin/                 Portal d'administració (panell, horaris, importador, usuaris, avisos)
    manifest.ts            Manifest de la PWA
  components/
    ui/                    Components base (botó, targeta, pestanyes, diàleg...)
    app-shell.tsx           Navegació (barra lateral a escriptori, barra inferior a mòbil)
    chat-thread.tsx          Xat alumne <-> professor (Server Action sendMessage)
    video-player.tsx         Reproductor de vídeo
    upload-video.tsx          Pujada de vídeo de l'alumne a Storage
  lib/
    admin-data.ts            Lectures reals de Supabase per al panell d'admin
    professor-data.ts         Lectures reals per al portal de professorat (amb RLS)
    student-data.ts           Lectures reals per al portal de l'alumne (amb RLS)
    chat-data.ts / chat-actions.ts   Fils i missatges de xat compartits
    storage-upload.ts          Pujada de fitxers des del navegador (client)
    storage-signed-url.ts       URLs signades per llegir fitxers privats (servidor)
    csv-import.ts             Parseig del CSV
    supabase/                Clients de Supabase (navegador, servidor, middleware, admin)
    supabase/auth.ts          getCurrentProfile() / requireRole() / requireProfile()
    supabase/admin.ts         Client amb la service role key (només servidor)
    nav-config.ts             ROLE_HOME i navegació per rol
  types/                    Tipus TypeScript compartits
  proxy.ts                  Middleware: protegeix /alumne, /professor, /admin
supabase/
  schema.sql                Esquema complet (idempotent): taules, RLS, Storage i policies
```

## Connectar Supabase (obligatori per iniciar sessió)

1. Crea un projecte a [supabase.com](https://supabase.com).
2. Al **SQL Editor** del projecte, enganxa i executa `supabase/schema.sql`.
   És idempotent: el pots tornar a executar sencer sobre una base de dades
   ja existent (afegeix columnes/policies que faltin sense trencar res ni
   duplicar dades) si actualitzes l'esquema més endavant.
3. Aquest mateix script crea els buckets de Storage (`materials` i
   `submitted-videos`, privats) i les seves policies — no cal crear-los a
   mà des del panell de Storage.
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
     (usa `'familia'` per a l'alumnat o `'professor'` per al professorat com
     a `role` per als altres tipus d'usuari — el valor a la base de dades
     continua sent `'familia'` encara que la URL del portal sigui
     `/alumne`). Sense aquesta fila, el login funciona però l'app no sap a
     quin portal enviar l'usuari i el bloqueja amb un avís.
6. Ja pots iniciar sessió a `http://localhost:3000/login` amb aquest compte
   — et portarà automàticament al portal que correspongui al seu `role`.
7. Des de `/admin/usuaris` pots crear professors i alumnes, assignar-los
   entre ells, donar-los accés a la web (o vincular-los a un usuari
   existent), i des de `/admin/horaris` crear-los les primeres classes.
   A partir d'aquí cada rol ja veu únicament les seves pròpies dades reals.

## Gestió d'usuaris (`/admin/usuaris`)

Tres pestanyes amb CRUD complet sobre Supabase, totes amb edició real (mai
cal eliminar i tornar a crear per corregir una dada):

- **Usuaris** — tots els comptes de `public.users`, amb el seu `role`. Es
  pot crear un usuari nou (crea l'auth.users + la fila de perfil en un sol
  pas i mostra un diàleg amb la contrasenya inicial per copiar), editar el
  nom/telèfon/**rol**, o eliminar-lo (elimina també el seu accés a Supabase
  Auth).
- **Professors** — dades de `public.teachers` (nom, instruments, bio). En
  crear-ne un pots triar "Sense accés", "Crear un compte nou" (correu +
  contrasenya, rol `professor`) o "Vincular a un usuari existent".
- **Alumnes** — dades de `public.students`, contactes de pare/mare, i els
  professors assignats (`student_teachers`, editables en qualsevol moment
  des del mateix formulari), més el mateix mecanisme d'accés (rol
  `familia`) per a l'alumne/família.

Totes les mutacions passen per Server Actions (`src/app/admin/usuaris/actions.ts`)
que primer comproven amb `requireAdminProfile()` que qui truca és realment
un admin autenticat, i després fan servir el client de la service role
(`src/lib/supabase/admin.ts`) per escriure sense limitacions de RLS.

## Horaris (`/admin/horaris`)

Formulari per crear una classe individual (`src/app/admin/horaris/actions.ts`):
Professor, Alumne, Dia de la setmana, Hora d'inici/fi, Instrument, Modalitat
i Aula opcional, que insereix directament a `public.schedules`. La llista
mostra totes les classes existents amb l'opció d'eliminar-les.

## Importador d'horaris (Excel/CSV) → Supabase

A `/admin/importador` puges un CSV exportat des de l'Excel/Google Sheets de
cada professor. Reconeix automàticament columnes com *Dia*, *Interval
horari* (`16.30 a 17.00`), *Modalitat*, *Nom*, *Cognoms*, *Curs*,
*Professor* i els mails/telèfons de pare i mare.

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
amb destinataris (Tothom / Professorat / Famílies) desats a la columna
`audience`. Sense cap avís d'exemple — la llista només mostra el que s'ha
publicat de debò.
