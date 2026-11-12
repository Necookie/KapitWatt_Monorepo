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
packages/
  shared/      Zod schemas, types, constants, baseline + payout + check math   @kapitwatt/shared
  db/          Postgres schema, migrations, query helpers                   @kapitwatt/db
  sim/         Laguna seed data + event runner (demo only)                  @kapitwatt/sim
  config/      Shared tsconfig base                                         @kapitwatt/config
docs/          The full plan (PDF, source of truth), PRD, SRS, MVP
```

Inside each app:

- `apps/mobile/src/app/` and `apps/dashboard/src/app/`: Expo Router routes only. One file per screen.
  Components go in `src/components/`, API client and helpers in `src/lib/`.
- `apps/api/src/routes/`: one Hono router per resource, kept thin (validate, call a service, respond).
  Business logic goes in `src/services/` (see its README for the planned files). Auth in `src/middleware/`.
- `packages/shared/src/schemas/` (enums, entities, requests, sim) and `src/math/` (payout, baseline,
  barangay, checks).

Screens and API routes are currently placeholders that return a `Placeholder` component or HTTP 501.
Replace them in place; keep the route paths.

## Commands

```bash
pnpm install                 # once, from the repo root
pnpm dev:api                 # wrangler dev on http://localhost:8787
pnpm dev:mobile              # expo start (Expo Go / dev build)
pnpm dev:dashboard           # expo start --web
pnpm typecheck               # tsc --noEmit in every package
pnpm test                    # vitest in shared and sim
pnpm format                  # prettier
pnpm build                   # typecheck all + bundle API (dry run) + export dashboard
neon env pull                # write the linked Neon branch's DATABASE_URL(s) to .env.local
pnpm db:migrate              # apply packages/db/migrations/*.sql (direct connection)
pnpm db:seed                 # load the 21 pilot barangays (reference data, safe to re-run)
pnpm db:smoke                # insert, read back, delete one row through the app's driver
pnpm --filter @kapitwatt/dashboard build   # expo export -> apps/dashboard/dist
pnpm deploy:api              # wrangler deploy, then upload DATABASE_URL, SIM_KEY, OPERATOR_KEY
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
   as a service account for simulated rows only.
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

**Household app, P0:** sign-up and opt-in (town, barangay, consent, meter type and serial); commit a cut
(presets 0.5, 1, 1.5, 2 kW or stepper, max from baseline and trust score); rehearsal event (photo
households); meter photo capture; grid alert push (SMS mocked); event screen (countdown, commitment,
photo deadlines, barangay progress bar, live reduction for smart-meter households); result card; points,
leaderboard, history. **P1:** appliance helper, trust score and commit cap. **P2:** home monitor link,
bill credit redemption.

**Dashboard, P0:** alert form (level, window, target barangays, target kW, message preview, confirm);
live committed load vs target; delivered load by town and barangay with target-hit marker and drill-down;
Measure (fast-forward); simulation controls. **P1:** flagged readings list; schedule, reminder, cancel,
alert log; load curve and relief forecast. **P2:** feeder-level check.

**API, P0:** token auth and opt-in; alert and commitment endpoints with live totals; meter reading
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
- **Trust score (P1):** starts neutral, rises with clean settled events, falls with flagged readings; sets
  the largest cut a household can commit.
- All reward constants are placeholders (PHP 8.40/kWh, 0.6, 20%, 100 points/kWh, peak factor 2). The real
  rate would be set by Meralco and the ERC.

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

### Guardrails

- Only opted-in households get alerts. Every alert is logged with sender and time.
- Privacy (Data Privacy Act 2012): opt-in consent on the sign-up screen, results reported per barangay,
  meter photos and readings are personal data, so private bucket and limited retention.
- Live updates are short polling, about every 2 seconds. SSE or realtime only if time allows.

## Open decisions (do not decide these silently; ask)

- (Decided: the database is **Neon**. See "Database" below.)
- **Photo storage:** Cloudflare R2 or Supabase Storage (private bucket either way).
- **Which barangays:** the 21 names in `PILOT_BARANGAYS` (`packages/shared/src/constants.ts`) are real PSA
  names, but which 3 per town is our own sample. Change them there, then run `pnpm db:seed`.
- **Liliw franchise coverage** and **Laguna smart-meter coverage:** to confirm with Meralco.
- **Lint:** no ESLint config yet; Prettier only.

## Database (Neon)

- Linked with the Neon CLI (`neon`, not `neonctl`): the gitignored `.neon` file pins the org, project and
  branch (`production`). `neon.ts` at the root declares Neon services; Postgres only for now.
- `neon env pull` (or `neon deploy`) writes `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct)
  into the root `.env.local`. Never commit it. `pnpm dev:api` loads it automatically.
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

- API: `wrangler deploy` to Cloudflare Workers. Secrets `DATABASE_URL`, `SIM_KEY`, `OPERATOR_KEY` via
  `wrangler secret put`; local values in `apps/api/.dev.vars` (copy from `.dev.vars.example`).
- Dashboard: `expo export --platform web`, then Cloudflare Pages serving `apps/dashboard/dist`.
- Mobile: EAS build, Android APK. Expo Go during development. Push needs real phones; test it by hour 8 to 12.

## Conventions

- TypeScript strict everywhere. Prettier (single quotes, 100 columns).
- Never commit `.env`, `.dev.vars` or any key. Only the `*.example` files are tracked.
- Money is PHP rounded to 2 decimals; kW is kept to 0.1 (matches the plan's worked example).
- Use server time for anything that affects a payout, never the phone clock.
- Commit small and often to `main`; pull before you push. Prefix commits with the area, for example
  `mobile: commit screen` or `api: settlement`.
