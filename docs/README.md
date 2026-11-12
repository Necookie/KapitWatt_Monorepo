# KapitWatt docs

Product and engineering documents for KapitWatt, derived from `KapitWatt_Full_Plan.pdf` (updated
November 12, 2026). The plan is the source of truth. If a document here disagrees with it, the plan wins
and the document should be fixed.

| Document            | Answers                                               | Read it when                          |
| ------------------- | ----------------------------------------------------- | ------------------------------------- |
| [PRD](./prd/PRD.md) | What we are building, for whom, and why               | You need the product intent or a rule |
| [SRS](./srs/SRS.md) | What the software must do, requirement by requirement | You are building or testing a feature |
| [MVP](./mvp/MVP.md) | What must work in the 24-hour demo, and what is cut   | You are deciding what to build next   |

```
docs/
  README.md      this index
  prd/PRD.md     Product Requirements Document
  srs/SRS.md     Software Requirements Specification
  mvp/MVP.md     MVP scope, acceptance criteria and demo plan
```

## Conventions used in all three

- **Priorities.** P0 must work in the demo. P1 if time allows. P2 is a slide or stub only.
- **Requirement IDs.** The SRS numbers requirements by area (`FR-APP`, `FR-DASH`, `FR-API`, `FR-SIM`,
  `NFR`). The PRD and MVP refer to them by ID.
- **Simulated versus real.** The software is real. The households, NGCP alerts and reward rates are
  simulated or placeholders. Every document says so where it matters, and so should UI copy and the pitch.
- **Reward and timing numbers** quoted here (PHP 8.40 per kWh, 0.6, 20%, 15 min, 30 min and so on) are
  placeholders. In code they live only in `packages/shared/src/constants.ts`.

For repo layout, commands, architecture rules and folder ownership, see [CLAUDE.md](../CLAUDE.md) and the
root [README](../README.md).
