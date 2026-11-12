/**
 * Uploads the API's secrets to the deployed Worker in one request.
 * Values come from the process environment, which Doppler fills:
 *   pnpm deploy:api   (runs `wrangler deploy`, then this script under `doppler run`)
 * Only the names listed below are sent. Values go to Wrangler over stdin and are never printed.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const apiDir = join(import.meta.dirname, '..');

const REQUIRED = ['DATABASE_URL', 'SIM_KEY', 'OPERATOR_KEY'];
const OPTIONAL = ['EXPO_ACCESS_TOKEN'];
const MIN_KEY_LENGTH = 32;

const secrets = {};
for (const key of REQUIRED) {
  const value = process.env[key];
  if (!value || value === 'change-me') {
    console.error(`${key} is missing or still "change-me". Set it in Doppler, then run again.`);
    process.exit(1);
  }
  secrets[key] = value;
}
for (const key of OPTIONAL) {
  if (process.env[key]) secrets[key] = process.env[key];
}

for (const key of ['SIM_KEY', 'OPERATOR_KEY']) {
  if (secrets[key].length < MIN_KEY_LENGTH) {
    console.error(`${key} is shorter than ${MIN_KEY_LENGTH} characters. Use a long random value.`);
    process.exit(1);
  }
}
if (!secrets.DATABASE_URL.includes('-pooler')) {
  console.error('DATABASE_URL is not the pooled connection string (no -pooler in the host).');
  process.exit(1);
}

const result = spawnSync('npx', ['wrangler', 'secret', 'bulk'], {
  cwd: apiDir,
  input: JSON.stringify(secrets),
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
});
process.exit(result.status ?? 1);
