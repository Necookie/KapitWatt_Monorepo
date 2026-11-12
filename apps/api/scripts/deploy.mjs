/**
 * Deploys the API Worker with its secrets in one step. Run from the repo root: `pnpm deploy:api`
 * (which runs this under `doppler run`, so the secrets are in the process environment).
 *
 * Preflight, before anything is uploaded:
 *   - on the main branch with a clean working tree ("main is what gets deployed"); set
 *     DEPLOY_ALLOW_BRANCH=1 to deploy another branch on purpose;
 *   - DATABASE_URL (pooled), SIM_KEY and OPERATOR_KEY present, keys at least 32 characters;
 *   - Cloudflare credentials work and the private photo bucket exists.
 * Then `wrangler deploy --secrets-file`: the new version and its secrets go up together, so no new
 * code ever runs without them. The secrets file holds only ${NAME} references that wrangler expands
 * from the environment; no secret value is written to disk or printed.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const apiDir = join(import.meta.dirname, '..');
const REQUIRED = ['DATABASE_URL', 'SIM_KEY', 'OPERATOR_KEY'];
const OPTIONAL = ['EXPO_ACCESS_TOKEN'];
const KEYS = ['SIM_KEY', 'OPERATOR_KEY'];
const MIN_KEY_LENGTH = 32;
const BUCKET = 'kapitwatt-meter-photos';

const fail = (message) => {
  console.error(`deploy: ${message}`);
  process.exit(1);
};
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: apiDir, encoding: 'utf8', shell: true, ...opts });

// 1. Branch and working tree.
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
if (branch !== 'main' && process.env.DEPLOY_ALLOW_BRANCH !== '1') {
  fail(`on "${branch}". Deploy from main (or set DEPLOY_ALLOW_BRANCH=1 on purpose).`);
}
if (run('git', ['status', '--porcelain']).stdout.trim() !== '') {
  fail('the working tree has uncommitted changes. Commit or stash them first.');
}

// 2. Secrets (names and lengths only).
for (const key of REQUIRED) {
  const value = process.env[key];
  if (!value || value === 'change-me') fail(`${key} is missing in Doppler.`);
}
for (const key of KEYS) {
  if (process.env[key].length < MIN_KEY_LENGTH) {
    fail(`${key} is shorter than ${MIN_KEY_LENGTH} characters. Use a long random value.`);
  }
}
if (!process.env.DATABASE_URL.includes('-pooler')) {
  fail('DATABASE_URL is not the pooled connection string (no -pooler in the host).');
}

// 3. Cloudflare access and the photo bucket.
if (run('npx', ['wrangler', 'whoami']).status !== 0) {
  fail(
    'wrangler is not logged in. Run `npx wrangler login`, or set CLOUDFLARE_API_TOKEN in Doppler.',
  );
}
if (run('npx', ['wrangler', 'r2', 'bucket', 'info', BUCKET]).status !== 0) {
  fail(
    `R2 bucket "${BUCKET}" not found. Create it once:\n` +
      `  npx wrangler r2 bucket create ${BUCKET}\n` +
      `  npx wrangler r2 bucket lifecycle add ${BUCKET} expire-photos --expire-days 30`,
  );
}

// 4. Deploy with secrets. The file only references names; wrangler expands them from the env.
const names = [...REQUIRED, ...OPTIONAL.filter((k) => process.env[k])];
const dir = mkdtempSync(join(tmpdir(), 'kapitwatt-deploy-'));
const secretsFile = join(dir, 'secrets.env');
writeFileSync(secretsFile, names.map((n) => `${n}=\${${n}}`).join('\n') + '\n', { mode: 0o600 });
try {
  console.log(`deploy: ${branch}, secrets ${names.join(', ')}`);
  const result = run('npx', ['wrangler', 'deploy', '--secrets-file', `"${secretsFile}"`], {
    stdio: 'inherit',
  });
  if (result.status !== 0) fail('wrangler deploy failed.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log('deploy: done. Next: pnpm --filter @kapitwatt/api smoke:live');
