# ARK#ÈDIA · App de gestió de l'escola de música

Aplicació web i PWA per a la gestió integral d'ARK#ÈDIA Escola de Música:
horaris, deures, partitures, vídeos i xat entre famílies, professorat i
administració.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** amb el tema visual d'ARK#ÈDIA (blau `#1E51A4`)
- **Lucide React** per a les icones
- **PWA**: instal·lable a mòbil i escriptori (`manifest.webmanifest` + service worker)
- **Supabase** (preparat, no connectat): PostgreSQL, Auth i Storage

## Executar en local

```bash
npm install
npm run dev
```

Obre <http://localhost:3000>. A la pantalla d'inici tens tres botons de
"demo ràpida" per entrar directament a cada portal (família, professor,
administració) sense necessitat de contrasenya, ja que encara funciona amb
dades de mostra (`src/lib/mock-data.ts`).

Per provar-ho com a PWA al mòbil: obre l'adreça amb Chrome/Safari des del
mateix Wi-Fi que l'ordinador (`npm run dev -- -H 0.0.0.0` i usa la IP local)
i selecciona "Afegir a la pantalla d'inici".

## Estructura del projecte

```
src/
  app/
    page.tsx              Pantalla d'inici / login
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
  types/                    Tipus TypeScript compartits
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
6. **Connexió a Supabase** — clients preparats (`src/lib/supabase`), encara
   sense activar (l'app funciona 100% amb dades de mostra).

## Connectar Supabase (quan vulguis passar a producció)

1. Crea un projecte a [supabase.com](https://supabase.com).
2. Al **SQL Editor** del projecte, enganxa i executa `supabase/schema.sql`.
3. A **Storage**, crea dos buckets: `materials` (partitures/vídeos del
   professor) i `submitted-videos` (vídeos dels alumnes).
4. Copia `.env.local.example` a `.env.local` i omple `NEXT_PUBLIC_SUPABASE_URL`
   i `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a Settings → API del projecte).
5. Substitueix progressivament les crides a `src/lib/mock-data.ts` per
   consultes amb `createClient()` de `src/lib/supabase/client.ts` (client) o
   `src/lib/supabase/server.ts` (Server Components).
6. Activa l'autenticació per correu/contrasenya a Supabase Auth i connecta
   el formulari de `src/app/page.tsx`.

## Importador d'horaris (Excel/CSV)

A `/admin/importador` pots pujar un CSV exportat des de l'Excel/Google
Sheets de cada professor. Reconeix automàticament columnes com *Dia*,
*Interval horari* (`16.30 a 17.00`), *Modalitat*, *Nom*, *Cognoms*, *Curs*,
*Professor* i els mails/telèfons de pare i mare. El botó **"Provar amb
dades reals"** carrega l'horari real de la Noelia com a exemple.
