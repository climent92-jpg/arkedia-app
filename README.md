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

El contingut de dins de cada portal (horari, deures, materials...) encara
prové de dades de mostra (`src/lib/mock-data.ts`) — només la porta d'entrada
(autenticació) és real; connectar cada pantalla a les taules de Supabase és
el següent pas natural.

Per provar-ho com a PWA al mòbil: obre l'adreça amb Chrome/Safari des del
mateix Wi-Fi que l'ordinador (`npm run dev -- -H 0.0.0.0` i usa la IP local)
i selecciona "Afegir a la pantalla d'inici".

## Estructura del projecte

```
src/
  app/
    page.tsx              Redirigeix a /login o al portal segons la sessió
    login/page.tsx          Formulari de login real (Supabase Auth)
    familia/               Portal de família (horari, deures, material, xat)
    professor/              Portal de professorat (agenda, alumnes, deures, material, xat)
    admin/                 Portal d'administració (panell, importador, usuaris, avisos)
    manifest.ts            Manifest de la PWA
  components/
    ui/                    Components base (botó, targeta, pestanyes...)
    app-shell.tsx           Navegació (barra lateral a escriptori, barra inferior a mòbil)
    chat-thread.tsx          Xat família <-> professor
    video-player.tsx         Reproductor de vídeo
    upload-video.tsx          Pujada de vídeo de l'alumne
  lib/
    mock-data.ts            Dades de mostra (professorat i horaris reals d'ARK#ÈDIA)
    csv-import.ts            Lògica de l'importador d'Excel/CSV
    supabase/                Clients de Supabase (navegador, servidor, middleware)
    supabase/auth.ts          getCurrentProfile() / requireRole() (Server Components)
  types/                    Tipus TypeScript compartits
  proxy.ts                  Middleware: protegeix /familia, /professor, /admin
supabase/
  schema.sql                Esquema complet de la base de dades (SQL)
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
5. **Portal de professorat i administració** — agenda, fitxa d'alumnes,
   assignació de deures, pujada de material, revisió de vídeos, xat,
   panell de control, **importador d'Excel/CSV** (amb un botó per provar-lo
   amb l'horari real de la Noelia) i gestor d'usuaris/avisos.
6. **Autenticació real i protecció de rutes** — login amb Supabase Auth
   (`src/components/login-form.tsx`), sense mode demo. El middleware
   (`src/proxy.ts` + `src/lib/supabase/middleware.ts`) i els layouts dels
   portals (`src/lib/supabase/auth.ts` → `requireRole()`) bloquegen l'accés
   a qui no tingui sessió vàlida o tingui un rol diferent del portal que
   visita.

## Connectar Supabase (obligatori per iniciar sessió)

1. Crea un projecte a [supabase.com](https://supabase.com).
2. Al **SQL Editor** del projecte, enganxa i executa `supabase/schema.sql`.
3. A **Storage**, crea dos buckets: `materials` (partitures/vídeos del
   professor) i `submitted-videos` (vídeos dels alumnes).
4. Copia `.env.local.example` a `.env.local` i omple `NEXT_PUBLIC_SUPABASE_URL`
   i `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a Settings → API del projecte).
   Reinicia `npm run dev` perquè les llegeixi.
5. **Crea el primer usuari** (per exemple, un administrador):
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
7. **Següent pas**: substitueix progressivament les crides a
   `src/lib/mock-data.ts` per consultes reals amb `createClient()` de
   `src/lib/supabase/client.ts` (client) o `src/lib/supabase/server.ts`
   (Server Components), perquè cada portal mostri les dades del propi
   usuari autenticat en lloc de les dades d'exemple.

## Importador d'horaris (Excel/CSV)

A `/admin/importador` pots pujar un CSV exportat des de l'Excel/Google
Sheets de cada professor. Reconeix automàticament columnes com *Dia*,
*Interval horari* (`16.30 a 17.00`), *Modalitat*, *Nom*, *Cognoms*, *Curs*,
*Professor* i els mails/telèfons de pare i mare. El botó **"Provar amb
dades reals"** carrega l'horari real de la Noelia com a exemple.
