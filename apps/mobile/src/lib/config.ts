/**
 * Serve every household call from the in-memory mock in src/lib/mock/ instead of the API.
 * Turn this off screen by screen as Person 3's endpoints go live (see src/lib/endpoints.ts).
 * Deliberately a code constant, not an env var: the repo keeps one env var (EXPO_PUBLIC_API_URL).
 */
export const USE_MOCKS = true;
