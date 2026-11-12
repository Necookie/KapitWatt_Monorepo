# services

Business logic lives here, one file per concern, called by the route handlers
and by the simulator port. Routes stay thin: validate, call a service, respond.

Planned (all P0 unless noted):

| File            | Does                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| `push.ts`       | Expo Push dispatch to opted-in tokens in targeted barangays. Only place push is sent from.  |
| `commit.ts`     | Cap by baseline and trust score, save commitment and path.                                  |
| `readings.ts`   | Store photo, server timestamp, run rule checks, flag failures.                              |
| `settlement.ts` | Verified kWh, barangay target check, credit, points, bonus (math from `@kapitwatt/shared`). |
| `totals.ts`     | Live committed and delivered kW per barangay.                                               |
| `sim-port.ts`   | Implements `SimPort` from `@kapitwatt/sim` on top of the services above.                    |
| `ami.ts`        | AMI feed adapter (P1). Simulated in the demo.                                               |
