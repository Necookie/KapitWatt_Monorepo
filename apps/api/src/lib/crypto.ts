/**
 * Small crypto helpers on Web Crypto, so they run the same on Workers and in Node (vitest).
 */
const encoder = new TextEncoder();

export async function sha256(data: string | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
}

export async function sha256Hex(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await sha256(data);
  let hex = '';
  for (const b of digest) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/**
 * Constant-time string comparison. Both sides are hashed first, so the comparison always runs over 32
 * bytes and leaks neither content nor length through timing.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Household bearer tokens: `kw_` + 32 random bytes (base64url, 43 chars). The prefix helps secret scanners. */
export const HOUSEHOLD_TOKEN_PATTERN = /^kw_[A-Za-z0-9_-]{43}$/;

export function newHouseholdToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `kw_${base64url(bytes)}`;
}

/** Shared keys must be long and random. Anything weaker turns the protected routes off (503). */
export const MIN_KEY_LENGTH = 32;
export function isStrongKey(key: string | undefined): key is string {
  return typeof key === 'string' && key.length >= MIN_KEY_LENGTH && key !== 'change-me';
}

/**
 * A stable UUID derived from a name (SHA-256, formatted as an RFC 9562 version 8 UUID). Used for
 * simulated households so the same seed always produces the same ids, and so the same run.
 */
export async function uuidFromName(name: string): Promise<string> {
  const b = (await sha256(name)).slice(0, 16);
  b[6] = (b[6]! & 0x0f) | 0x80; // version 8 (custom)
  b[8] = (b[8]! & 0x3f) | 0x80; // RFC variant
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Password hashing: PBKDF2-HMAC-SHA256 with a random 16-byte salt, stored as
 * `pbkdf2$<iterations>$<salt>$<hash>` (base64url). Web Crypto only, so it runs on Workers, whose
 * PBKDF2 accepts at most 100,000 iterations.
 */
const PBKDF2_ITERATIONS = 100_000;

function fromBase64url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${base64url(salt)}$${base64url(hash)}`;
}

/** False for a wrong password and for a stored value that is not one of our hashes. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split('$');
  const rounds = Number(iterations);
  if (scheme !== 'pbkdf2' || !salt || !hash || !Number.isInteger(rounds) || rounds < 1)
    return false;
  if (rounds > PBKDF2_ITERATIONS) return false;
  const actual = await pbkdf2(password, fromBase64url(salt), rounds);
  return safeEqual(base64url(actual), hash);
}
