# AI usage

This project was built with AI assistance. This file is the record of it.

I used Claude Code (Anthropic's coding assistant), in the terminal and in VS Code,
mostly with Claude Sonnet 5 and Claude Opus 5.5. I directed each change, and I
checked each one in a browser, against the database or with curl before keeping
it. Commit links below point at this repository's history.

## 1. How I used AI

### 2026-09-28 - Login screen to Figma, auth flow, colour picker, Pages build

- **Tool:** Claude Code (Sonnet 5)
- **What I asked for:** Match the login screen to the Figma file: parallelogram
  banner, SVG wordmark, mascot. Add sign-up with verification, a colour picker
  with a wheel and colour formats, and fix the Pages build config.
- **What it gave back:** Clip-path and SVG code, a colour picker, auth context
  and pages, and a Pages workflow.
- **What I kept, what I changed, and why:** I kept the structure. I checked the
  wordmark and mascot positions against Figma renders by measuring pixels. I
  tested the colour picker in a browser and found bugs (see section 2).
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/601b3cff2ce0d92963e91620a4d9b87b16cdedd8

### 2026-09-28 - Uploads into Postgres, private files, helmet, rate limits

- **Tool:** Claude Code (Sonnet 5)
- **What I asked for:** Move uploads from disk into Postgres so they survive
  Render's free-tier disk wipes. Make files private to their owner, add a
  per-user storage limit and a cleanup job, and add helmet and rate limits.
- **What it gave back:** A new `uploads` table and repo, a private
  `GET /api/files/:id` route, and rate-limiter middleware.
- **What I kept, what I changed, and why:** I kept the design. I tested it against
  the real database with a stubbed login: owner reads, another user gets 404,
  no login gets 401. I checked the rate limit with 610 requests from one address.
  I also wrote the security checklist and recorded the `npm audit` results without
  applying the forced upgrades.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/fca7e94257c76d77943f7100988a6c5957aea746

### 2026-09-28 - Replace the broken seed script

- **Tool:** Claude Code (Sonnet 5)
- **What I asked for:** `npm run db:reset` failed because `seed.sql` still targeted
  an old table. Replace it with something that works and is safe.
- **What it gave back:** `server/db/seed.js`, which adds invented data for one
  account and refuses to run against a hosted database.
- **What I kept, what I changed, and why:** I tested it locally: usage message,
  seeding, refusal to duplicate, and refusal against a remote URL. I deleted the
  test rows afterwards.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/e90422933e9878c89c5e5cb6da809ba5b66709e0

### 2026-09-30 - Back button, reflection log, note linking, Settings, dark mode

- **Tool:** Claude Code (Sonnet 5)
- **What I asked for:** Fix the back button so it returns to the page I came from.
  Add a dated reflection log, timestamps and project links on quick notes, a
  Settings page (display name, password, email) and a light/dark toggle.
- **What it gave back:** `navigate(-1)` in place of hardcoded routes, a
  `project_reflections` table and routes, a `project_id` column, a Settings page,
  and dark mode driven by CSS variables.
- **What I kept, what I changed, and why:** I tested the back button in a browser
  across four routes. I tested the reflection endpoints and note linking against
  the database. I checked dark-mode contrast by calculation and in screenshots.
  I changed the dark-mode colours where a magenta or lime fill needed literal
  black text.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/331ed0f5e047f4825b57d5d8975a3281a4015dd0

### 2026-10-02 - Clearer project notes, deleting a reflection entry

- **Tool:** Claude Code (Sonnet 5)
- **What I asked for:** The collapsed "initial notes" section looked confusing.
  Make it a clear section, and let me delete a reflection log entry.
- **What it gave back:** A visible "project notes" section with a one-line
  explanation, and a `DELETE /api/projects/:id/reflections/:reflectionId` route
  with a delete button on each entry.
- **What I kept, what I changed, and why:** I tested the route against the database
  (delete, repeat delete, and another user's project). I tested the UI in a browser:
  add two entries, delete one, check that the right one went.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/7244412fa3f405bb0f1f3d9fbe523d0bbe2f6374

### 2026-09-28 - Security review and checklist

- **Tool:** Claude Code (Sonnet 5)
- **What I asked for:** Check the repository for secrets and fill in the security
  checklist honestly, with evidence for each row.
- **What it gave back:** A scan of every file git would commit, a history search,
  and a checklist draft with evidence.
- **What I kept, what I changed, and why:** The scan found that the Firebase admin
  key file was not in `.gitignore`. I added the ignore rules and removed a second
  copy of the key from `server/.env`. I kept the "No" answers where the gap is real.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/fca7e94257c76d77943f7100988a6c5957aea746

## 2. Where the AI got it wrong

### Case 1 - Saving a kit created two database rows

- **What it gave me:** A save button that could be clicked again while a save was
  in progress, with no guard in the save function.
- **What was wrong with it:** The `Button` component never passed through a
  `disabled` prop, so the button could not be disabled. The save function had no
  re-entry guard. A double click sent two `POST` requests, and the database kept
  both rows.
- **What I did instead:** I found the duplicate rows with a direct query, fixed the
  button and the guard, and deleted the extra row.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/601b3cff2ce0d92963e91620a4d9b87b16cdedd8

### Case 2 - The colour picker wheel did nothing and the colour stayed black

- **What it gave me:** A colour picker that passed a click event into the colour
  value, and a hue calculation that broke for greys.
- **What was wrong with it:** `onClick={addColor}` passed the click event as the
  hex argument. The colour library returns an undefined hue for greys, not NaN, so
  the `Number.isNaN` check missed it. New colours started black, so the wheel
  changed nothing on screen.
- **What I did instead:** I found each bug by driving the picker in a browser and
  logging console errors. I fixed the handler, switched the check to
  `Number.isFinite`, and made dragging the wheel move the lightness off black.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/601b3cff2ce0d92963e91620a4d9b87b16cdedd8

### Case 3 - The back button always went to the library

- **What it gave me:** Back buttons on the kit and project screens that navigated to
  a hardcoded `/library` route.
- **What was wrong with it:** Opening a kit from Home and pressing back landed on
  the library, not Home, because the route was fixed rather than the history.
- **What I did instead:** I replaced the hardcoded routes with `navigate(-1)` and
  tested four paths in a browser: Home to a new kit, Home to a new project, and
  both library tabs to an item.
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/331ed0f5e047f4825b57d5d8975a3281a4015dd0

## 3. Who wrote what

### Written by me

I did not hand-write source files myself; Claude Code generated every
implementation file, and I directed it. What was mine throughout: the Figma
designs (the wordmark, the mascot, the "welcome to" banner, and the colour
palette — magenta #FF00AE, lime #C1FF1A, surface #F4F4F0, ink #111111), the
full feature list and the order to build it in (the colour picker's harmony
menu, turning the reflection field into a dated log, linking quick notes to
projects, the Settings page, dark mode), and every product decision along the
way — what to keep, what to defer, and what to fix when something was wrong.
I reviewed and tested each change myself before accepting it, usually in a
browser or against the database, not just by reading the diff.

### The AI-written part I understand best

- **File:** `client/src/utils/color.js` and `client/src/components/organisms/ColorPicker.jsx`
- **Commit:** https://github.com/ysabe1i/studio-nara/commit/601b3cff2ce0d92963e91620a4d9b87b16cdedd8
- **What it does and why we kept it:** `color.js` converts between the four
  colour formats a designer uses — hex, rgb, hsl and oklch — and calculates six
  colour-harmony types by rotating the base hue by fixed offsets: complementary
  is +180°, triadic is +120° and +240°, split-complementary is +150° and +210°,
  and so on. `ColorPicker.jsx` wires that to a draggable hue/saturation wheel, a
  lightness slider, and four text fields you can type a colour code into
  directly. I can explain how it works: the wheel maps the drag angle to hue
  and the distance from the centre to saturation; typing into any field
  re-parses it with the `culori` library and recalculates the other three
  formats and the wheel position; picking a harmony type recomputes the offset
  hues from whatever the current colour is. I verified it myself by testing
  each format conversion by hand and checking that triadic and complementary
  selections landed at the expected angles on the wheel.
