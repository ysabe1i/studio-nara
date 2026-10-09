# Security checklist

Completed 2026-09-28 against the code and the live deployment (last updated 2026-10-05: row 5 and the closing note). Each answer says
what I checked. Where the honest answer is "No", it says so and what is missing.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | Root `.gitignore` ignores `.env`, `.env.*` and `**/.env*` (keeping `.env.example`). `git check-ignore -v server/.env client/.env` matches, and `git ls-files` shows only the three `.env.example` files |
| 2 | A `.env.example` with placeholder values only is committed | Yes | One each in the root, `client/` and `server/`. Values are placeholders (`devpassword`, `your-firebase-api-key`, `your-project.firebaseapp.com`) |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | I scanned every file git would commit for private-key markers, token formats and connection strings with a password: nothing. The database URL comes from `process.env.DATABASE_URL`; the Firebase key is read from a git-ignored file |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | I searched all history. The only hits were the placeholder `devpassword`, variable and function names (`VITE_FIREBASE_API_KEY`, `signInWithEmailAndPassword`) and the course template's own text. No real value |
| 5 | Any credential that was ever committed has been rotated | N/A | No credential was ever committed (row 4), so there is nothing to rotate. Separately, Firebase admin keys were displayed in private working sessions with an AI assistant (never committed, never public). I chose not to rotate the key the app uses: its stored copies are on my laptop and in Render's secret file, and nothing in the repository holds it. See the note at the end |
| 6 | Production credentials live only in my hosting provider's environment settings | Yes | The Render API runs from this repo with no `.env` in it: `DATABASE_URL`, `CORS_ORIGINS` and `NODE_ENV` are set in Render's dashboard and the Firebase key is a Render secret file. The live `/readyz` returns `{"ok":true,"db":"up"}` and sign-in works |

## GitHub Actions

One workflow, `.github/workflows/deploy-pages.yml`, builds the client and publishes it to GitHub Pages.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | Yes | I read the whole file. The only values passed in are `${{ vars.NAME }}` references |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | The workflow needs no secrets. The only values it uses are the public Firebase web config and the API address, which are stored as Actions *variables* because they end up in the public JavaScript anyway |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | Yes | Opened the latest "Deploy client to GitHub Pages" run (triggered by commit 589e003) and expanded every step. The `npm run build` step prints the `VITE_` env values used at build time, which is expected since they're public Firebase web config and the API URL; no `DATABASE_URL`, password or service-account value appears anywhere in the log |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | Yes | The artifact is `client/dist` only: `index.html`, `404.html`, `favicon.svg` and `assets/`. I listed a fresh build to confirm. It contains only the public `VITE_` values |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | No | It uses `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`. All are GitHub's own actions, but they are pinned to tags, not SHAs |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | Checked the repository's Settings > Code security page: both Secret Protection and Push protection show as enabled |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | Every query in `kitsRepo.js`, `projectsRepo.js`, `notesRepo.js`, `uploadsRepo.js` and `db/seed.js` uses `$1`, `$2` placeholders. I searched the server for queries built with template strings or `+`: none |
| 14 | The database is not open to the whole internet, or is reachable only by the app | No | The hosted (Neon) database has a public address. It is protected by TLS and a password only. I have not turned on an IP allow-list |
| 15 | The database user the app connects as has only the permissions it needs | No | The app uses the default owner role from the connection string, which can do anything in that database. Local development connects as the `postgres` superuser. I have not created a limited role |
| 16 | Seed and sample data is invented, not real people's data | Yes | The sample data in `client/src/api/seed.json` (demo mode) and `server/db/seed.js` is invented (made-up kits, colors, project names and notes) |
| 17 | Debug, seed and reset routes are removed before going public | Yes | The server's routes are only `/healthz`, `/readyz` and the `/api/...` resource routes (listed in the README). The seed is a command-line script that refuses to run on a hosted database. There is no reset |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | Firebase Authentication. Email sign-up requires a verified email, and the server checks the token and the verified flag on every request |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | Firebase is used for sign-in only. There is no Firestore, Realtime Database or Storage, so there are no rules to set. The data lives in PostgreSQL. Tested signed out: the live API returns 401 for kits, projects, notes, file download and upload |
| 20 | If Zero Trust: the course email is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | N/A | I use neither Zero Trust nor a shared app password. Access is per-user Firebase accounts |
| 21 | The gate covers every route, including the ones that only change data | Yes | `app.use('/api', requireAuth)` sits before every data route, including POST, PUT and DELETE. Signed out, the live API returned 401 for `GET /api/kits`, `GET /api/projects`, `GET /api/notes`, `GET /api/files/:id`, `POST /api/uploads` and `DELETE /api/kits/1`. Only `/healthz` and `/readyz` are open |
| 22 | The credentials for the gate are environment variables, not in source | Yes | The Firebase key file path comes from the `FIREBASE_SERVICE_ACCOUNT_PATH` environment variable (or a git-ignored local file). The database URL is an environment variable |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | `validateKit` and `validateProject` in `server.js` check required fields, length limits, hex color format and item counts. A project can only link to a kit the same user owns, and uploads are limited by an extension allow-list and size. I tested a 61-character tag and got a 400 with a clear message |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | React renders text as text. There is no `dangerouslySetInnerHTML` or `innerHTML` anywhere in `client/src` (searched). Uploaded files are served with `nosniff` and a locked-down content security policy, and their type comes from an extension allow-list, so an HTML file cannot be stored |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | The error handler returns only "Something went wrong on the server" and logs the detail on the server. Unknown routes return a fixed JSON message. `helmet` also removes the `X-Powered-By` header |
| 26 | CORS is not a wildcard on routes that change data | Yes | `cors({ origin: allowedOrigins })` uses a list from `CORS_ORIGINS`. The live API replies with `access-control-allow-origin: https://ysabe1i.github.io` and nothing broader |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | No | The files contain none (I searched all files git would commit, and there is no `student.json`). But the first three commits carry my personal email address in their author field, and the repository is public. I turned on GitHub's "Keep my email addresses private" and "Block command line pushes that expose my email", and new commits use my GitHub noreply address. I chose not to rewrite the three existing commits, so they still show the old address. |
| 28 | No classmate's personal data in the repository | Yes | Nothing about anyone else is in the repository. The sample data is invented |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | Packages come from the npm registry (`package-lock.json` in `client/` and `server/`). `node_modules/` is ignored (`.gitignore` line 21, confirmed with `git check-ignore`) |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | The star mascot is my own artwork, drawn in Figma. The Studio Nara wordmark is my own arrangement of letters from the Geist Pixel font. Fonts (Inter, Geist, Geist Mono, Geist Pixel) load from Google Fonts under the SIL Open Font License. The Google "G" on the sign-in button is Google's own mark, used for a Google sign-in button. The libraries are open-source. No stock photos |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | The repository is public on purpose (GitHub Pages on a free account needs it). I checked GitHub's public API after my last push and it reports `visibility: public` |

## Anything I found and fixed

Going through this caught several things I had not planned for. The Firebase admin key file was **not** git-ignored, so an ordinary `git add .` would have published it. A second copy of that key was also sitting in `server/.env`, and uploaded files were served to anyone from a public `/uploads` folder. I fixed all three (ignore rules, one copy of the key, and private per-user file storage), and also added checks that a project can only link to your own kit, length limits on text fields, `helmet`, rate limiting, and server-side enforcement of verified emails.

**Decision:** I chose not to rotate the Firebase admin key (see row 5).

**Still open:** the first three commits still show my personal email address in the public history (new commits use GitHub's private noreply address, and I chose not to rewrite the old ones); pin the Actions to commit SHAs (row 11); and delete the test data a friend created on the live site before I submit.
