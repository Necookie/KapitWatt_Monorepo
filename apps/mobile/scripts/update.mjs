/**
 * Ships a JS or UI fix to installed phones with EAS Update, no reinstall. Run from the repo root:
 * `pnpm update:mobile -- "what changed"`.
 *
 * The update goes to the "release" channel and reaches every installed APK with the same app version
 * (runtimeVersion follows expo.version), the next time the app is opened. Native changes (a new
 * permission, a new native package, an icon) cannot ship this way: bump the version and run
 * `pnpm release:mobile`.
 *
 * Preflight: on main with a clean tree, level with origin/main (set RELEASE_ALLOW_BRANCH=1 to ship
 * another branch on purpose), and a message. The API address is the one the release build uses
 * (eas.json), so the update talks to the same API as the installed app.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mobileDir = join(import.meta.dirname, '..');
const PROFILE = 'release';

const fail = (message) => {
  console.error(`update: ${message}`);
  process.exit(1);
};
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: mobileDir, encoding: 'utf8', shell: true, ...opts });

const message = process.argv
  .slice(2)
  .filter((a) => a !== '--')
  .join(' ')
  .trim();
if (!message) fail('say what changed: pnpm update:mobile -- "fix the commit button"');

const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
if (branch !== 'main' && process.env.RELEASE_ALLOW_BRANCH !== '1') {
  fail(`on "${branch}". Ship from main (or set RELEASE_ALLOW_BRANCH=1 on purpose).`);
}
if (run('git', ['status', '--porcelain', '--untracked-files=no']).stdout.trim() !== '') {
  fail('the working tree has uncommitted changes. Commit or stash them first.');
}
run('git', ['fetch', 'origin', branch]);
if (
  run('git', ['rev-parse', 'HEAD']).stdout.trim() !==
  run('git', ['rev-parse', `origin/${branch}`]).stdout.trim()
) {
  fail(`${branch} is not level with origin/${branch}. Pull or push first.`);
}

const eas = JSON.parse(readFileSync(join(mobileDir, 'eas.json'), 'utf8'));
const profile = eas.build[PROFILE];
const { version } = JSON.parse(readFileSync(join(mobileDir, 'app.json'), 'utf8')).expo;
console.log(`update: shipping to channel "${profile.channel}", app version ${version}: ${message}`);

const res = run(
  'npx',
  [
    'eas-cli',
    'update',
    '--channel',
    profile.channel,
    '--platform',
    'android',
    '--environment',
    'production',
    '--message',
    JSON.stringify(message),
    '--non-interactive',
  ],
  { stdio: 'inherit', env: { ...process.env, ...profile.env } },
);
if (res.status !== 0) fail('eas update failed (see the log above).');
console.log(
  'update: done. Phones pick it up the next time KapitWatt is opened (and use it the time after).',
);
