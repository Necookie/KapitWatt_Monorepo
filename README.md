# KapitWatt

Residential demand response for Meralco: a household version of the Interruptible Load Program.
Built by team CodeBearers for the IDOL Hackathon 2026.

When NGCP raises a yellow or red alert, the operator alerts opted-in households. Each household commits
to cutting a number of kW during the peak window and is paid for the kWh that can be verified, from
smart-meter data or from meter photos taken in the app.

**Alert → Commit → Shift → Measure → Reward**

> Scope: a simulated pilot in seven Meralco franchise towns in Laguna. The software is real. The
> households, NGCP alerts and reward rates are simulated or placeholders.

## What is in here

| Path              | What                                                  |
| ----------------- | ----------------------------------------------------- |
| `apps/mobile`     | Household app. Expo + React Native, Android APK.      |
| `apps/dashboard`  | Utility dashboard for the operator. Expo web.         |
| `apps/api`        | API. Hono on Cloudflare Workers.                      |
| `packages/shared` | Zod schemas, types, baseline, payout and check rules. |
| `packages/db`     | Postgres schema and migrations.                       |
| `packages/sim`    | Laguna seed data and the event simulator (demo only). |
| `packages/config` | Shared TypeScript config.                             |

## Getting started

Needs Node 22+, pnpm 12 and the Doppler CLI (env and secrets live in Doppler, project `kapitwatt`). The
Neon CLI is optional, for branching the database.

```bash
pnpm install
doppler login        # once per machine (add --scope <repo path> if you use other Doppler workplaces)
doppler setup        # once; doppler.yaml already names project kapitwatt, config dev

# Database: only needed when there are new migrations or reference data
pnpm db:migrate
pnpm db:seed         # pilot barangays; already loaded on the shared database

# API (http://localhost:8787). Secrets come from Doppler; do not create apps/api/.dev.vars.
pnpm dev:api

# Dashboard (web)
pnpm dev:dashboard

# Household app (Expo Go or a dev build). EXPO_PUBLIC_API_URL must be your LAN IP, not localhost,
# so phones can reach a local API.
pnpm dev:mobile
```

Checks:

```bash
pnpm typecheck
pnpm test
```

## Working in this repo

Architecture rules, domain rules, priorities and folder ownership are in [CLAUDE.md](./CLAUDE.md). Read it
before you start, and point your AI agent at one folder.

Product documents are in [docs/](./docs/README.md): the [full plan](./docs/KapitWatt_Full_Plan.pdf)
(source of truth), the [PRD](./docs/prd/PRD.md), the [SRS](./docs/srs/SRS.md) and the
[MVP scope and demo plan](./docs/mvp/MVP.md).
