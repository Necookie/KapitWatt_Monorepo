/**
 * Which areas of the household app are served by the in-memory mock in src/lib/mock/ instead of
 * the API. All false = the app runs on the API at EXPO_PUBLIC_API_URL.
 *
 * Deliberately code constants, not env vars: the repo keeps one env var (EXPO_PUBLIC_API_URL).
 *
 * The mock keeps its own household and event, with its own ids. `account` is the anchor: the other
 * mock areas only answer for a household that signed up in the mock. So the two states that work
 * end to end are all false (live) and all true (offline fallback for the demo).
 */
export const MOCK = {
  /** Sign-up, profile, barangay list, push token. */
  account: false,
  /** Active alert, event screen, totals, commit a cut. */
  events: false,
  /** Meter photos: rehearsal, before and after. */
  readings: false,
  /** Result card, history, leaderboard. */
  results: false,
} as const;
