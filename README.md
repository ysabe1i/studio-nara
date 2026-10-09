# Studio Nara

**Live site:** https://ysabe1i.github.io/studio-nara/
**API health check:** https://nara-api-1k3j.onrender.com/healthz
**Demo video:** https://drive.google.com/drive/folders/1JnkBpjOONBAVoLETkvXEnujutIjkDOQi?usp=drive_link

> The API runs on a free plan and goes to sleep when idle, so the first request
> after a quiet period can take 30 to 60 seconds. The sign-in screen may look
> stuck for that long. It is waking up, not broken.

## 1. Overview

Studio Nara is a brand-kit and idea-capture app for graphic designers. It lets
you save colour palettes, logos and custom fonts per project, jot down design
ideas the moment they strike, and reflect on what worked once a project is
finished. It is built for designers (students, hobbyists or professionals) who
want one place for their brand assets and reflections instead of scattered
screenshots and notes apps.

Every designer signs up for their own account. Their kits, projects, notes and
uploaded files are private to them.

**Built with:** React, Vite and Tailwind CSS on the front end; Express and
PostgreSQL on the back end; Firebase Authentication for sign-in (Firebase is used
for accounts only, never as a database). The client is on GitHub Pages, the API
on Render, and the database on Neon.

## 2. Setup and installation

Follow these in order. The commands below are for Windows PowerShell; on macOS or
Linux use `cp` where PowerShell uses `Copy-Item`.

### What to install first

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 20 or newer | runs the API and builds the client |
| PostgreSQL | 13 or newer | the database (the schema uses `gen_random_uuid()`) |
| Git | any | to clone the code |
| A Firebase project | | sign-in (set up in the next section) |
| Docker | optional | an easy way to run PostgreSQL without installing it |

### Get the code

    git clone https://github.com/ysabe1i/studio-nara.git
    cd studio-nara

### Set up Firebase (once)

1. In the [Firebase console](https://console.firebase.google.com/), create a project.
2. **Build > Authentication > Sign-in method:** enable **Email/Password**. Enable
   **Google** too if you want the "Continue with Google" button to work.
3. **Project settings > Your apps:** add a **Web app** and copy its config values
   (`apiKey`, `authDomain`, `projectId`, `appId`). They go in `client/.env` below.
4. **Project settings > Service accounts > Generate new private key.** Save the
   downloaded file as `server/firebase-service-account.json`. It is git-ignored.
   **Never commit it or paste it anywhere**: it gives full access to your project.

### Create the database

Either install PostgreSQL and create a database called `nara`, or run one in
Docker:

    docker run --name nara-pg -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=nara -p 5432:5432 -d postgres:17

### Install and configure the API

    cd server
    npm install
    Copy-Item .env.example .env

Open `server/.env` and check that `DATABASE_URL` matches your database. Then
create the tables:

    npm run db:schema                 # prints: ran db/schema.sql

Running the schema again is safe: it only adds what is missing.

### Install and configure the client

    cd ../client
    npm install
    Copy-Item .env.example .env

Open `client/.env`, set `VITE_USE_MOCK_API=false`, and fill in the four Firebase
values from step 3 above.

### Environment variables

Nothing real is committed. Each folder has a `.env.example` with placeholder
values. `.env` files are git-ignored.

**`server/.env`**

| Name | Example | What it is |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:devpassword@localhost:5432/nara` | PostgreSQL connection string. Contains a password, so treat it as secret |
| `CORS_ORIGINS` | `http://localhost:5173` | comma-separated origins allowed to call the API. No trailing slash, no path |
| `NODE_ENV` | `development` | set to `production` on the host |
| `PORT` | (leave unset) | the host sets it. Locally the API uses 3000 |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `/etc/secrets/firebase-service-account.json` | optional. Where the Firebase key file is. Unset locally, where `server/firebase-service-account.json` is used |

**`client/.env`** (compiled into the built JavaScript, so it is **public**: never
put a secret in a `VITE_` variable)

| Name | Example | What it is |
| --- | --- | --- |
| `VITE_USE_MOCK_API` | `false` | `false` talks to the real API. Anything else uses the browser-only demo backend |
| `VITE_API_BASE_URL` | `http://localhost:3000` | where the API lives. No trailing slash |
| `VITE_FIREBASE_API_KEY` | `AIza...` | Firebase web config (public by design) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | Firebase web config |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase web config |
| `VITE_FIREBASE_APP_ID` | `1:1234567890:web:abcdef` | Firebase web config |

### Seed the database (optional, local only)

The database starts empty. Sign up in the app first, then:

1. Copy your **User UID** from Firebase console > Authentication > Users.
2. From `server/`, run:

       npm run db:seed -- <your-uid>

The seed only ever adds rows, skips an account that already has kits, and refuses
to run against a hosted database. It adds invented sample data: 2 kits, 2
projects and 3 notes. There is no reset command.

## 3. How to run it

Use two terminals.

**Terminal 1, the API:**

    cd server
    npm run dev

You should see `API listening on http://localhost:3000`. Check it on its own:

    curl http://localhost:3000/healthz     # {"ok":true}
    curl http://localhost:3000/readyz      # {"ok":true,"db":"up"}

**Terminal 2, the client:**

    cd client
    npm run dev

Open **http://localhost:5173**. The first screen is the sign-in page: a lime
"welcome to" banner, the pixel wordmark, and a pink star mascot that bounces in
and lands at the bottom left.

**First run:** switch to **sign up**, enter a display name, an email and a
password (twice), and create the account. Firebase emails you a verification link.
Click it, return to the app and press **i've verified**. You land on Home.

To make a production build of the client: `cd client && npm run build` (output in
`client/dist`).

> **Demo mode.** With `VITE_USE_MOCK_API` unset or `true`, the client answers its
> own data requests from the browser's `localStorage`, so you can try the screens
> with no API and no database. Sign-in still uses real Firebase, so you still need
> the four Firebase values.

## 4. Features and usage

### The main flow

1. **Sign up or log in.** Email and password (with a display name, a
   confirm-password field and an emailed verification link), or **Continue with
   Google**. Accounts that have not verified their email cannot use the app.
   Logging in always lands on Home.
2. **Home** shows your recent kits and projects, with **new kit** and **new
   project** buttons. Back buttons return you to the page you came from.
3. **Build a brand kit** (from Library, or **new kit** on Home):
   - name it and give it a tag;
   - **colours:** click a swatch to open the colour picker. Drag on the wheel to
     choose a hue and saturation, use the slider for lightness, or **type a
     colour code and press Enter** in the hex, rgb, hsl or oklch field. The
     **harmony** menu (complementary, split-complementary, analogous, triadic,
     tetradic, square) shows related colours; click one to add it to the palette;
   - **logos:** upload images (up to 5 MB each);
   - **fonts:** upload `.ttf`, `.otf`, `.woff` or `.woff2` files and see a live
     sample;
   - press **save**. Open a saved kit later to edit it, or use **delete kit**
     (it asks for confirmation; projects linked to it stay but lose the link).
4. **Log a project** (Library > projects > **+ new project**): a title, an
   optional draft image (hover it to change it, or use the × to remove it), the
   kit it used, and **project notes**: one overall note on what worked and what you
   would change.
5. **Reflection log** (on a saved project): add dated entries as the project moves
   along, and delete any entry with its ×. The log only appears once the project
   has been saved.
6. **Quick capture** (the **quick notes** link in the header): type an idea and
   press the arrow. Each note shows when it was written, and you can link it to one
   of your projects. Click the project name to open it. Delete notes with the ×.
7. **Library** lists all kits and projects in two tabs. Kit cards show a palette
   strip, the first logo and a sample of the first font.
8. **Settings** (the **settings** link in the header):
   - change your **display name**;
   - change your **password** (asks for your current password first; Google-only
     accounts have no password to change);
   - change your **email** (asks for your current password first, then sends a
     confirmation link to the new address. Your sign-in email stays the same until
     you click it);
   - switch between **light and dark mode**. The choice is remembered in your browser.

### API

Base URL: the API address, for example `http://localhost:3000`. Every `/api/*`
route needs the header `Authorization: Bearer <Firebase ID token>` from a
signed-in, email-verified account. Without a valid token the API answers `401`;
with an unverified email it answers `403`. Each request only sees the signed-in
user's own data.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/healthz` | is the process alive (no login needed) |
| GET | `/readyz` | is the database reachable (no login needed) |
| GET | `/api/kits` | list your kits, with their colours, logos and fonts |
| POST | `/api/kits` | create a kit: `name` (required, up to 120), `tag` (up to 60), `colors` (`[{hex: "#RRGGBB", name}]`), `logos`, `fonts` |
| GET | `/api/kits/:id` | one of your kits |
| PUT | `/api/kits/:id` | replace a kit's name, tag, colours, logos and fonts |
| DELETE | `/api/kits/:id` | delete a kit (its projects are kept, unlinked) |
| GET | `/api/projects` | list your projects |
| POST | `/api/projects` | create: `title` (required, up to 200), `image_url`, `kit_id` (must be one of your kits), `notes_worked`, `notes_to_change` (up to 4000 each) |
| GET | `/api/projects/:id` | one of your projects |
| PUT | `/api/projects/:id` | update a project |
| DELETE | `/api/projects/:id` | delete a project (its reflections go too) |
| GET | `/api/projects/:id/reflections` | list a project's reflection log entries, newest first |
| POST | `/api/projects/:id/reflections` | add a log entry: `text` (required, up to 4000) |
| DELETE | `/api/projects/:id/reflections/:reflectionId` | delete one log entry |
| GET | `/api/notes` | list your quick notes |
| POST | `/api/notes` | create a note: `text` (required, up to 500), optional `project_id` (must be one of your projects) |
| DELETE | `/api/notes/:id` | delete a note |
| POST | `/api/uploads` | upload one image or font as multipart field `file` (5 MB max; 25 MB total per user). Returns `{ "url": "/api/files/<id>" }` |
| GET | `/api/files/:id` | download a file you uploaded (only you can read it) |

Limits: 600 requests per 15 minutes per IP, and 30 uploads per 15 minutes per
signed-in user. Going over returns `429`.

## 5. Project structure

    client/                    React front end, built by Vite
      index.html
      public/favicon.svg       the tab icon
      src/
        App.jsx                routes (everything except /login needs a verified login)
        firebase.js            Firebase web config, from VITE_ variables
        pages/                 Login, Home, Library, BrandKitBuilder, ProjectEntry,
                               QuickCapture, Settings
        components/            atoms/ (Button, Tag, IconButton), molecules/ (ColorRow,
                               ColorWheel, Card, KitPreview, ConfirmDelete...),
                               organisms/ (Header, ColorPicker), RequireAuth.jsx
        context/               AuthContext.jsx (sign-in, sign-up, Google, verification,
                               settings), ThemeContext.jsx (light/dark mode)
        api/                   ONE interface, two implementations chosen by
                               VITE_USE_MOCK_API: httpApi.js (real API) and
                               mockApi.js (browser demo); files.js loads private files
        hooks/useFileUrl.js    shows a private uploaded file
        utils/                 color.js (colour conversion and harmonies),
                               authErrors.js (friendly sign-in messages)
        assets/                mascot artwork
    server/                    Express API
      server.js                routes, security headers, rate limits, validation
      authMiddleware.js        checks the Firebase token and verified email
      firebaseAdmin.js         loads the Firebase service-account key
      kitsRepo.js, projectsRepo.js, notesRepo.js, uploadsRepo.js, reflectionsRepo.js
                               the SQL for each resource (always filtered by user)
      db/                      pool.js, schema.sql, run.js (runs a .sql file), seed.js
    docs/                      planning documents and security notes
    .github/workflows/deploy-pages.yml   builds the client and publishes it to
                                          GitHub Pages on every push to main
    SECURITY-CHECKLIST.md      the completed security checklist
    AI-USAGE.md                how AI was used in this project

## 6. Known issues and next steps

**Known issues, honestly:**

- **Slow first load.** The free API host sleeps when idle, so the first request
  after a quiet period takes 30 to 60 seconds.
- **Deep links while logged out.** Opening a page while logged out sends you to
  Home after you log in, not back to that page.
- **No password reset or account deletion screen.** Firebase supports both; they
  are not built.
- **Phone layout is only partly checked.** The sign-in screen has been checked at
  phone width. The other screens have not been checked thoroughly.
- **Library and Quick Capture are functional but unpolished.** Their layout and
  visual design are planned for a later pass.
- **Wordmark is smaller than the design.** It is capped at 696px wide; the Figma
  design has it at about 997px.
- **No site-wide search yet.** Planned, not built.
- **Rate limits reset when the API restarts** and are kept per server instance.
- **`npm audit` reports issues** (server: 11 moderate; client: 11 moderate and 1
  high), almost all inside the Firebase packages. Fixing them needs major-version
  upgrades that have not been done or tested. Details in
  [docs/06-security-and-privacy.md](docs/06-security-and-privacy.md).
- **The database connection is not certificate-verified** on hosted databases
  (encrypted, but the server's identity is not checked). This is the usual
  tradeoff for a student project.

**Next steps:**

1. Polish the Library and Quick Capture screens.
2. Add site-wide search.
3. Password reset and delete-my-account screens.
4. Check all screens at phone width.
5. Upgrade Firebase and React Router to clear the audit warnings, then retest.
6. Give the API its own limited database role instead of the default owner role.

## Author

[ysabe1i](https://github.com/ysabe1i). Final project.

## AI use

![Built with AI assistance](https://img.shields.io/badge/built%20with-AI%20assistance-0b5fff)

I used **Claude Code** (Anthropic's coding assistant) throughout: planning,
writing and debugging code, and drafting documentation. I directed it and checked
each change in a browser or against the database. The full account, including
where the AI got things wrong, is in [AI-USAGE.md](AI-USAGE.md).

## Licence

MIT, see [LICENSE](LICENSE).
