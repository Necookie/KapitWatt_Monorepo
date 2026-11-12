# KapitWatt: MVP scope and demo plan

|              |                                                                                    |
| ------------ | ---------------------------------------------------------------------------------- |
| Product      | KapitWatt, residential demand response for Meralco                                 |
| Team         | CodeBearers, IDOL Hackathon 2026 (24-hour build)                                   |
| Source       | [`KapitWatt_Full_Plan.pdf`](../KapitWatt_Full_Plan.pdf), updated November 12, 2026 |
| Related docs | [PRD](../prd/PRD.md), [SRS](../srs/SRS.md), [index](../README.md)                  |

> **Scope: Laguna pilot, simulated.** The software is real. The households, NGCP alerts and reward rates
> are simulated or placeholders.

## 1. What the MVP is

The MVP is everything marked **P0**: the smallest build that runs the whole loop, **alert, commit, shift,
measure, reward**, live on stage in about 5 minutes.

One sentence: an operator sends a red alert from the web dashboard, real phones buzz, households commit a
cut, about 1,200 simulated households commit alongside them, photo households take before and after meter
photos, the operator fast-forwards, and a phone shows a result card with a credit, a barangay bonus and
points, while the dashboard shows committed and delivered kW by town and barangay.

## 2. In scope (P0)

Requirement IDs refer to the [SRS](../srs/SRS.md).

### Household app (Person 1, `apps/mobile`)

| Feature                      | Done when                                                                                        | SRS               |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ----------------- |
| Sign-up and opt-in           | Town, barangay, consent, meter type and serial saved; token and push token stored                | FR-APP-01 to 03   |
| Rehearsal event              | A photo household takes two practice photos and gets a baseline                                  | FR-APP-04         |
| Grid alert push              | A real phone receives the alert and opens the event screen; pull to refresh also finds it        | FR-APP-05, 06     |
| Commit a cut                 | Presets 0.5, 1, 1.5, 2 kW or stepper; capped by the API                                          | FR-APP-07, 08     |
| Event screen                 | Countdown, commitment, photo deadlines, barangay progress bar; live reduction for AMI households | FR-APP-09, 10, 18 |
| Meter photo capture          | In-app camera only, typed reading, GPS sent, pass or flagged shown, no second try                | FR-APP-11 to 14   |
| Result card                  | Verified cut, credit, barangay bonus, points; reason shown if zero                               | FR-APP-15         |
| Points, leaderboard, history | Totals, barangay ranking, past events                                                            | FR-APP-16         |

### Utility dashboard (Person 2, `apps/dashboard`)

| Feature                             | Done when                                                                            | SRS              |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ---------------- |
| Alert form                          | Level, window, target barangays, target kW, message preview, confirm step, push sent | FR-DASH-01 to 03 |
| Live committed load                 | Committed kW rises against the target as commits arrive                              | FR-DASH-04, 10   |
| Delivered load by town and barangay | Delivered against target, target-hit marker, town to barangay drill-down             | FR-DASH-05, 06   |
| Measure (fast-forward)              | One button ends the window, compresses photo timers and settles                      | FR-DASH-07       |
| Simulation controls                 | Parameters visible and editable; seed, run and reset work                            | FR-DASH-08, 09   |

### API and database (Person 3, `apps/api`, `packages/db`)

| Feature                        | Done when                                                                                 | SRS             |
| ------------------------------ | ----------------------------------------------------------------------------------------- | --------------- |
| Token auth and opt-in          | Register returns a token; protected routes resolve the household                          | FR-API-01 to 06 |
| Alert and commitment endpoints | Create alert, split target per barangay, record commitments, live totals                  | FR-API-10 to 16 |
| Push dispatch                  | Expo Push to opted-in tokens in targeted barangays only                                   | FR-API-20 to 22 |
| Meter reading endpoints        | Photo upload, server timestamp, rule checks, flags, no resubmission                       | FR-API-30 to 40 |
| Baseline and kWh avoided       | Baseline from rehearsal or AMI history; verified kWh capped by commitment and bill        | FR-API-50 to 53 |
| Settlement                     | Credit, points, barangay target check and bonus; atomic; fast-forward and settle controls | FR-API-54 to 61 |
| Simulator routes               | `/sim/seed`, `/sim/run`, `/sim/reset`, `/sim/status` behind the key, demo env only        | FR-SIM-01 to 09 |

### Simulator and shared math (Person 4, `packages/sim`, `packages/shared`)

| Feature         | Done when                                                                        | SRS           |
| --------------- | -------------------------------------------------------------------------------- | ------------- |
| Seed Laguna     | 7 towns, 21 barangays, about 1,200 households and appliances                     | FR-SIM-01     |
| Run event       | Simulated households commit, then deliver, through the real services             | FR-SIM-02, 08 |
| Parameters      | Participation, follow-through, path mix, photo completion, baseline noise        | FR-SIM-03     |
| Fake meter feed | AMI interval readings and photo-path before and after readings, marked simulated | FR-SIM-04     |
| Paced commits   | Total rises over 20 to 30 seconds                                                | FR-SIM-05     |
| Reset           | Simulated rows only                                                              | FR-SIM-06     |
| Safety          | `is_simulated`, simulator key, off outside demo                                  | FR-SIM-09     |
| Shared math     | Payout, baseline, barangay split and check rules match the plan's worked example | FR-API-61     |

### Pitch and integration (Person 5)

Pitch deck, printed one-page demo script with timings, mock meter, integration testing across the four
pieces, and a screen recording of the full demo as backup.

## 3. Out of scope

### P1: only if P0 is done and rehearsed

| Item                                  | Owner | Build first because                                       |
| ------------------------------------- | ----- | --------------------------------------------------------- |
| Simulator presets and seeded runs     | 4     | The demo wants the presenter's barangay to hit its target |
| Flagged readings list                 | 2, 3  | Shows the human review step behind the rule checks        |
| Load curve and relief forecast        | 2     | Makes the delivered number visual                         |
| Trust score and commit cap            | 3, 1  | Until then the cap comes from the baseline and the bill   |
| Appliance helper                      | 1     | Helper only, never used for payment                       |
| Schedule, reminder, cancel, alert log | 2, 3  | Send-now is enough for the demo                           |
| AMI feed adapter                      | 3     | The simulator's fake feed covers the demo                 |
| Run summary per town                  | 4     |                                                           |

### P2: slide or stub only, do not build

Home monitor link, bill credit redemption, feeder-level check, failure injection, real PSA barangay
import.

### Not in the product at all

Real SMS (mocked), real Meralco AMI data, real money, iOS, any trained model, payment from appliance
declarations.

## 4. What is real and what is simulated

Say this plainly in the UI and in the pitch.

| Real                                                        | Simulated or placeholder                                        |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| The household app, dashboard, API and database              | About 1,200 households, their appliances and their meter data   |
| Push to real phones                                         | The NGCP alert (the operator plays Meralco)                     |
| The alert, commit, reading, check and settlement code paths | The AMI interval feed                                           |
| Baseline and payout math                                    | Reward rate PHP 8.40 per kWh, multiplier 0.6, bonus 20%, points |
| Team phones as households in Santa Cruz                     | The meter itself: a printed mock meter or a tablet              |
| Town and barangay names (PSA)                               | Household counts per town; which 3 barangays per town           |

## 5. Acceptance criteria

The MVP is accepted when all of these pass on the deployed API, the deployed dashboard and an installed
APK, over the team hotspot.

| #   | Check                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | After reset and seed, the dashboard shows the Laguna pilot with 0 kW committed and about 1,200 households.                          |
| 2   | A new phone can sign up with consent, pick a Santa Cruz barangay and register a meter serial.                                       |
| 3   | A photo household completes the rehearsal and has a baseline.                                                                       |
| 4   | The operator sends a red alert for a 2-hour window to all 7 towns with a 600 kW target, after a confirm step.                       |
| 5   | Two or three real phones receive the push within seconds. Simulated households receive nothing.                                     |
| 6   | A phone commits a 1 kW cut and the dashboard total goes up within about 2 seconds.                                                  |
| 7   | Running the simulator raises committed load gradually over about 25 seconds to about 720 kW.                                        |
| 8   | A phone takes the before photo with the in-app camera, types the reading and sees it accepted. There is no gallery option.          |
| 9   | A before photo sent after the 15-minute deadline, a reused photo and a reading lower than the last one are each flagged or refused. |
| 10  | Measure (fast-forward) ends the window; the phone can take the after photo; a second after photo is refused.                        |
| 11  | After settlement the dashboard shows about 527 kW delivered (about 88% of target) by town and barangay, with target-hit markers.    |
| 12  | The phone shows a result card with verified kWh, credit, barangay bonus and points.                                                 |
| 13  | For the plan's worked example the system returns 1.6 kWh, PHP 8.06 credit, PHP 1.61 bonus and 160 points; PHP 13.44 on AMI.         |
| 14  | An AMI household gets a result with no photos and saw its live reduction during the window.                                         |
| 15  | Reset removes simulated households only; the team's real households remain.                                                         |
| 16  | Simulator routes return 404 when `APP_ENV` is not `demo`, and 401 without the key.                                                  |
| 17  | `pnpm typecheck` and `pnpm test` pass.                                                                                              |
| 18  | The full script below has been run end to end at least twice, and a screen recording of it exists.                                  |

## 6. Demo numbers

Defaults; every one is an assumption and stays visible on the dashboard.

| Parameter        | Default                          |
| ---------------- | -------------------------------- |
| Households       | 1,200 simulated                  |
| Participation    | 60% (adjustable 20% to 80%)      |
| Cut size         | 1 kW per participating household |
| Follow-through   | 80%                              |
| Path mix         | 15% smart meter, 85% photo       |
| Photo completion | 90%                              |
| Baseline noise   | Plus or minus 10%                |
| Commit pacing    | About 25 seconds                 |
| Target           | 600 kW                           |

| Result           | Working               | Value        |
| ---------------- | --------------------- | ------------ |
| Committed        | 1,200 x 60% x 1 kW    | 720 kW       |
| Delivered, AMI   | 720 x 15% x 80%       | about 86 kW  |
| Delivered, photo | 720 x 85% x 80% x 90% | about 441 kW |
| Delivered, total |                       | about 527 kW |
| Against target   | 527 / 600             | about 88%    |

The shortfall is a talking point: every missed photo is verified kW lost, which smart meters would
recover. The run is seeded so the presenter's barangay reaches its target and the bonus shows; at 88%
overall, most other barangays fall short.

## 7. Demo plan

Story: a red alert hits Luzon. Meralco's operator alerts the Laguna pilot, households commit, and the
dashboard shows how much relief arrives. About 5 minutes.

### Roles

| Role                      | Uses                         | Job                                                           |
| ------------------------- | ---------------------------- | ------------------------------------------------------------- |
| Presenter                 | Slides, then the phone       | Tells the story and shows the household view                  |
| Operator                  | Web dashboard                | Plays Meralco: sends the alert, reads the numbers             |
| Household (2 to 3 people) | Real phones                  | Receive the push, commit a cut, take photos of the mock meter |
| Simulator runner          | Simulator panel              | Runs the 1,200 simulated households                           |
| Backup                    | Laptop with screen recording | Takes over if anything fails                                  |

### Script

| Time | Who              | Action                                                                                                                       | Judges see                              |
| ---- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 0:00 | Presenter        | Frames the problem with May 14: 12,464 MW supply, 12,877 MW peak.                                                            | Slide                                   |
| 0:45 | Operator         | Shows the empty Laguna dashboard.                                                                                            | Web: 0 committed                        |
| 1:15 | Operator         | Red alert, evening 2-hour window, all 7 towns, 600 kW target, preview, confirm.                                              | Web, API, push                          |
| 1:45 | Household        | Phones buzz; presenter shows one.                                                                                            | Mobile: alert                           |
| 2:00 | Household        | Commit a 1 kW cut.                                                                                                           | Mobile; web total ticks up              |
| 2:20 | Simulator runner | Run simulated households; commits arrive over about 25 seconds.                                                              | Web: about 720 kW vs 600 kW target      |
| 2:35 | Household        | Take the before photo of the mock meter and type the reading.                                                                | Mobile: photo accepted                  |
| 3:15 | Operator         | Measure (fast-forward) to end of window; photo timers are compressed.                                                        | Web: about 527 kW delivered, load curve |
| 3:25 | Household        | Take the after photo; the mock meter now shows the after reading.                                                            | Mobile: checks pass                     |
| 4:00 | Presenter        | Phone shows the result card with the barangay bonus. Explains that smart-meter households earn the full rate with no photos. | Mobile: result card                     |
| 4:30 | Presenter        | Closes: relief at about ILP cost, no generators.                                                                             | Slide                                   |

### On-site setup

Main screen shows the dashboard. A second screen mirrors one Android phone with scrcpy. Keep two or three
real phones on sound and vibrate so judges hear the push arrive.

| Bring                                                                                             | Before you go on                                                                |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| USB cable for the mirrored phone, plus a spare                                                    | Connect everything to your own hotspot; check the dashboard loads               |
| HDMI or USB-C adapter for the projector, and a power strip                                        | Reset the simulator, then seed. Confirm 0 committed                             |
| Your own mobile hotspot, since venue Wi-Fi may be slow or blocked                                 | Send one test push to each phone, then reset                                    |
| A screen recording of the full demo                                                               | Do Not Disturb on, with the app allowed. Brightness high; auto-lock off         |
| A printed one-page script with timings                                                            | Everyone says out loud what they are about to do                                |
| Mock meter: two printed cards with the same serial and the before and after readings, or a tablet | Register that serial on the demo phones and set their home address to the venue |

### If something fails

| Problem                | Response                                                                          |
| ---------------------- | --------------------------------------------------------------------------------- |
| Phone mirror drops     | Hold the phone up for the judges, then reconnect.                                 |
| Push is slow           | Open the app and pull to refresh; the alert is already stored.                    |
| Live totals lag        | Refresh the dashboard; it polls about every 2 seconds.                            |
| Hotspot drops          | Switch to the screen recording and talk over it.                                  |
| Camera or upload fails | Show the result card from a seeded household; the phone flow is on the recording. |
| OCR misreads           | OCR only flags and never blocks. Keep it off in the demo environment.             |
| Short on time          | Skip the real-phone commit; go from alert straight to the simulator.              |

### Optional second round

Re-run with the poor preset (30%) to show a shortfall and the relief forecast, or target only Santa Cruz
barangays to show barangay targeting. Let a judge commit on a phone if time allows.

## 8. Build plan

### Ownership

One folder per person and per AI agent, to avoid merge conflicts.

| Person | Owns                                                                 |
| ------ | -------------------------------------------------------------------- |
| 1      | `apps/mobile`, including the camera and photo flow                   |
| 2      | `apps/dashboard`                                                     |
| 3      | `apps/api` and `packages/db`, including readings, checks, settlement |
| 4      | `packages/sim` (fake meter feed) and the math in `packages/shared`   |
| 5      | Pitch, demo script, integration testing                              |

A change to `packages/shared` (a new schema or field) is kept small and announced, since everyone imports
it.

### Suggested order

The plan fixes two timing points: **test push on real phones by hour 8 to 12**, and **start with polling**
for live totals. The rest of this sequence is the team's own suggestion for hitting them.

| Phase               | Goal                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| 1. Walking skeleton | Register, create alert, commit, totals. Dashboard and app both read live data from the deployed API. |
| 2. Push             | Alert reaches real phones through Expo Push. Do this by hour 8 to 12.                                |
| 3. Simulator        | Seed, run with paced commits, reset. Dashboard shows about 720 kW committed.                         |
| 4. Photo path       | Rehearsal, camera capture, upload, rule checks, no resubmission.                                     |
| 5. Settlement       | Fast-forward, verified kWh, credit, bonus, points, result card, delivered load by barangay.          |
| 6. Rehearse         | Full script twice on the hotspot, record the screen, then freeze. Only then pick up P1 items.        |

### If time runs short, cut in this order

1. All P1 items.
2. History and leaderboard polish (keep the points total on the result card).
3. Live reduction for AMI households on the phone (keep it as a number on the dashboard).
4. GPS and serial checks (keep timing, reading value and duplicate checks).
5. The real-phone photo flow on stage: show the result card from a seeded household and play the phone
   flow from the screen recording.

Never cut: the alert push to a real phone, the live committed total, the fast-forward to a settled result,
and the statement of what is simulated.

## 9. Risks to the MVP

| Risk                                  | Mitigation                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| Push does not work on real phones     | Test by hour 8 to 12; pull to refresh fallback since the alert is stored               |
| Venue network                         | Own hotspot; screen recording as backup                                                |
| Photo flow is the longest path        | Start it early; mock meter cards prepared; seeded result card as fallback              |
| Meter display shows whole kWh only    | Mock meter shows one decimal; raise as a pilot question and prefer longer windows      |
| Judges read simulated numbers as real | Parameters visible on the dashboard; scope line in UI copy; said out loud in the pitch |
| Merge conflicts in a 24-hour build    | One folder per person; small, frequent commits to `main`; pull before push             |
| Photo storage undecided               | Decide before phase 4 (Cloudflare R2 or Supabase Storage, private bucket either way)   |

## 10. Definition of done

- Every acceptance check in section 5 passes.
- API deployed to Cloudflare Workers, dashboard on Cloudflare Pages, APK installed on at least two phones.
- `pnpm typecheck` and `pnpm test` pass on `main`.
- The demo has been run end to end at least twice, and the backup recording exists.
- The pitch says plainly which parts are simulated and that all reward numbers are placeholders.
