/**
 * Uploads the API's secrets to the deployed Worker in one request:
 *   DATABASE_URL            from the repo root .env.local (written by `neon env pull`)
 *   SIM_KEY, OPERATOR_KEY   from apps/api/.dev.vars
 * Values go to Wrangler over stdin and are never printed.
 * Run from the repo root: `pnpm deploy:api` (deploys, then runs this).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const apiDir = join(import.meta.dirname, '..');

function readEnvFile(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

const root = readEnvFile(join(apiDir, '..', '..', '.env.local'));
const dev = readEnvFile(join(apiDir, '.dev.vars'));
const secrets = {
  DATABASE_URL: root.DATABASE_URL,
  SIM_KEY: dev.SIM_KEY,
  OPERATOR_KEY: dev.OPERATOR_KEY,
};

for (const [key, value] of Object.entries(secrets)) {
  if (!value || value === 'change-me') {
    console.error(`${key} is missing or still "change-me". Fix it, then run again.`);
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
