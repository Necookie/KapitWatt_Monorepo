# KapitWatt: Product Requirements Document (PRD)

|              |                                                                                    |
| ------------ | ---------------------------------------------------------------------------------- |
| Product      | KapitWatt, residential demand response for Meralco                                 |
| Team         | CodeBearers, IDOL Hackathon 2026 (24-hour build)                                   |
| Source       | [`KapitWatt_Full_Plan.pdf`](../KapitWatt_Full_Plan.pdf), updated November 12, 2026 |
| Status       | Working draft for the hackathon build                                              |
| Related docs | [SRS](../srs/SRS.md), [MVP](../mvp/MVP.md), [index](../README.md)                  |

> **Scope: Laguna pilot, simulated.** The software is real. The households, NGCP alerts and reward rates
> are simulated or placeholders.

## 1. Summary

KapitWatt is a residential demand response platform. When NGCP raises a yellow or red alert, Meralco's
operator alerts opted-in households. Each household commits to cutting a set number of kW during the peak
window and is paid for the kWh Meralco can verify it avoided, from smart-meter (AMI) data or from meter
photos taken in the app. Meralco sees committed and delivered load by area in real time.

It is a household version of the Interruptible Load Program (ILP).

**The five core steps: alert, commit, shift, measure, reward.**

## 2. Problem

- On May 14, 2026, NGCP declared a red alert on the Luzon grid with supply of 12,464 MW against a peak of
  12,877 MW. Brownouts ran about two hours each and were listed by barangay.
- Meralco's existing lever, the ILP, pays large customers to run their own generators. ILP participants
  are paid the incremental cost of self-generation: (generator cost per kWh minus grid cost per kWh) times
  kWh de-loaded, plus maintenance. The 2026 ERC amendment adds a standby fee of PHP 0.85 per kWh for
  capacity committed at final confirmation, and penalties for non-compliance. The cost is recovered from
  all customers through the generation rate.
- Households have no generator and no way to take part, yet evening residential load (air conditioning
  especially) is a large share of the peak.
- A household program only works if the cut can be **verified**. Most homes have no smart meter: Meralco
  had about 196,000 smart meters deployed as of February 2026 against roughly 8 million customers.

## 3. Goals and non-goals

### Goals

1. Let an operator send a targeted grid alert to opted-in households in minutes and watch committed and
   delivered load by town and barangay.
2. Let a household commit to a cut in kW, and get paid only for a cut that a meter reading supports.
3. Give households without a smart meter a workable verification path (in-app meter photos) built on plain
   rules, with no trained model.
4. Demonstrate the full loop, alert to reward, live in about 5 minutes with real phones and about 1,200
   simulated households.
5. Be honest about what is simulated: in the UI, in the dashboard and in the pitch.

### Non-goals

- A production integration with Meralco AMI data, billing or NGCP. The AMI feed is simulated in the demo.
- Real money movement or bill credit redemption (P2, roadmap slide only).
- Paying on appliance declarations. The system cannot see which appliance was switched off, so nothing is
  ever paid from an appliance list.
- Machine learning. All photo checks are plain rules; OCR is optional, only flags, and is off in the demo.
- Coverage beyond the seven Laguna franchise towns.
- iOS. The household app ships as an Android APK.

## 4. Users

| User                | Uses              | Wants                                                                  |
| ------------------- | ----------------- | ---------------------------------------------------------------------- |
| Household (photo)   | Household app     | A clear ask, a short task (two photos), and a credit they can trust    |
| Household (AMI)     | Household app     | To commit once and see their live reduction, with no extra work        |
| Meralco operator    | Utility dashboard | To send an alert, see how much relief is committed and delivered where |
| Reviewer (operator) | Utility dashboard | To approve or reject readings that failed a rule check (P1)            |
| Team, demo only     | Simulator panel   | To run about 1,200 simulated households through the real code paths    |

Plan for most households on the photo path. The path mix of 15% AMI and 85% photo is an assumption.

## 5. Product overview

| Surface           | Users                | Tech                              | Purpose                                                 |
| ----------------- | -------------------- | --------------------------------- | ------------------------------------------------------- |
| Household app     | Households in pilot  | Expo + React Native (Android APK) | Receive alerts, commit a cut, take meter photos, earn   |
| Utility dashboard | Meralco operator     | Expo web (Expo Router)            | Send alerts, watch committed and delivered load         |
| API               | Both apps, simulator | Hono on Cloudflare Workers        | Alerts, commitments, readings and checks, rewards, push |
| Laguna simulator  | Team, demo only      | TypeScript package + API routes   | Seeds about 1,200 households and runs simulated events  |
| Shared package    | All of the above     | TypeScript, Zod                   | Types, schemas, baseline, payout and check rules        |

### Pilot scope

Seven Meralco franchise towns in Laguna: Santa Cruz (hub), Pila, Victoria, Nagcarlan, Liliw, Majayjay and
Magdalena. 21 sampled barangays (3 per town), about 1,200 simulated households, plus team phones as real
households in Santa Cruz.

## 6. User flows

### Household flow

| Step            | What the household sees                                                                            | What the system does                                               |
| --------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0. Sign-up once | Opt in, register meter type and serial. Photo households do a rehearsal event.                     | Stores the registration and sets the baseline.                     |
| 1. Alert        | Push: red alert, peak window, ask to cut load.                                                     | Stores the alert and sends to opted-in tokens.                     |
| 2. Commit       | Choose a cut in kW. The appliance list is an optional helper.                                      | Caps the cut by baseline and trust score; saves commitment + path. |
| 3. Shift        | Window opens. Photo households take the before photo within 15 min.                                | Runs the checks; the barangay progress bar updates.                |
| 4. Measure      | Photo households take the after photo within 30 min of the end. Smart-meter households do nothing. | Computes avoided kWh from the readings or the AMI feed.            |
| 5. Reward       | Result card with credit, points and barangay bonus.                                                | Updates the leaderboard and delivered load.                        |

### Operator flow

1. Open the dashboard: Laguna pilot, 0 kW committed.
2. Fill the alert form: level, window, target barangays, target kW. Read the message preview and confirm
   ("Send red alert to 7 towns, about 1,200 households?").
3. Watch committed kW rise against the target as households commit.
4. After the window, watch verified delivered kW per town and barangay, with a marker where a barangay
   hits its target. Drill down from town to barangay.
5. In the demo, press **Measure (fast-forward)** to end the window, compress the photo timers and settle.
6. (P1) Review flagged readings; approve or reject each one.

### What the household sees during an event

| Element                | How it works                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commitment             | A number of kW to cut, not a list of appliances. Nobody has to prove which device was switched off.                                                                                            |
| Barangay progress bar  | Verified delivered kW in the household's barangay against that barangay's target. It fills from smart-meter data and from photos that pass the checks, so part of it fills only at settlement. |
| Barangay bonus         | Individuals are paid on their own verified cut. If the barangay reaches 100% of its target at settlement, every household there with a verified cut gets a bonus on its own credit.            |
| Smart-meter households | No photos. They see their live reduction against baseline during the window.                                                                                                                   |

## 7. Features and priorities

P0 must work in the demo. P1 if time allows. P2 is a slide or stub only; do not build it. Detailed
requirements are in the [SRS](../srs/SRS.md).

### Household app

| Feature                               | What it does                                                                                                                                | Priority |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Sign-up and opt-in                    | Pick town and barangay, consent to alerts and data use (Data Privacy Act 2012), register meter type and serial number.                      | P0       |
| Commit a cut                          | Choose how many kW to cut (presets of 0.5, 1, 1.5 and 2 kW, or a stepper). The maximum depends on the household's baseline and trust score. | P0       |
| Rehearsal event                       | Photo households only: a practice window with the same two photos at sign-up. It doubles as the tutorial and sets the baseline.             | P0       |
| Meter photo capture                   | In-app camera only, no gallery. The household types the reading and attaches the photo. Fixed deadlines, no resubmission.                   | P0       |
| Grid alert                            | Push notification for a yellow or red alert with the peak window. SMS is mocked.                                                            | P0       |
| Event screen                          | Countdown, commitment, photo deadlines and a barangay progress bar. Smart-meter households also see their live reduction against baseline.  | P0       |
| Result card                           | After settlement: verified cut, bill credit, barangay bonus and points.                                                                     | P0       |
| Points, leaderboard, history          | Points per verified kWh, barangay ranking and past events.                                                                                  | P0       |
| Appliance helper                      | Optional list with rated kW that suggests what to switch off to reach the cut. Not used for payment.                                        | P1       |
| Trust score and commit cap            | Rises with clean settled events, falls with flagged readings, and sets the largest cut a household can commit.                              | P1       |
| Home monitor link, bill credit redeem | Roadmap slides only.                                                                                                                        | P2       |

### Utility dashboard

| Feature                               | What it does                                                                                                  | Priority |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| Alert form                            | Level, window, target barangays, target kW, message preview and a confirm step. Sends the push.               | P0       |
| Live committed load                   | Committed kW updates as households commit; total against the target.                                          | P0       |
| Delivered load by town and barangay   | Verified delivered kW against each barangay's target, with a target-hit marker. Drills down town to barangay. | P0       |
| Measure (fast-forward)                | Ends the window, compresses the photo timers in demo mode and settles results so the demo does not wait.      | P0       |
| Simulation controls                   | Participation, follow-through, path mix, photo completion, preset, run event.                                 | P0       |
| Flagged readings list                 | Photos that failed a rule check, with the readings and flags. A person approves or rejects each one.          | P1       |
| Schedule, reminder, cancel, alert log | Schedule a send, reminder push before the window, end an alert, record who sent what.                         | P1       |
| Load curve and relief forecast        | Baseline versus actual with relief shaded; committed times follow-through rate.                               | P1       |
| Feeder-level check                    | Compare barangay feeder load with forecast to confirm delivery.                                               | P2       |

#### Alert form settings

| Setting                                | Detail                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Level                                  | Yellow or red. Red can ask for a bigger cut.                                                     |
| Window                                 | Start and end, default 2 hours, with quick presets.                                              |
| Target barangays                       | Pick towns or barangays, or all pilot areas.                                                     |
| Target                                 | kW or MW of relief wanted; the dashboard compares against it.                                    |
| Message preview and confirm            | Default text the operator can see. Confirm: "Send red alert to 7 towns, about 1,200 households?" |
| Send now or schedule, reminder, cancel | Scheduled send, a reminder 15 minutes before, and an alert-lifted push. (P1)                     |

### API and shared package

| Feature                        | What it does                                                                                        | Priority |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | -------- |
| Auth and opt-in                | Simple token auth for the demo; stores push tokens and meter registration.                          | P0       |
| Alert and commitment endpoints | Create alerts, record commitments (cut kW and path), return live totals.                            | P0       |
| Meter reading endpoints        | Accept before, after and rehearsal readings with the photo; run the rule checks; flag failures.     | P0       |
| Push dispatch                  | Sends to opted-in tokens in targeted barangays through Expo Push.                                   | P0       |
| Baseline and kWh avoided       | Baseline from the rehearsal or AMI history; verified kWh capped by the commitment and bill history. | P0       |
| Settlement                     | At window end plus 30 min: results, barangay target check, credit, points and bonus.                | P0       |
| Simulator routes               | `/sim/seed`, `/sim/run`, `/sim/reset`, `/sim/status`, protected by a simulator key.                 | P0       |
| AMI feed adapter               | Reads Meralco interval data. Simulated in the demo; production needs a data agreement and consent.  | P1       |

### Simulator

| Feature                                 | What it does                                                                                                                                | Priority |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Seed Laguna                             | Creates 7 towns, 21 barangays, about 1,200 households and appliances.                                                                       | P0       |
| Run event                               | For targeted barangays, simulated households commit; after the window it generates delivered kWh.                                           | P0       |
| Parameters                              | Participation, follow-through, path mix, photo completion, baseline noise.                                                                  | P0       |
| Fake meter feed                         | AMI interval readings for smart-meter households and before and after readings for photo households, flagged as simulated.                  | P0       |
| Paced commits                           | Commits spread over 20 to 30 seconds so the live total rises gradually.                                                                     | P0       |
| Reset                                   | Clears simulated data only.                                                                                                                 | P0       |
| Safety                                  | Rows flagged `is_simulated`, simulator key required, routes off outside the demo environment.                                               | P0       |
| Presets, seeded randomness, run summary | Poor 30%, typical 60%, best 80%; repeatable runs; per-town summary; a seed where the presenter's barangay reaches its target (shows bonus). | P1       |
| Failure injection, real barangay import | No-shows and late commits; names loaded from PSA.                                                                                           | P2       |

## 8. Product rules

### 8.1 Two verification paths

The system cannot see which appliance a household switched off. It measures whether consumption dropped
and pays for the measured drop. Every payout rests on a meter reading: Meralco's own data, or a photo of
the meter taken inside the app.

|                  | Smart meter (`ami`)                                                      | Photo (`photo`, no smart meter)                                    |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Evidence         | Meralco 5-minute interval data compared with the household's own history | Before and after meter photos taken in the app, plus typed reading |
| Household effort | None                                                                     | Rehearsal at sign-up, then 2 photos per event                      |
| Reward rate      | Full rate                                                                | Lower rate (placeholder: 60%)                                      |
| Progress shown   | Live reduction against baseline                                          | Result after settlement, at window end plus 30 min                 |
| Failure          | Missing data: no payout, flagged                                         | Late or missing photo, or failed check: no payout, no resubmission |

### 8.2 Photo rules

The windows are fixed. A late or missing photo means no payout for that event, and there is no
resubmission. All of these are plain rules, so the build needs no trained model or dataset.

| Check          | Rule                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Capture        | In-app camera only; no gallery upload. The server timestamps the upload.                                                      |
| Timing         | Before photo within 15 min of window start. After photo within 30 min of window end.                                          |
| Meter match    | The serial is registered at sign-up and must appear in the photo. This also separates meters in a shared bank.                |
| Location       | GPS within a set distance of the registered address.                                                                          |
| Reading        | Typed by the household. Must be higher than the previous one and not more than the service could draw in that time.           |
| Duplicates     | A file hash rejects reused photos.                                                                                            |
| OCR (optional) | An off-the-shelf OCR or vision API may flag a mismatch with the typed reading. It only flags, never rejects. Off in the demo. |
| Failures       | Rule failures go to the flagged list on the dashboard, where a person approves or rejects them.                               |

### 8.3 Baseline and payout

A before and after pair only shows what the household used during the event. The baseline says what it
would have used anyway.

| Path        | Baseline                                                                        | Source                            |
| ----------- | ------------------------------------------------------------------------------- | --------------------------------- |
| Smart meter | Average kW over the same hours on comparable past days                          | AMI history                       |
| Photo       | kW measured in the rehearsal window at sign-up, with a sanity cap from the bill | Rehearsal photos and bill history |

```
actual_kw    = (reading_after - reading_before) / hours between the two readings
cut_kw       = max(0, baseline_kw - actual_kw)
cap_kw       = 2 x (bill_avg_kwh_month / 720)          (peak factor 2 is a placeholder)
paid_cut_kw  = min(cut_kw, committed_kw, cap_kw)
verified_kwh = paid_cut_kw x window hours              (scheduled window, not elapsed photo time)
credit_php   = verified_kwh x 8.40 x path multiplier   (smart meter 1.0, photo 0.6)
bonus_php    = 20% of credit_php if the barangay reached its target
points       = 100 x verified_kwh
```

The elapsed time between the two photos is used for the measurement, but pay is for the scheduled window,
so a late after photo lowers the measured cut slightly instead of adding paid hours.

**Worked example: one photo household**

| Step          | Value                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| Event         | Window 18:00 to 20:00 (2 h). Committed cut: 1.0 kW.                                                            |
| Readings      | Before: 1204.3 kWh at 18:04. After: 1206.6 kWh at 20:10.                                                       |
| Measured load | 2.3 kWh over 2.1 h = 1.1 kW.                                                                                   |
| Baseline      | 1.9 kW from the rehearsal, so the measured cut is 0.8 kW.                                                      |
| Cap           | min(0.8, committed 1.0, bill cap 1.25 kW for 450 kWh a month) = 0.8 kW.                                        |
| Verified      | 0.8 kW x 2 h = 1.6 kWh.                                                                                        |
| Payout        | 1.6 x 8.40 x 0.6 = PHP 8.06 credit, plus PHP 1.61 barangay bonus, plus 160 points. Same cut on AMI: PHP 13.44. |

### 8.4 Rewards, barangay bonus and trust

| Rule               | Detail                                                                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reward rate        | The ILP pays the gap between generator cost and grid cost. Households have no generator, so KapitWatt uses a flat rate per verified kWh. Placeholder: PHP 8.40 (illustrative gap, 20.40 minus 12.00). |
| Barangay target    | The alert's target kW is split across the targeted barangays by opted-in households. The operator can override a barangay's share.                                                                    |
| Progress and bonus | Progress is verified delivered kW divided by the barangay target. At 100% at settlement, each household with a verified cut there gets 20% on top of its own credit. No verified cut, no bonus.       |
| Delivery ratio     | An approved photo cut counts at full weight toward the barangay total.                                                                                                                                |
| Trust score (P1)   | Starts neutral, rises with clean settled events and falls with flagged readings. Sets the largest cut a household can commit and how often it is audited.                                             |

All reward constants are placeholders: PHP 8.40 per kWh, photo multiplier 0.6, bonus 20%, 100 points per
kWh, peak factor 2. The real rate would be set by Meralco and the ERC.

### 8.5 Guardrails

- Only opted-in households get alerts. Every alert is logged with sender and time.
- Privacy (Data Privacy Act 2012): opt-in consent on the sign-up screen; results reported per barangay;
  meter photos and readings are personal data, so private storage and limited retention, stated on the
  consent screen.
- The simulator acts as a service account for simulated rows only, never as a general superadmin.
- Server time is used for anything that affects a payout, never the phone clock.

## 9. Success measures

For the hackathon, success is the demo. The numbers below come from the default simulation parameters
(all assumptions) and are what the dashboard should show.

| Measure            | Target                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Full loop on stage | Alert to result card in about 5 minutes, on real phones plus simulated households |
| Committed load     | About 720 kW (1,200 households x 60% x 1 kW) against a 600 kW target              |
| Delivered load     | About 527 kW, 88% of target (about 86 kW from AMI, about 441 kW from photo)       |
| Push delivery      | Real phones buzz within seconds of the operator confirming the alert              |
| Payout math        | Matches the worked example to the centavo (PHP 8.06 + PHP 1.61 + 160 points)      |
| Bonus shown        | The presenter's barangay reaches its target in the seeded run                     |

The 88% shortfall is a talking point, not a bug: every missed photo is verified kW lost, which smart
meters would recover.

Measures a real pilot would track (not measured in the hackathon): opt-in rate, participation per alert,
follow-through (delivered over committed), photo completion rate, flagged-reading rate, cost per verified
kWh against ILP cost.

## 10. Assumptions

| Assumption                | Default                                            | Note                                      |
| ------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Cut size                  | 1 kW committed per participating household         | Aircon figure from the proposal           |
| Participation             | 60%, adjustable 20% to 80%                         |                                           |
| Follow-through            | 80% of committed kW delivered                      | Adjustable per path                       |
| Verification path mix     | 15% smart meter, 85% photo                         | Not real Laguna meter data                |
| Photo completion          | 90% submit both photos on time and pass the checks | To be tested                              |
| Baseline noise            | Plus or minus 10% around each hourly baseline      | Makes the load curve look real            |
| Alerts                    | Yellow or red, about 2 hours, targeted by barangay | May 14 brownouts ran about two hours each |
| Household counts per town | Simulation parameters                              | Barangay names are real PSA names         |

## 11. Risks and open decisions

| Item                      | Plan                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verification              | Every payout rests on a meter reading: Meralco AMI data, or in-app photos with rule checks and a flagged list. Say plainly in the pitch which parts are simulated. |
| Smart-meter coverage      | About 196,000 smart meters against roughly 8 million customers; Laguna coverage unknown. Plan for most households on the photo path and confirm with Meralco.      |
| Photo burden and drop-off | A rehearsal plus 2 photos per event, strict windows, no resubmission. Send reminders at window start and end. The 90% completion rate is an assumption to test.    |
| Meter display resolution  | Older meters may show whole kWh only, and a 1 kW cut over 2 hours is about 2 kWh. Check what the pilot meters display and prefer longer windows.                   |
| Simulated data            | Say clearly what is real and what is simulated. Keep simulator parameters visible in the dashboard.                                                                |
| Franchise coverage        | Meralco serves only parts of Laguna. Keep the pilot to franchise towns, and confirm Liliw directly with Meralco.                                                   |
| Push and realtime         | Test push on real phones by hour 8 to 12. Start with polling for live totals.                                                                                      |
| Database choice           | **Decided after the plan was written: Neon.** The plan listed Neon or Supabase as undecided.                                                                       |
| Photo storage             | **Open:** Cloudflare R2 or Supabase Storage. Private bucket either way.                                                                                            |
| Privacy                   | Opt-in, results per barangay. Meter photos and readings are personal data: private storage, limited retention, stated on the consent screen.                       |
| Reward constants          | Placeholders: PHP 8.40 per kWh, photo multiplier 0.6, bonus 20%, 100 points per kWh, peak factor 2. Set by Meralco and the ERC in practice.                        |
| Which barangays           | The 21 names are real PSA names, but which 3 per town is the team's own sample, not a Meralco selection.                                                           |

## 12. Roadmap beyond the hackathon

- Real AMI feed adapter under a Meralco data agreement with customer consent. The smart-meter share grows
  only as Meralco's rollout reaches each home (72,000 more meters planned in 2026; 3.27 million between
  2025 and 2029). A household cannot buy its own billing meter.
- Bill credit redemption and a home monitor link (P2).
- Feeder-level check: compare barangay feeder load with forecast to confirm delivery (P2).
- Real SMS alerts alongside push.
- Reward rate set by Meralco and the ERC.

## 13. Sources

From the plan: ERC Resolution 08 S. 2013, SolarQuarter (July 2026), Meralco ILP presentation (2022) and
Rappler for how the ILP pays; Philstar (May 14, 2026 red alert); Energy Transition Partnership (DSM case
studies); OpenStreetMap franchise list; GMA and Inquirer (Meralco brownout and outage lists); Power
Philippines, BusinessWorld, Daily Tribune and Insider PH for smart-meter figures.
