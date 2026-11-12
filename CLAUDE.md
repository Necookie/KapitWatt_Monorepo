# KapitWatt

Residential demand response for Meralco. Team CodeBearers, IDOL Hackathon 2026, 24-hour build.
Source of truth: `docs/KapitWatt_Full_Plan.pdf` (updated November 12, 2026). This file is its working
summary; `docs/` also holds the PRD, SRS and MVP derived from it.

When NGCP raises a yellow or red alert, Meralco's operator alerts opted-in households. Each household
commits to cutting a number of kW during the peak window and is paid for the kWh Meralco can verify it
avoided, from smart-meter (AMI) data or from meter photos taken in the app. It is a household version
of the Interruptible Load Program (ILP).

**The five core steps: alert, commit, shift, measure, reward.**

**Scope: Laguna pilot, simulated.** Seven Meralco franchise towns (Santa Cruz hub, Pila, Victoria,
Nagcarlan, Liliw, Majayjay, Magdalena), 21 sampled barangays, about 1,200 simulated households, plus
team phones as real households in Santa Cruz. The software is real; the households, NGCP alerts and
reward rates are simulated or placeholders. Say so plainly in UI copy and in the pitch.

## Repo layout

```
apps/
  mobile/      Expo + React Native household app (Android APK via EAS)     @kapitwatt/mobile
  dashboard/   Expo web utility dashboard for the Meralco operator          @kapitwatt/dashboard
  api/         Hono on Cloudflare Workers                                   @kapitwatt/api
  landing/     get.kapitwatt.dhekode.com: the APK download page (static)   @kapitwatt/landing
packages/
  shared/      Zod schemas, types, constants, baseline + payout + check math   @kapitwatt/shared
  db/          Postgres schema, migrations, query helpers                   @kapitwatt/db
  sim/         Laguna seed data + event runner (demo only)                  @kapitwatt/sim
  tokens/      Design tokens: colour roles, type scale, spacing, shape      @kapitwatt/tokens
  styles/      Theme (tokens as RN styles), ThemeProvider, font sources     @kapitwatt/styles
  hooks/       useTheme, useStyles, useWindowClass, useCountdown, fonts     @kapitwatt/hooks
  ui/          UI primitives for both apps (React Native + RN web)         @kapitwatt/ui
  icons/       Phosphor icon subset behind one themed <Icon>                @kapitwatt/icons
  config/      Shared tsconfig base                                         @kapitwatt/config
  assets/      Logo, app icons, mascot, Albert Sans (see its README)        @kapitwatt/assets
docs/          The full plan (PDF, source of truth), PRD, SRS, MVP
```

Inside each app:

- Both Expo apps are feature-driven. `src/app/` holds Expo Router routes only: each screen is one line,
  `export { <Page> as default } from '@/features/<page>'` (the `_layout.tsx` navigators stay there).
  Each page lives in `src/features/<page>/`, with nothing at its root but `index.ts`:
  - Mobile pages: `welcome`, `sign-up`, `login`, `forgot-password`, `home`, `history`, `leaderboard`,
    `profile`, `event`, `commit`, `capture`, `result`, `rehearsal`, `appliances`, `privacy`.
  - Dashboard pages: `live-load`, `send-alert`, `flagged`, `alert-log`, `simulator`, `analytics`,
    `town-detail`.
  - `page/<Name>Page.tsx`: composition only (no inline components, helpers or derivation blocks).
  - `components/`: one component per file, named after it. `hooks/`: one hook per file (`useX.ts`).
    `utils/`: pure functions and constants (kebab-case files). `api/`: one query or mutation hook per
    file, for queries only this page uses. `styles/`: only for standalone styles or CSS.
  - Code used by more than one page goes in the shared folders: `components/` (`ui/` holds the older
    compact primitives), `hooks/`, `utils/`, `layout/` (the app shell, itself split into `components/`,
    `hooks/`, `utils/`), `styles/` (dashboard only: its theme and global styles) and `api/` (client,
    HTTP, shared queries and query keys; on mobile also the mock and push registration).
  - Both apps build on the shared packages: `@kapitwatt/ui` for Text, Button, TextField,
    SegmentedButtons, Chip, Card, ProgressBar and the rest; colour roles from `@kapitwatt/styles`;
    spacing, radii and fonts from `@kapitwatt/tokens`; hooks such as `useCountdown` from
    `@kapitwatt/hooks`. An app's own `components/ui/` adds only what the shared set lacks (mobile:
    Screen, the keyboard reveal on TextField, Checkbox, Select, loading and error states).
  - Mobile shared components include `mascot/` (the living Alitaptap), `night/` (the sky, moon, street
    and the sheet positions welcome, sign-up and login share), `capture/` (the in-app meter camera)
    and `privacy/`.
  - A feature never imports from another feature, and shared code never imports a feature; when two
    pages need the same thing, move it to a shared folder. Inside a feature use relative imports; for
    shared code use `@/`.
- `apps/api/src/routes/`: one Hono router per resource, kept thin (validate, call a service, respond).
  Business logic goes in `src/services/` (see its README for the planned files). Auth in `src/middleware/`.
- `packages/shared/src/schemas/` (enums, entities, requests, sim) and `src/math/` (payout, baseline,
  barangay, checks).

Built so far in the API: sign-up, profile, push token, barangays, alerts (create, log, active, view,
totals, targets) and commitments. Readings, rewards, settlement, fast-forward, leaderboard and the
simulator routes still return HTTP 501. The mobile app still runs on its mock (`USE_MOCKS` in
`apps/mobile/src/api/config.ts`) and the dashboard on its fixture (`EXPO_PUBLIC_FIXTURES=1`) until those
land. Replace placeholders in place; keep the route paths.

## Commands

```bash
pnpm install                 # once, from the repo root
doppler setup                # once, after `doppler login`; doppler.yaml names project kapitwatt, config dev
pnpm dev:api                 # doppler run -- wrangler dev on http://localhost:8787
pnpm dev:mobile              # expo start (Expo Go / dev build)
pnpm dev:mobile:tunnel       # expo start --tunnel, for a phone on another network
pnpm dev:mobile:web          # the household app in a browser on :19006 (an origin the API allows)
pnpm dev:dashboard           # expo start --web
pnpm typecheck               # tsc --noEmit in every package
pnpm test                    # vitest in shared and sim
pnpm format                  # prettier
pnpm build                   # typecheck all + bundle API (dry run) + export dashboard
pnpm db:migrate              # apply packages/db/migrations/*.sql (direct connection)
pnpm db:seed                 # load the 21 pilot barangays (reference data, safe to re-run)
pnpm db:smoke                # insert, read back, delete one row through the app's driver
pnpm demo:reset -- --yes     # demo only, deletes data: clean slate + seed + demo accounts + past events
pnpm demo:seed-search        # read-only: pick the live event's simulator seed (see "Demo reset")
pnpm demo:accounts           # just the ten demo accounts (demo:reset includes this)
pnpm --filter @kapitwatt/dashboard build   # expo export -> apps/dashboard/dist
pnpm deploy:api              # preflight, then wrangler deploy with its secrets (from main)
pnpm deploy:dashboard        # build with the Doppler env, then deploy to kapitwatt.dhekode.com
pnpm deploy:landing          # build the download page, then deploy to get.kapitwatt.dhekode.com
pnpm release:mobile          # from main: EAS build (APK) + GitHub Release vX.Y.Z with KapitWatt.apk
pnpm update:mobile -- "msg"  # from main: JS/UI fix to installed phones via EAS Update (no reinstall)
pnpm --filter @kapitwatt/api smoke:live   # read-only checks of the deployed API
```

Run `pnpm typecheck` and `pnpm test` before calling a task done.

Adding dependencies:

- Expo apps: `cd apps/mobile && npx expo install <pkg>` (never plain `pnpm add`; it picks SDK-compatible
  versions). Expo SDK 58: do not trust memory for Expo APIs, read `apps/mobile/AGENTS.md` and the
  versioned docs it points to.
- Everything else: `pnpm --filter <package> add <pkg>`.

## Architecture rules (do not break these)

1. **Apps never import each other.** They talk through the API and `@kapitwatt/shared`.
2. **The simulator never inserts rows.** It calls the same service functions real households hit, through
   the `SimPort` interface in `packages/sim/src/runner.ts`, so the demo exercises real code paths. It acts
   as a service account for simulated rows only. One written exception: the ten demo accounts
   (`households.is_demo`). `pnpm demo:reset` commits and sends readings for them in replayed past events,
   and the fake smart-meter feed covers a demo account a tester committed on the phone. In a live event
   the simulator never commits for them.
3. **Only `apps/api` and `packages/db` touch Postgres.** The driver is imported in `packages/db` only.
   Routes get a handle as `c.var.db` and pass it to query helpers in `packages/db/src/queries/`.
4. **Push is sent only from the API**, through Expo Push, to opted-in tokens in targeted barangays.
5. **Internal packages export TypeScript source** (`main: ./src/index.ts`) with `workspace:*` deps. No
   build step.
6. **Hoisted node-linker, one pinned `react` / `react-native`** (overrides in `pnpm-workspace.yaml`). Avoids
   Metro symlink and duplicate-React problems.
7. **One env var, `EXPO_PUBLIC_API_URL`, for both Expo apps.** (The dashboard also carries two demo-only
   keys for operator and simulator routes.)
8. **One schema everywhere.** Request and entity shapes live in `packages/shared` as Zod schemas; the API
   validates with them and the apps type their calls with them. Do not redefine shapes locally.
9. **Reward and timing numbers live in `packages/shared/src/constants.ts` only.** Never inline 8.40, 0.6,
   20%, 15 min or 30 min anywhere else.

## Ownership (one folder per person and per AI agent)

| Person | Owns                                                               |
| ------ | ------------------------------------------------------------------ |
| 1      | `apps/mobile`, including the camera and photo flow                 |
| 2      | `apps/dashboard`                                                   |
| 3      | `apps/api` and `packages/db`: readings, checks, settlement         |
| 4      | `packages/sim` (fake meter feed) and the math in `packages/shared` |
| 5      | Pitch, demo script, integration testing                            |

Stay inside the folder you were asked to work in. If a change needs `packages/shared` (a new schema or
field), make it small and say so, since everyone imports it.

## Priorities

P0 must work in the demo. P1 if time allows. P2 is a slide or stub only; do not build it.

**Household app, P0:** onboarding and opt-in (email and password, privacy notice and consent, Meralco
account, town, barangay, meter type and serial; see "Accounts and privacy"); commit a cut
(presets 0.5, 1, 1.5, 2 kW or stepper, max from baseline and trust score); rehearsal event (photo
households); meter photo capture; grid alert push (SMS mocked); event screen (countdown, commitment,
photo deadlines, barangay progress bar, live reduction for smart-meter households); result card; points,
leaderboard, history. **P1:** appliance helper, trust score and commit cap. **P2:** home monitor link,
bill credit redemption.

**Dashboard, P0:** alert form (level, window, target barangays, target kW, message preview, confirm);
live committed load vs target; delivered load by town and barangay with target-hit marker and drill-down;
Measure (fast-forward); simulation controls. **P1:** flagged readings list; schedule, reminder, cancel,
alert log; load curve and relief forecast. **P2:** feeder-level check.

**API, P0:** email and password login, token auth and opt-in; alert and commitment endpoints with live totals; meter reading
endpoints with rule checks; push dispatch; baseline and kWh avoided; settlement; simulator routes.
**P1:** AMI feed adapter (simulated in the demo).

**Simulator, P0:** seed Laguna; run event; parameters; fake meter feed; paced commits (20 to 30 s);
reset (simulated data only); safety. **P1:** presets (poor 30%, typical 60%, best 80%), seeded
randomness, run summary, a seed where the presenter's barangay hits its target. **P2:** failure
injection, real PSA barangay import.

## Domain rules

### Two verification paths

|                  | Smart meter (`ami`)                           | Photo (`photo`, no smart meter)                           |
| ---------------- | --------------------------------------------- | --------------------------------------------------------- |
| Evidence         | Meralco 5-minute interval data vs own history | Before and after meter photos in the app + typed reading  |
| Household effort | None                                          | Rehearsal at sign-up, then 2 photos per event             |
| Reward rate      | Full (1.0)                                    | Lower (placeholder 0.6)                                   |
| Progress shown   | Live reduction against baseline               | Result after settlement (window end + 30 min)             |
| Failure          | Missing data: no payout, flagged              | Late, missing or failed photo: no payout, no resubmission |

Plan for most households on the photo path (15% AMI / 85% photo is an assumption). The household commits
to a number of kW, never to a list of appliances; the system cannot see which appliance was switched off
and nothing is ever paid from appliance declarations.

### Photo rules (all plain rules; no ML, no trained model)

- **Capture:** in-app camera only, no gallery upload. The server timestamps the upload.
- **Timing:** before photo within 15 min of window start; after photo within 30 min of window end. Fixed.
- **Meter match:** the serial registered at sign-up must appear in the photo.
- **Location:** GPS within a set distance of the registered address.
- **Reading:** typed by the household; must be higher than the previous one and not more than the service
  could draw in that time.
- **Duplicates:** a file hash rejects reused photos.
- **OCR (optional):** may flag a mismatch with the typed reading. It only flags, never rejects. Keep it off
  in the demo environment.
- **Failures** go to the flagged list on the dashboard, where a person approves or rejects them.

### Baseline and payout (implemented in `packages/shared/src/math/`, tested against the plan's example)

```
actual_kw    = (reading_after - reading_before) / hours between the two readings
cut_kw       = max(0, baseline_kw - actual_kw)
cap_kw       = 2 x (bill_avg_kwh_month / 720)          (peak factor 2 is a placeholder)
paid_cut_kw  = min(cut_kw, committed_kw, cap_kw)
verified_kwh = paid_cut_kw x window hours              (scheduled window, not elapsed photo time)
credit_php   = verified_kwh x 8.40 x path multiplier   (ami 1.0, photo 0.6)
bonus_php    = 20% of credit_php if the barangay reached its target
points       = 100 x verified_kwh
```

- Baseline, photo path: kW measured in the rehearsal window, with a sanity cap from the bill.
  Baseline, AMI path: average kW over the same hours on comparable past days.
- Worked example: window 18:00 to 20:00, committed 1.0 kW, readings 1204.3 at 18:04 and 1206.6 at 20:10
  (1.1 kW), baseline 1.9 kW, cut 0.8 kW, verified 1.6 kWh, PHP 8.06 credit + PHP 1.61 bonus + 160 points.
  Same cut on a smart meter: PHP 13.44.
- **Barangay target:** the alert's target kW is split across targeted barangays by opted-in households;
  the operator can override a share. Progress = verified delivered kW / barangay target.
- **Barangay bonus:** at 100% at settlement, every household there with a verified cut gets 20% on top of
  its own credit. No verified cut, no bonus. An approved photo cut counts at full weight toward the total.
- **Settlement** runs at window end plus 30 min. "Measure (fast-forward)" compresses that for the demo.
- **Contribution Score** (added after the plan; it is the plan's trust score, stored as
  `households.trust_score`): 0 to 100, a new account starts at 25. A verified cut adds 10, a missed or
  late photo takes 5, a flagged reading takes 10; ignoring an alert costs nothing. It unlocks the perks
  in `CONTRIBUTION_BANDS` (`packages/shared/src/constants.ts`; math in `src/math/contribution.ts`),
  shown on the mobile Home card, and below 25 it narrows the largest cut a household can commit. The
  perks are proposals, not agreed with Meralco: say so in the UI.
- **The household app shows no pesos and no points.** The score and its perks are the reward a
  household sees. The payout math above still runs in settlement and the API still returns
  `creditPhp`, `bonusPhp` and `points`; the mobile app does not display them.
- All reward constants are placeholders (PHP 8.40/kWh, 0.6, 20%, 100 points/kWh, peak factor 2). The real
  rate would be set by Meralco and the ERC.

### Accounts and privacy

Added after the plan (it is not in the PDF): a household has a login and names its Meralco account.

- **Login:** email and password. `POST /auth/register` and `POST /auth/login` return a bearer token;
  only its hash is stored, and a new login replaces it (one phone at a time). Passwords are stored as
  PBKDF2 hashes. `POST /auth/logout` ends the session. Password reset is a stub screen (no email
  service in the pilot).
- **Meralco account:** the 10-digit Customer Account Number (CAN), the registered account holder's
  name and the service address. Format checks only; nothing is verified against Meralco. One
  household per CAN. The CAN is only ever sent back masked (last four digits).
- **Onboarding order (mobile):** account, privacy notice and consent, Meralco account, home, meter,
  review. Consent comes before any personal data beyond the email, with two separate required
  ticks (data use, grid alerts). Nothing is sent to the API until "Join the pilot".
- **Privacy controls (Profile screen):** see and correct name and address (`PATCH /auth/me`), turn
  alerts off (`optedIn: false`), re-read the notice, and withdraw consent by deleting the account
  (`DELETE /auth/me`), which erases the household, its commitments, readings, rewards and photos.
- The notice text lives in one place, `apps/mobile/src/components/privacy/PrivacyNotice.tsx`.

### Data model

`barangays`, `households`, `appliances` (optional), `alerts`, `commitments`, `meter_readings`, `rewards`.
SQL in `packages/db/migrations/0001_init.sql`, Zod mirrors in `packages/shared/src/schemas/entities.ts`.
Keep the two in sync. `meter_readings.commitment_id` is null for the rehearsal. Smart-meter rows in
`meter_readings` come from the AMI feed; photo rows come from the app.

### Simulator

Routes, all behind the simulator key and off unless `APP_ENV` is `demo`:
`POST /sim/seed`, `POST /sim/run`, `POST /sim/reset`, `GET /sim/status`.

Default parameters (every one is an assumption; keep them visible in the dashboard): participation 60%
(adjustable 20% to 80%), follow-through 80%, path mix 15% AMI / 85% photo, photo completion 90%, baseline
noise plus or minus 10%, 1 kW cut per participating household, commits paced over about 25 s.

Expected demo numbers: 1,200 x 60% x 1 kW = 720 kW committed; about 86 kW delivered by AMI households
and 441 kW by photo households = about 527 kW, 88% of the 600 kW target. The shortfall is a talking
point (every missed photo is verified kW lost).

Simulated households are flagged `is_simulated`; reset deletes those rows only.

### Demo reset (before every demo)

`pnpm demo:reset -- --yes` (`apps/api/scripts/demo-reset.ts`) rebuilds the demo world in about 20 s:

1. The 21 barangays, then the ten demo accounts (`demo01..10@kapitwatt.test`): created if missing,
   `is_demo`, all in the presenter's barangay, **Bagumbayan, Santa Cruz**. 01 to 07 photo, 08 and 09
   smart meter, 10 has no baseline (practice-run demo). First, so a failure deletes nothing.
2. Clean slate: every alert (with its commitments, readings and rewards), every simulated household,
   orphan sign-ups (no email and no login token), and the demo accounts' leftover readings. Real
   households with a login keep their accounts.
3. 1,200 simulated households (household seed 2026).
4. Six past events over four weeks (`PAST_EVENTS` in `apps/api/src/services/demo.ts`), each run through
   the real services with no push, then moved back to its date. Each demo account follows a script
   (mostly paid; one late photo, one missed photo, one skip, one flagged typo left for review).
5. A forecast of the live event.

The live event: alert to all pilot areas, 600 kW, 2 h; simulator seed **`LIVE_EVENT.seed`** in
`apps/api/scripts/demo/live.ts` (type it in Simulator > Realism > Random seed; do not re-seed on stage).
With that seed Bagumbayan reaches its target from simulated households alone; testers' commits only
add to it. If the reset's data changes, run `pnpm demo:seed-search` and update the seed. The reset
prints each demo account's last meter reading: a tester must type a higher one. The accounts'
registered location (the GPS check, 200 m) is the venue, `DEMO_VENUE` in
`apps/api/scripts/demo/accounts.ts` (Ortigas, Pasig); set `DEMO_LAT`/`DEMO_LNG` for another venue. Run the reset before
phones are handed out (each replayed alert is open for a few seconds).

### Guardrails

- Only opted-in households get alerts. Every alert is logged with sender and time.
- Privacy (Data Privacy Act 2012): privacy notice and opt-in consent during onboarding, results reported per barangay,
  meter photos and readings are personal data, so private bucket and limited retention.
- Live updates are short polling, about every 2 seconds. SSE or realtime only if time allows.

## Open decisions (do not decide these silently; ask)

- (Decided: the database is **Neon**. See "Database" below.)
- (Decided: meter photos go to a private **Cloudflare R2** bucket bound to the API Worker, never public.)
- (Decided: smart-meter 5-minute data goes to its own `ami_intervals` table; `meter_readings` is photo-only.)
- (Decided: env and secrets live in **Doppler**, project `kapitwatt`. See "Environment" below.)
- **Which barangays:** the 21 names in `PILOT_BARANGAYS` (`packages/shared/src/constants.ts`) are real PSA
  names, but which 3 per town is our own sample. Change them there, then run `pnpm db:seed`.
- **Liliw franchise coverage** and **Laguna smart-meter coverage:** to confirm with Meralco.
- **Lint:** no ESLint config yet; Prettier only.

## Environment (Doppler)

- Every secret and env var lives in Doppler, project `kapitwatt` (config `dev` for local work). The
  committed `doppler.yaml` names the project and config; it holds no secrets.
- Once per machine: `doppler login` (add `--scope <repo path>` if you also use other Doppler workplaces),
  then `doppler setup` in the repo root.
- The root scripts (`dev:*`, `db:*`, `deploy:api`) run under `doppler run --`, so values reach the process
  env and are never written to disk. Expo reads `EXPO_PUBLIC_*` from it at bundle time.
- The API Worker declares `secrets.required` in `wrangler.jsonc`, so `wrangler dev` reads them from the
  process env. **Do not create `apps/api/.dev.vars`**: if it exists, wrangler uses it instead of Doppler.
- Never print secret values. To see what is set: `doppler secrets --only-names`.

## Database (Neon)

- Linked with the Neon CLI (`neon`, not `neonctl`): the gitignored `.neon` file pins the org, project and
  branch (`production`). `neon.ts` at the root declares Neon services; Postgres only for now.
- `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) come from Doppler. (`neon env pull` still
  works for a quick local `.env.local`, which the db scripts read if present, but Doppler is the source.)
- **App traffic uses the pooled `DATABASE_URL`** through `@neondatabase/serverless` over HTTP (Neon's
  recommendation for Workers without Hyperdrive). One HTTPS request per query, nothing to pool or close.
  For atomic multi-statement writes such as settlement, use `db.transaction([...])`.
- **Migrations use the direct `DATABASE_URL_UNPOOLED`** via `pnpm db:migrate`. Add a new numbered file in
  `packages/db/migrations/`; never edit an applied one, never run ad hoc DDL. Applied files are recorded in
  the `schema_migrations` table.
- For risky schema changes, branch first: `neon checkout dev-<name> --create`, migrate there, then apply
  to `production`.
- `GET /health/db` shows the connected database and applied migrations.

## Deploy targets

Live API: https://kapitwatt-api.dheyn-main.workers.dev (use as `EXPO_PUBLIC_API_URL` on phones).

- API: `pnpm deploy:api` (from `main`, clean tree) checks the Doppler secrets, the Cloudflare login and the
  R2 photo bucket, then runs `wrangler deploy --secrets-file`: the version and its secrets (`DATABASE_URL`,
  `SIM_KEY`, `OPERATOR_KEY`, `EXPO_ACCESS_TOKEN` if set) go up together. Then run
  `doppler run -- pnpm --filter @kapitwatt/api smoke:live`. Cloudflare access: `npx wrangler login`, or a
  `CLOUDFLARE_API_TOKEN` in Doppler.
- Dashboard: https://kapitwatt.dhekode.com. `pnpm deploy:dashboard` exports the web build with the
  Doppler env and deploys it as static assets on Cloudflare Workers (`apps/dashboard/wrangler.jsonc`).
  The API must list that origin in `ALLOWED_ORIGINS` (`apps/api/wrangler.jsonc`), so redeploy the API
  when the origin changes; otherwise the browser blocks every call (CORS).
- Mobile: Android APK, downloaded from https://get.kapitwatt.dhekode.com (`apps/landing`, deployed with
  `pnpm deploy:landing`). The button links to `releases/latest/download/KapitWatt.apk` on this repo's
  GitHub Releases, so a new release needs no page change.
  - **Native change or new version** (permission, native package, icon, `expo.version`): bump
    `expo.version` in `apps/mobile/app.json`, merge to `main`, then `pnpm release:mobile` (EAS profile
    `release`: APK, channel `release`, Android versionCode auto-incremented on EAS).
  - **JS/UI change:** merge to `main`, then `pnpm update:mobile -- "what changed"` (EAS Update, channel
    `release`). It reaches APKs with the same `expo.version` (runtimeVersion policy `appVersion`); phones
    download it on launch and use it the launch after.
  - No Firebase yet, so no remote push in the APK: the app checks for alerts while it is open. Adding
    FCM later is a native change (new APK).
  - Expo Go during development.

## Conventions

- **UI work: read `DESIGN.md` first** (repo root, Google Stitch format): tokens, reserved colours, type,
  layout, components and do's and don'ts. Build with `@kapitwatt/ui`, `@kapitwatt/icons` and
  `@kapitwatt/hooks`; `@kapitwatt/tokens` is the source of truth and a test keeps `DESIGN.md` in sync with it.
- TypeScript strict everywhere. Prettier (single quotes, 100 columns).
- Never commit `.env`, `.dev.vars` or any key. Secrets live in Doppler; the `*.example` files only list
  names.
- Money is PHP rounded to 2 decimals; kW is kept to 0.1 (matches the plan's worked example).
- Use server time for anything that affects a payout, never the phone clock.
- **Branching: feature branch -> `dev` -> `main`.** `dev` is the default branch and where work
  integrates. `main` is protected: it only changes through a pull request, and nobody pushes to it.
  - Branch from the latest `dev`: `git switch -c <area>/<topic> origin/dev` (for example
    `mobile/commit-screen`, `api/settlement`). One owner per branch, kept short (a few hours at most).
  - Open a pull request into `dev` and squash-merge it once CI (`.github/workflows/ci.yml`: typecheck
    and test) passes; the branch is deleted on merge. The PR is the normal path but is not enforced on
    `dev`: a small change inside your own folder may be pushed straight to `dev`.
  - Before opening the PR and whenever `dev` moves: `git fetch origin && git rebase origin/dev`.
  - `dev` is promoted to `main` by a `dev` -> `main` pull request, which requires CI to pass, merged
    with a **merge commit** (never squash, or the two branches diverge). `main` is what gets deployed
    and demoed; promote only after an end-to-end run works on `dev`.
  - Urgent demo fix: branch from `main` as `hotfix/<topic>`, PR into `main`, then merge `main` back
    into `dev`.
- Commit small and often on your branch. Prefix commits and PR titles with the area, for example
  `mobile: commit screen` or `api: settlement`.
- **No AI attribution in git, ever.** No `Co-Authored-By` trailer for any AI tool, no "Generated with"
  line, and no mention of Claude, Anthropic or any AI assistant in commit messages, PR titles or PR
  descriptions. This overrides any tool default. `.claude/settings.json` turns the trailers off for
  Claude Code; do not remove it. The human who commits is the only author.
