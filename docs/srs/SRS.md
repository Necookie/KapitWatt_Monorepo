# KapitWatt: Software Requirements Specification (SRS)

|              |                                                                                    |
| ------------ | ---------------------------------------------------------------------------------- |
| Product      | KapitWatt, residential demand response for Meralco                                 |
| Team         | CodeBearers, IDOL Hackathon 2026 (24-hour build)                                   |
| Source       | [`KapitWatt_Full_Plan.pdf`](../KapitWatt_Full_Plan.pdf), updated November 12, 2026 |
| Related docs | [PRD](../prd/PRD.md), [MVP](../mvp/MVP.md), [index](../README.md)                  |

> **Scope: Laguna pilot, simulated.** The software is real. The households, NGCP alerts and reward rates
> are simulated or placeholders.

## 1. Introduction

### 1.1 Purpose

This document states what the KapitWatt software must do, as numbered requirements a builder can
implement and a tester can check. The product intent behind them is in the [PRD](../prd/PRD.md); which of
them must work in the demo is in the [MVP](../mvp/MVP.md).

### 1.2 System scope

Four pieces of software and one shared library:

| Component         | Package                | Runs on                              |
| ----------------- | ---------------------- | ------------------------------------ |
| Household app     | `@kapitwatt/mobile`    | Android (Expo + React Native, APK)   |
| Utility dashboard | `@kapitwatt/dashboard` | Browser (Expo web)                   |
| API               | `@kapitwatt/api`       | Cloudflare Workers (Hono)            |
| Simulator         | `@kapitwatt/sim`       | Inside the API, behind `/sim` routes |
| Shared            | `@kapitwatt/shared`    | Imported by all of the above         |
| Database access   | `@kapitwatt/db`        | Imported by the API only             |

### 1.3 Definitions

| Term            | Meaning                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| NGCP            | National Grid Corporation of the Philippines; raises yellow and red grid alerts        |
| ILP             | Interruptible Load Program; Meralco's existing demand response for large customers     |
| AMI             | Advanced Metering Infrastructure; Meralco smart meters recording in 5-minute intervals |
| Path            | How a cut is verified: `ami` (smart-meter data) or `photo` (in-app meter photos)       |
| Window          | The peak period of an alert, from `window_start` to `window_end` (default 2 hours)     |
| Baseline        | The kW a household would have drawn in the window without the event                    |
| Commitment      | A household's promise to cut a number of kW during one alert's window                  |
| Rehearsal       | Practice event at sign-up for photo households; sets the baseline                      |
| Settlement      | Computing verified kWh, credit, bonus and points; runs at window end plus 30 min       |
| Verified cut    | A cut backed by a passing or approved meter reading                                    |
| Flagged reading | A reading that failed a rule check and waits for a person to approve or reject it      |
| Simulated row   | Data created by the simulator, marked `is_simulated`                                   |

### 1.4 Requirement conventions

- **shall** marks a requirement. Each has an ID and a priority: P0 (must work in the demo), P1 (if time
  allows), P2 (slide or stub only; do not build).
- Numbers such as PHP 8.40, 0.6, 20%, 15 min and 30 min are quoted for readability. In code they shall be
  read from `packages/shared/src/constants.ts` and never inlined (see NFR-M4).

## 2. Overall description

### 2.1 System context

```
 Household app (Android) ──┐
                           │  HTTPS, JSON (photo upload: multipart)
 Utility dashboard (web) ──┼──────────────►  API (Hono on Workers) ──► Postgres (Neon, HTTP driver)
                           │                        │  │
 Simulator (demo only) ────┘  via SimPort,          │  └────────────► Photo storage (private bucket)
                              same services         └───────────────► Expo Push Service ──► phones
```

All clients call the same API. The shared package is imported by everything, so commit, baseline and
reward logic is identical for phones and simulated households.

### 2.2 User classes

| Class            | Authenticates with                         | Can do                                                 |
| ---------------- | ------------------------------------------ | ------------------------------------------------------ |
| Household        | Bearer token issued at registration        | Register, commit, submit readings, read own results    |
| Operator         | Shared operator key (`x-operator-key`)     | Create and manage alerts, fast-forward, settle, review |
| Simulator runner | Simulator key (`x-sim-key`), demo env only | Seed, run, reset, status; touches simulated rows only  |

### 2.3 Operating environment

- Mobile: Android, Expo SDK 58, Expo Go during development, EAS-built APK for the demo. Push needs real
  phones.
- Dashboard: a current desktop browser; static export served from Cloudflare Pages.
- API: Cloudflare Workers. Postgres on Neon through `@neondatabase/serverless` over HTTP.
- Language: TypeScript (strict) everywhere. Monorepo: pnpm workspaces, hoisted node-linker.

### 2.4 Design constraints

| ID   | Constraint                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| C-1  | Apps never import each other. They talk through the API and `@kapitwatt/shared`.                               |
| C-2  | The simulator never inserts rows. It calls the same service functions real households hit, through `SimPort`.  |
| C-3  | Only `apps/api` and `packages/db` touch Postgres. The driver is imported in `packages/db` only.                |
| C-4  | Push is sent only from the API, through Expo Push.                                                             |
| C-5  | Internal packages export TypeScript source with `workspace:*` deps. No build step.                             |
| C-6  | One pinned `react` and `react-native` version at the root.                                                     |
| C-7  | One env var, `EXPO_PUBLIC_API_URL`, for both Expo apps (the dashboard also carries two demo-only keys).        |
| C-8  | One schema everywhere: request and entity shapes are Zod schemas in `packages/shared`. No local redefinitions. |
| C-9  | No machine learning and no trained model. Photo checks are plain rules.                                        |
| C-10 | The build window is 24 hours. P2 items are not built.                                                          |

### 2.5 Assumptions and dependencies

- Expo Push Service is reachable from Workers and from the demo phones.
- The demo runs on the team's own mobile hotspot.
- Meralco AMI data is not available; the AMI feed is simulated.
- Simulation defaults (participation 60%, follow-through 80%, 15% AMI, photo completion 90%, baseline
  noise 10%, 1 kW cut) are assumptions and are shown as such.

## 3. Functional requirements

### 3.1 Household app (`apps/mobile`)

Screens (Expo Router, one file per screen under `src/app/`): `index` (home), `sign-up`, `rehearsal`,
`alert/[alertId]/index` (event), `alert/[alertId]/commit`, `alert/[alertId]/capture`,
`alert/[alertId]/result`, `leaderboard`, `history`, `appliances`.

| ID        | Requirement                                                                                                                                                                                 | Pri |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-APP-01 | The app shall let a household sign up by picking a town and barangay from the pilot list, entering meter type (`ami` or `standard`), meter serial and average monthly bill kWh.             | P0  |
| FR-APP-02 | Sign-up shall require explicit consent to alerts and data use, with text that names the Data Privacy Act 2012 and states that meter photos and readings are stored. No consent, no account. | P0  |
| FR-APP-03 | Sign-up shall capture the registered address location (lat, lng) for the GPS check and register the device's Expo push token.                                                               | P0  |
| FR-APP-04 | A photo household shall complete a rehearsal after sign-up: the same two photos and typed readings as a real event. It shall double as the tutorial and set the baseline.                   | P0  |
| FR-APP-05 | The app shall receive a push notification for a yellow or red alert showing the level and the peak window, and open the event screen from it. SMS is mocked.                                | P0  |
| FR-APP-06 | If the push is missed, opening the app or pulling to refresh shall show the active alert.                                                                                                   | P0  |
| FR-APP-07 | The commit screen shall offer presets of 0.5, 1, 1.5 and 2 kW and a stepper. The household commits to a number of kW, never to a list of appliances.                                        | P0  |
| FR-APP-08 | The commit screen shall not allow a cut above the household's maximum, which the API derives from its baseline and trust score.                                                             | P0  |
| FR-APP-09 | The event screen shall show a countdown to window start or end, the commitment, the photo deadlines (photo path) and a barangay progress bar.                                               | P0  |
| FR-APP-10 | For smart-meter households the event screen shall show live reduction against baseline during the window and shall not ask for photos.                                                      | P0  |
| FR-APP-11 | The capture screen shall take the meter photo with the in-app camera only. It shall offer no gallery or file picker.                                                                        | P0  |
| FR-APP-12 | The capture screen shall require a typed reading and send photo, reading, kind (`rehearsal`, `before`, `after`) and device GPS to the API.                                                  | P0  |
| FR-APP-13 | The app shall show each photo deadline and, once a deadline has passed or a reading exists for that kind, shall not offer capture again (no resubmission).                                  | P0  |
| FR-APP-14 | After a submission the app shall show whether the reading passed or was flagged for review.                                                                                                 | P0  |
| FR-APP-15 | After settlement the result card shall show verified cut (kW and kWh), bill credit, barangay bonus and points, and say why when the payout is zero.                                         | P0  |
| FR-APP-16 | The app shall show total points, a barangay leaderboard and a history of past events with their results.                                                                                    | P0  |
| FR-APP-17 | The app shall label simulated or placeholder elements (reward rates, NGCP alert) plainly in its copy.                                                                                       | P0  |
| FR-APP-18 | The app shall poll the API about every 2 seconds on the event screen for progress and status.                                                                                               | P0  |
| FR-APP-19 | An optional appliance helper shall list appliances with rated kW and suggest what to switch off to reach the cut. It shall state that it is not used for payment.                           | P1  |
| FR-APP-20 | The app shall show the household's trust score and the commit cap it implies.                                                                                                               | P1  |
| FR-APP-21 | Home monitor link and bill credit redemption.                                                                                                                                               | P2  |

### 3.2 Utility dashboard (`apps/dashboard`)

Screens: `index` (live overview), `alerts/new`, `alerts/log`, `towns/[town]`, `flagged`, `simulator`.

| ID         | Requirement                                                                                                                                                                         | Pri |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-DASH-01 | The alert form shall take level (yellow or red), window start and end (default 2 hours, with quick presets), target barangays (towns, barangays, or all pilot areas) and target kW. | P0  |
| FR-DASH-02 | The alert form shall show a preview of the message households will receive.                                                                                                         | P0  |
| FR-DASH-03 | Sending shall require a confirm step that states level, number of towns and approximate households, for example "Send red alert to 7 towns, about 1,200 households?".               | P0  |
| FR-DASH-04 | The overview shall show total committed kW against the alert target, updating as households commit.                                                                                 | P0  |
| FR-DASH-05 | The overview shall show verified delivered kW against target per town, with drill-down from a town to its barangays.                                                                | P0  |
| FR-DASH-06 | Each barangay shall show delivered kW against its own target and a marker when it has hit 100%.                                                                                     | P0  |
| FR-DASH-07 | A "Measure (fast-forward)" control shall end the window, compress the photo timers and trigger settlement. It shall be available in the demo environment only.                      | P0  |
| FR-DASH-08 | The simulator panel shall expose participation, follow-through, path mix, photo completion and preset, plus seed, run event and reset actions.                                      | P0  |
| FR-DASH-09 | Simulation parameters in force shall stay visible on the dashboard and be labelled as assumptions. The dashboard shall state that households are simulated.                         | P0  |
| FR-DASH-10 | Live figures shall refresh by short polling about every 2 seconds.                                                                                                                  | P0  |
| FR-DASH-11 | A flagged readings list shall show each reading that failed a rule check with its photo, typed reading, previous reading and flags, and let a person approve or reject it.          | P1  |
| FR-DASH-12 | The operator shall be able to schedule a send, send a reminder 15 minutes before the window, and cancel an alert (which sends an alert-lifted push).                                | P1  |
| FR-DASH-13 | An alert log shall list every alert with sender, time, level, window and targets.                                                                                                   | P1  |
| FR-DASH-14 | A load curve shall show baseline versus actual with relief shaded, and a relief forecast (committed kW times follow-through rate).                                                  | P1  |
| FR-DASH-15 | Feeder-level check comparing barangay feeder load with forecast.                                                                                                                    | P2  |

### 3.3 API (`apps/api`)

#### Auth and opt-in

| ID        | Requirement                                                                                                                                                                                                    | Pri |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-API-01 | `POST /auth/register` shall create a household from `RegisterHouseholdInput`, record `opted_in` and `consent_at`, and return the household and a bearer token. Registration without consent shall be rejected. | P0  |
| FR-API-02 | The API shall store only a hash of the household token and identify the household from the `Authorization: Bearer` header on protected routes.                                                                 | P0  |
| FR-API-03 | `PUT /auth/push-token` shall store or refresh the household's Expo push token.                                                                                                                                 | P0  |
| FR-API-04 | `GET /auth/me` shall return the current household with baseline, trust score, commit cap and points.                                                                                                           | P0  |
| FR-API-05 | Operator routes shall require the operator key; simulator routes shall require the simulator key and return 404 unless `APP_ENV` is `demo`.                                                                    | P0  |
| FR-API-06 | `GET /barangays` shall list the pilot barangays for the sign-up picker and the alert form.                                                                                                                     | P0  |

#### Alerts and commitments

| ID        | Requirement                                                                                                                                                            | Pri |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-API-10 | `POST /alerts` shall validate `CreateAlertInput`, store the alert with `created_by` and `created_at`, and dispatch push. An empty target list means all pilot areas.   | P0  |
| FR-API-11 | The alert's target kW shall be split across targeted barangays in proportion to opted-in households. An operator override of a barangay's share shall take precedence. | P0  |
| FR-API-12 | `GET /alerts/active` and `GET /alerts/:id` shall return the alert with its status (`scheduled`, `active`, `window_open`, `settling`, `settled`, `cancelled`).          | P0  |
| FR-API-13 | `POST /commitments` shall record one commitment per household per alert, with the path taken from the household's meter type and a snapshot of its baseline.           | P0  |
| FR-API-14 | A commitment shall be rejected if the household is not opted in, is outside the targeted barangays, has no baseline, or asks for more than its cap.                    | P0  |
| FR-API-15 | `GET /alerts/:id/totals` shall return `AlertTotals`: target, committed and delivered kW overall and per barangay with `targetHit`.                                     | P0  |
| FR-API-16 | `GET /commitments/by-alert/:alertId` and `GET /commitments/history` shall return the household's own commitment for an alert and its past commitments.                 | P0  |
| FR-API-17 | `POST /alerts/:id/cancel` shall cancel an alert and send an alert-lifted push. Scheduled sends and reminder pushes shall be supported.                                 | P1  |

#### Push

| ID        | Requirement                                                                                                                  | Pri |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-API-20 | Push shall be sent through Expo Push only to households that are opted in, have a push token and are in a targeted barangay. | P0  |
| FR-API-21 | Simulated households shall never be sent a push.                                                                             | P0  |
| FR-API-22 | A push failure shall not fail alert creation; the alert stays stored so the app can fetch it.                                | P0  |

#### Meter readings and rule checks

| ID        | Requirement                                                                                                                                                                                   | Pri |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-API-30 | `POST /readings` shall accept multipart form data: the photo file plus `SubmitReadingInput` (kind, alert id unless rehearsal, typed reading, lat, lng).                                       | P0  |
| FR-API-31 | The API shall set `captured_at` from server time at upload. The phone clock shall never be used for a deadline or a payout.                                                                   | P0  |
| FR-API-32 | **Timing.** A `before` reading shall be on time only from window start to window start plus 15 min; an `after` reading only from window end to window end plus 30 min. Otherwise flag `late`. | P0  |
| FR-API-33 | **Meter match.** The serial registered at sign-up must appear in the photo. Otherwise flag `serial_mismatch`.                                                                                 | P0  |
| FR-API-34 | **Location.** The submitted GPS position must be within a set distance of the registered address. Otherwise flag `too_far`.                                                                   | P0  |
| FR-API-35 | **Reading.** The typed reading must not be lower than the previous one (`not_increasing`) and must not exceed what the service could draw in the elapsed time (`implausible_draw`).           | P0  |
| FR-API-36 | **Duplicates.** The API shall hash the photo file and reject a photo whose hash already exists (`duplicate_photo`).                                                                           | P0  |
| FR-API-37 | **No resubmission.** At most one `before` and one `after` reading shall exist per commitment. A second submission of the same kind shall be refused.                                          | P0  |
| FR-API-38 | A reading with any flag shall be stored with `check_status = flagged` and its flags; a reading with none is `pass`. A late, missing or failed photo earns no payout.                          | P0  |
| FR-API-39 | Photos shall be stored in a private bucket. Photo URLs shall not be publicly readable.                                                                                                        | P0  |
| FR-API-40 | A `rehearsal` pair shall have `commitment_id` null and shall set the household's `baseline_kw` (see FR-API-50).                                                                               | P0  |
| FR-API-41 | `GET /readings/flagged` shall list flagged readings; `POST /readings/:id/review` shall record approve or reject with `reviewed_by`. An approved photo cut counts at full weight.              | P1  |
| FR-API-42 | Optional OCR may add `ocr_mismatch` when the display disagrees with the typed reading. It shall only flag, never reject, and shall be off in the demo environment.                            | P1  |

#### Baseline, settlement and rewards

| ID        | Requirement                                                                                                                                                                                                                 | Pri |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-API-50 | Photo-path baseline shall be the kW measured in the rehearsal window, limited by the bill cap. AMI-path baseline shall be the average kW over the same hours on comparable past days.                                       | P0  |
| FR-API-51 | `actual_kw` shall be (after reading minus before reading) divided by the hours between the two readings.                                                                                                                    | P0  |
| FR-API-52 | `cut_kw = max(0, baseline_kw - actual_kw)`; `cap_kw = peak factor x (bill_avg_kwh_month / 720)`; `paid_cut_kw = min(cut_kw, committed_kw, cap_kw)`.                                                                         | P0  |
| FR-API-53 | `verified_kwh = paid_cut_kw x scheduled window hours`. Elapsed photo time shall not add paid hours.                                                                                                                         | P0  |
| FR-API-54 | `credit_php = verified_kwh x rate x path multiplier` (AMI 1.0, photo 0.6); `points = 100 x verified_kwh`.                                                                                                                   | P0  |
| FR-API-55 | Barangay progress shall be verified delivered kW divided by the barangay target. At 100% or more at settlement, every household there with a verified cut gets a bonus of 20% of its own credit. No verified cut, no bonus. | P0  |
| FR-API-56 | Settlement shall run at window end plus 30 min, set each commitment to `verified`, `unverified` or `flagged`, write one reward row per commitment and set the alert to `settled`.                                           | P0  |
| FR-API-57 | Settlement writes shall be atomic (`db.transaction([...])`) and safe to run twice without paying twice.                                                                                                                     | P0  |
| FR-API-58 | `POST /alerts/:id/fast-forward` shall end the window and compress the photo timers; `POST /alerts/:id/settle` shall run settlement now. Both are operator-only demo controls.                                               | P0  |
| FR-API-59 | An AMI household with missing interval data shall get no payout and its commitment shall be flagged.                                                                                                                        | P0  |
| FR-API-60 | `GET /rewards/by-alert/:alertId` shall return the household's result card; `GET /rewards/summary` its totals; `GET /barangays/leaderboard` the barangay ranking.                                                            | P0  |
| FR-API-61 | All baseline, payout and check math shall come from `@kapitwatt/shared`, and shall reproduce the plan's worked example: 1.6 kWh, PHP 8.06 credit, PHP 1.61 bonus, 160 points (AMI: PHP 13.44).                              | P0  |
| FR-API-62 | Trust score shall start neutral, rise with clean settled events, fall with flagged readings, and set the largest cut a household can commit.                                                                                | P1  |
| FR-API-63 | An AMI feed adapter shall supply interval readings behind one interface. It is simulated in the demo.                                                                                                                       | P1  |

#### Health

| ID        | Requirement                                                                                         | Pri |
| --------- | --------------------------------------------------------------------------------------------------- | --- |
| FR-API-70 | `GET /health` shall report the environment; `GET /health/db` the connected database and migrations. | P0  |

### 3.4 Simulator (`packages/sim` and `/sim` routes)

| ID        | Requirement                                                                                                                                                                                  | Pri |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| FR-SIM-01 | `POST /sim/seed` shall create about 1,200 simulated households and their appliances across the 7 towns and 21 barangays, with the configured AMI share.                                      | P0  |
| FR-SIM-02 | `POST /sim/run` shall, for an alert's targeted barangays, make simulated households commit and then generate their delivered kWh.                                                            | P0  |
| FR-SIM-03 | Run parameters shall be `SimParams`: participation (default 0.6, range 0.2 to 0.8), follow-through 0.8, AMI share 0.15, photo completion 0.9, baseline noise 0.1, cut 1 kW, pace 25 s, seed. | P0  |
| FR-SIM-04 | The fake meter feed shall generate AMI interval readings for smart-meter households and before and after readings for photo households, all marked simulated.                                | P0  |
| FR-SIM-05 | Commits shall be spread over about 20 to 30 seconds so the live total rises gradually.                                                                                                       | P0  |
| FR-SIM-06 | `POST /sim/reset` shall delete simulated rows only (`is_simulated`), with cascades removing their appliances, commitments, readings and rewards. Real households stay.                       | P0  |
| FR-SIM-07 | `GET /sim/status` shall return counts, the last run and the current settings.                                                                                                                | P0  |
| FR-SIM-08 | The simulator shall act only through the `SimPort` interface, which is implemented on the same services real households use. It shall never write to the database directly.                  | P0  |
| FR-SIM-09 | Simulator routes shall be off unless `APP_ENV` is `demo` and shall always require the simulator key.                                                                                         | P0  |
| FR-SIM-10 | With default parameters and a 600 kW target over all pilot areas, a run shall produce about 720 kW committed and about 527 kW delivered (about 86 kW AMI, about 441 kW photo).               | P0  |
| FR-SIM-11 | Presets shall be available: poor 30%, typical 60%, best 80% participation.                                                                                                                   | P1  |
| FR-SIM-12 | Runs shall be repeatable from a seed, and a known seed shall make the presenter's barangay reach its target.                                                                                 | P1  |
| FR-SIM-13 | A run shall return a per-town summary.                                                                                                                                                       | P1  |
| FR-SIM-14 | Failure injection (no-shows, late commits) and import of real PSA barangay lists.                                                                                                            | P2  |

## 4. External interfaces

### 4.1 API endpoints

JSON over HTTPS. Request bodies are validated with the Zod schemas in `packages/shared/src/schemas/`.
Route paths below exist in `apps/api/src/routes/` today; most still return HTTP 501 and are to be
implemented in place.

| Method | Path                             | Caller    | Purpose                                      | Pri |
| ------ | -------------------------------- | --------- | -------------------------------------------- | --- |
| GET    | `/health`                        | Anyone    | Liveness and environment                     | P0  |
| GET    | `/health/db`                     | Anyone    | Database and applied migrations              | P0  |
| POST   | `/auth/register`                 | Household | Sign up, opt in, get a token                 | P0  |
| PUT    | `/auth/push-token`               | Household | Store or refresh the Expo push token         | P0  |
| GET    | `/auth/me`                       | Household | Baseline, trust score, commit cap, points    | P0  |
| GET    | `/barangays`                     | Anyone    | Pilot barangays                              | P0  |
| GET    | `/barangays/leaderboard`         | Anyone    | Barangay ranking                             | P0  |
| POST   | `/alerts`                        | Operator  | Create an alert and send the push            | P0  |
| GET    | `/alerts/active`                 | Anyone    | Current alert                                | P0  |
| GET    | `/alerts/:id`                    | Anyone    | One alert                                    | P0  |
| GET    | `/alerts/:id/totals`             | Anyone    | Live committed and delivered kW (polled)     | P0  |
| POST   | `/alerts/:id/fast-forward`       | Operator  | End the window, compress photo timers (demo) | P0  |
| POST   | `/alerts/:id/settle`             | Operator  | Run settlement now                           | P0  |
| POST   | `/alerts/:id/cancel`             | Operator  | Cancel, send alert-lifted push               | P1  |
| POST   | `/commitments`                   | Household | Commit a cut in kW                           | P0  |
| GET    | `/commitments/by-alert/:alertId` | Household | Own commitment for an alert                  | P0  |
| GET    | `/commitments/history`           | Household | Past events                                  | P0  |
| POST   | `/readings`                      | Household | Submit a photo and typed reading (multipart) | P0  |
| GET    | `/readings/flagged`              | Operator  | Flagged readings list                        | P1  |
| POST   | `/readings/:id/review`           | Operator  | Approve or reject a flagged reading          | P1  |
| GET    | `/rewards/by-alert/:alertId`     | Household | Result card                                  | P0  |
| GET    | `/rewards/summary`               | Household | Points and credit totals                     | P0  |
| POST   | `/sim/seed`                      | Simulator | Create simulated Laguna households           | P0  |
| POST   | `/sim/run`                       | Simulator | Run an event for an alert                    | P0  |
| POST   | `/sim/reset`                     | Simulator | Delete simulated data                        | P0  |
| GET    | `/sim/status`                    | Simulator | Counts, last run, settings                   | P0  |

Auth headers: households send `Authorization: Bearer <token>`; the operator sends `x-operator-key`; the
simulator sends `x-sim-key`.

### 4.2 External services

| Service           | Used for                  | Notes                                                              |
| ----------------- | ------------------------- | ------------------------------------------------------------------ |
| Expo Push Service | Alert delivery to phones  | Called only from the API. Needs real phones to test.               |
| Neon Postgres     | All persistent data       | Pooled `DATABASE_URL` over HTTP for the app; direct URL to migrate |
| Photo storage     | Meter photos              | Private bucket. Cloudflare R2 or Supabase Storage: open decision.  |
| Device camera     | Meter photo capture       | In-app camera only                                                 |
| Device location   | GPS check                 | Asked at sign-up and at each capture                               |
| SMS               | Alert fallback            | Mocked                                                             |
| Meralco AMI feed  | Smart-meter interval data | Simulated in the demo                                              |

### 4.3 Configuration

| Variable                | Where                 | Purpose                                         |
| ----------------------- | --------------------- | ----------------------------------------------- |
| `EXPO_PUBLIC_API_URL`   | Mobile and dashboard  | API base URL                                    |
| `DATABASE_URL`          | API (Worker secret)   | Pooled Neon connection                          |
| `DATABASE_URL_UNPOOLED` | Migrations only       | Direct Neon connection                          |
| `OPERATOR_KEY`          | API, dashboard (demo) | Operator routes                                 |
| `SIM_KEY`               | API, dashboard (demo) | Simulator routes                                |
| `APP_ENV`               | API                   | `demo` turns simulator routes and demo tools on |

## 5. Data requirements

Seven tables. SQL is in `packages/db/migrations/0001_init.sql`; Zod mirrors are in
`packages/shared/src/schemas/entities.ts`. The two shall be kept in sync.

| Table            | Holds                                 | Key fields                                                                                                                                                            |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `barangays`      | The 21 pilot barangays                | `name`, `municipality`, `feeder_id`                                                                                                                                   |
| `households`     | Real and simulated households         | `barangay_id`, `meter_type`, `meter_serial`, `bill_avg_kwh_month`, `baseline_kw`, `trust_score`, `opted_in`, `consent_at`, `lat`, `lng`, `push_token`, `is_simulated` |
| `appliances`     | Optional appliance list (helper only) | `household_id`, `type`, `rated_kw`                                                                                                                                    |
| `alerts`         | Every alert sent                      | `level`, `window_start`, `window_end`, `target_kw`, `target_barangay_ids`, `message`, `status`, `created_by`, `created_at`                                            |
| `commitments`    | One per household per alert           | `alert_id`, `household_id`, `committed_kw`, `path`, `baseline_kw` (snapshot), `actual_kw`, `verified_kwh`, `status`                                                   |
| `meter_readings` | Photo readings and AMI feed rows      | `household_id`, `commitment_id` (null for rehearsal), `kind`, `reading_kwh`, `captured_at`, `photo_url`, `photo_hash`, `check_status`, `flags`, `reviewed_by`         |
| `rewards`        | One per settled commitment            | `commitment_id`, `credit_php`, `bonus_php`, `points`                                                                                                                  |

| ID   | Data rule                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| DR-1 | One commitment per (alert, household).                                                                        |
| DR-2 | One reading per (commitment, kind): enforces no resubmission.                                                 |
| DR-3 | `photo_hash` is unique where present: enforces duplicate rejection.                                           |
| DR-4 | One reward per commitment.                                                                                    |
| DR-5 | Deleting a household cascades to its appliances, commitments, readings and rewards (this is how reset works). |
| DR-6 | Schema changes are new numbered migration files. An applied migration is never edited; no ad hoc DDL.         |
| DR-7 | Money is PHP rounded to 2 decimals. kW is kept to 0.1.                                                        |
| DR-8 | `window_end` is after `window_start`; `target_kw`, `committed_kw` and `bill_avg_kwh_month` are positive.      |

## 6. Non-functional requirements

### Performance

| ID     | Requirement                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------ |
| NFR-P1 | Live totals shall be no more than about one poll interval (2 s) behind. SSE or realtime only if time allows.       |
| NFR-P2 | `GET /alerts/:id/totals` shall stay fast enough to poll every 2 s with about 1,200 households and 720 commitments. |
| NFR-P3 | A simulated run of about 720 commits paced over about 25 s shall complete without failed writes.                   |
| NFR-P4 | Push shall reach the demo phones within a few seconds of the operator confirming, on the team hotspot.             |

### Security and privacy

| ID     | Requirement                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| NFR-S1 | Only opted-in households receive alerts. Every alert is logged with sender and time.                                      |
| NFR-S2 | Consent is collected on the sign-up screen and its time stored (Data Privacy Act 2012).                                   |
| NFR-S3 | Meter photos and readings are personal data: private bucket, limited retention, stated on the consent screen.             |
| NFR-S4 | Results are reported per barangay. The dashboard and leaderboard shall not expose another household's readings or photos. |
| NFR-S5 | A household token gives access to that household's data only.                                                             |
| NFR-S6 | No secret is committed. `.env`, `.dev.vars` and keys stay out of git; only `*.example` files are tracked.                 |
| NFR-S7 | The simulator key grants access to simulated rows only, never to real household data.                                     |

### Reliability

| ID     | Requirement                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------- |
| NFR-R1 | Settlement is atomic and idempotent (see FR-API-57).                                                    |
| NFR-R2 | Any deadline or payout decision uses server time.                                                       |
| NFR-R3 | The app and dashboard recover from a dropped connection by refetching; no state lives only in a client. |
| NFR-R4 | Reset followed by seed returns the demo to a known state with 0 kW committed.                           |

### Maintainability

| ID     | Requirement                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------- |
| NFR-M1 | TypeScript strict in every package; `pnpm typecheck` passes.                                                |
| NFR-M2 | `pnpm test` passes; the payout tests cover the plan's worked example.                                       |
| NFR-M3 | API routes stay thin (validate, call a service, respond); business logic lives in `apps/api/src/services/`. |
| NFR-M4 | Reward and timing constants live only in `packages/shared/src/constants.ts`.                                |
| NFR-M5 | Prettier formatting (single quotes, 100 columns).                                                           |

### Usability and transparency

| ID     | Requirement                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------ |
| NFR-U1 | UI copy says plainly what is simulated or a placeholder: households, NGCP alerts, reward rates.        |
| NFR-U2 | A household can go from push to committed cut in a few taps.                                           |
| NFR-U3 | Photo deadlines are always visible to a photo household during an event.                               |
| NFR-U4 | A zero payout always comes with its reason (late photo, missing photo, failed check, no measured cut). |

### Deployment

| ID     | Requirement                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------- |
| NFR-D1 | API deploys with `wrangler deploy` to Cloudflare Workers, with secrets set through `wrangler secret put`. |
| NFR-D2 | Dashboard deploys as `expo export --platform web` output on Cloudflare Pages.                             |
| NFR-D3 | Mobile ships as an Android APK from EAS; Expo Go during development.                                      |

## 7. Verification

| What                         | How it is checked                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Payout and baseline math     | Unit tests in `packages/shared` against the worked example (FR-API-61)                          |
| Photo timing and value rules | Unit tests in `packages/shared` for on-time windows, `not_increasing`, `implausible_draw`       |
| Simulator numbers            | Unit tests in `packages/sim` for the forecast (720 kW committed, about 527 kW delivered)        |
| Types and schemas            | `pnpm typecheck` across all packages                                                            |
| Database                     | `pnpm db:smoke` and `GET /health/db`                                                            |
| End to end                   | The demo script in the [MVP](../mvp/MVP.md), run on real phones, at least twice before going on |
| Push                         | Test push on real phones by hour 8 to 12                                                        |

## 8. Open items

- Photo storage provider (Cloudflare R2 or Supabase Storage).
- The GPS distance threshold and the "service could draw" limit (currently derived from the bill cap).
- How the serial is matched in the photo without ML in the demo (for example a printed mock meter with
  the registered serial, checked by a person or by optional OCR).
- Liliw franchise coverage and Laguna smart-meter coverage: to confirm with Meralco.
- Meter display resolution: older meters may show whole kWh only.
