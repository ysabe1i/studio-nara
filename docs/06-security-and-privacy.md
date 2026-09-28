# Security and privacy checklist

Work through this **before your first push**, and again before you submit. It is
short, none of it is exotic, and a grader can check most of it in two minutes.

Your repository is public, in your own account, and permanent. That is the point
of it, and it is also why this file exists.

> **Status as of 2026-09-28.** A box is ticked only where it was checked against
> the actual code or repository. Unticked boxes are honest gaps, with a note on
> what is missing. Re-run the checks before submitting.

## Before the first push

- [x] `.gitignore` includes `.env`, and `git check-ignore -v .env` confirms it
      (also `**/.env*`, the Firebase service-account key, `*.pem`, `*.key` and
      `server/uploads/`)
- [x] `git ls-files | grep -iE '\.env$|\.pem$|id_rsa'` prints nothing
- [x] `.env.example` is committed, with **placeholder** values only
- [x] No connection string, key or password anywhere in the repository,
      including in a screenshot (the files git would commit were scanned for
      private keys, tokens, real database passwords and the Firebase key id)
- [x] No `student.json`, and no name, student number or email of yours or anyone
      else's
- [ ] The Firebase service-account key was once displayed in a working session.
      **Rotate it** (Firebase console > Project settings > Service accounts)
      before the project is treated as final. It was never committed

Deleting a file later does **not** remove it from the history. If you commit a
credential, **rotate it first**, at the service, and clean up the history second.
The rotation is the fix; the cleanup is hygiene.

## The application

- [x] Every SQL query is parameterised. Values go in the array, never into the
      string. This is one line of defence you already know how to do
- [x] Input is validated **on the server**, not only in React. Length limits on
      every text field (kit name 120, tag 60, project title 200, reflections
      4000, quick notes 500, color names 60, file/font names 200, at most 50
      colors/logos/fonts per kit)
- [x] `cors({ origin: allowedOrigins })` names your origins. Not `cors()` with no
      options, which allows every site on the internet
- [ ] `NODE_ENV=production` on the host, and no stack trace in any response body
      (no stack trace is ever sent, checked in the error handler; the API is not
      deployed yet, so the host setting is still to do)
- [x] `helmet` installed, which is one line for several real protections
      (security headers checked on a running server; the API allows
      cross-origin reads because the client lives on another origin)
- [x] Anything that costs money or accepts a password is rate limited. Sign-in
      is throttled by Firebase. The API allows 600 requests per 15 minutes per
      IP overall, and uploads (which write to the free database) are limited to
      30 per 15 minutes per signed-in user. `trust proxy` is set to 1 so the
      limits work per visitor behind Render's proxy. Checked locally: request
      601 from one address got a 429, a different address was unaffected. The
      upload limit itself has not been exercised with a real login yet
- [x] Passwords, if you have accounts, are hashed with bcrypt and never logged
      (this app never sees or stores a password. Firebase Authentication does
      the hashing, and email addresses are verified before access)
- [x] Every route that touches somebody's data has the ownership check **in the
      query**, as `AND user_id = $2`, not as an `if` above it (kits, projects,
      notes and uploaded files; a project can only link to a kit the same user
      owns)
- [ ] `npm audit` run once, and the easy fixes taken. **Run on 2026-09-28
      (production dependencies), fixes knowingly not applied yet:**
      - server: 11 moderate. All come through `firebase-admin` (a `uuid` bounds
        check that only matters when a caller passes its own buffer, which this
        app never does). Fixing it means a major `firebase-admin` upgrade
        (`--force`), deliberately not run. A plain `npm audit fix` would only
        patch-bump `express`, `qs` and `body-parser`; not applied yet
      - client: 12 (11 moderate, 1 high). Almost all are `undici` inside the
        Firebase web SDK, which the browser build does not use (undici is a
        Node HTTP client), plus two `react-router` advisories about server-side
        rendering and backslash redirects. No non-breaking fix exists; the fix
        is a major Firebase / React Router upgrade (`--force`), deliberately
        not run before submission
      - `npm audit fix --force` was **not** run on either side

## Accounts, files and access (added beyond the template)

- [x] Every `/api/*` data route requires a verified Firebase login. Only
      `/healthz` and `/readyz` are open. Accounts whose email is not verified
      get a 403 from the API, not just a redirect in the browser
- [x] Sign-up sends a verification link; the app is unusable until it is clicked
      (Google sign-in accounts arrive already verified)
- [x] Uploaded files are private. They are stored in Postgres (not on disk),
      readable only by their owner through `GET /api/files/:id`, and served with
      `nosniff` and a locked-down content security policy
- [x] The file type is decided by an allow-list of extensions (images and
      fonts), never by the type the browser claims, so an `.html` file cannot be
      stored and served back
- [x] Each user has a 25 MB storage limit (413 when exceeded), and files no kit
      or project uses any more are removed after a one-day grace period
- [x] The Firebase Admin key is read from a file that is git-ignored, never from
      a `VITE_` variable, and the browser only ever holds the public web config
- [ ] Not yet tested end to end with two real accounts: that the second account
      cannot load the first account's files (the queries filter by owner; the
      live check is still to do)

```bash
npm install helmet
```

```js
import helmet from 'helmet'
app.use(helmet())
```

## Privacy

The half that matters more, because it is about other people.

- [ ] **No real classmates' names, numbers, emails or photos**, anywhere. Not in
      seed data, not in screenshots, not in the demo video. Consent for a course
      project does not cover the next ten years of a public repository
- [ ] Seed data is invented. Yours will be read
- [ ] If real people tested your app, even three friends, their data is deleted
      before you submit
- [ ] If your app collects anything about anyone, the app says what it collects
- [ ] Any face in a screenshot is stock, generated, or yours

If your project handles personal information about real people, you are inside
the Philippine Data Privacy Act. Collect the minimum, say what you collect, and
do not collect anything you cannot justify.

## What to write in your journal

One short paragraph: the riskiest thing about your project from this list, what
you did about it, and what you knowingly accepted. A student who can name the
tradeoff they made scores better than one who claims there was none.
