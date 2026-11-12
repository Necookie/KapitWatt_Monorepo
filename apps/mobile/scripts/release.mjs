/**
 * Releases the household app: builds the APK on EAS and publishes it as a GitHub Release, where the
 * download page (get.kapitwatt.dhekode.com) links to `releases/latest/download/KapitWatt.apk`.
 * Run from the repo root: `pnpm release:mobile`.
 *
 * Preflight, before anything is built:
 *   - on main with a clean tree, level with origin/main ("main is what gets deployed"); set
 *     RELEASE_ALLOW_BRANCH=1 to release another branch on purpose;
 *   - logged in to EAS (`npx eas-cli login`) and GitHub (`gh auth login`);
 *   - no release yet for this version: bump `expo.version` in apps/mobile/app.json for a new one.
 * Then `eas build --profile release` (APK, channel "release", Android versionCode auto-incremented on
 * EAS), download the APK, and `gh release create v<version>` with it attached as KapitWatt.apk.
 *
 * Options:
 *   --apk-url <url>   skip the build and publish an APK EAS already built (for a retry)
 *   --draft           create the release as a draft (the download page ignores drafts)
 *
 * JS-only changes do not need this: `pnpm update:mobile -- "what changed"` (EAS Update).
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const mobileDir = join(import.meta.dirname, '..');
const APK_NAME = 'KapitWatt.apk';
const PROFILE = 'release';

const fail = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: mobileDir, encoding: 'utf8', shell: true, ...opts });
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

// 1. Branch and working tree.
const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
if (branch !== 'main' && process.env.RELEASE_ALLOW_BRANCH !== '1') {
  fail(`on "${branch}". Release from main (or set RELEASE_ALLOW_BRANCH=1 on purpose).`);
}
if (run('git', ['status', '--porcelain', '--untracked-files=no']).stdout.trim() !== '') {
  fail('the working tree has uncommitted changes. Commit or stash them first.');
}
run('git', ['fetch', 'origin', branch]);
const head = run('git', ['rev-parse', 'HEAD']).stdout.trim();
if (head !== run('git', ['rev-parse', `origin/${branch}`]).stdout.trim()) {
  fail(`${branch} is not level with origin/${branch}. Pull or push first.`);
}

// 2. Version and accounts.
const { version } = JSON.parse(readFileSync(join(mobileDir, 'app.json'), 'utf8')).expo;
const tag = `v${version}`;
if (run('npx', ['eas-cli', 'whoami']).status !== 0)
  fail('not logged in to EAS. Run `npx eas-cli login`.');
if (run('gh', ['auth', 'status']).status !== 0)
  fail('not logged in to GitHub. Run `gh auth login`.');
if (run('gh', ['release', 'view', tag]).status === 0) {
  fail(`release ${tag} already exists. Bump "version" in apps/mobile/app.json for a new release.`);
}

// 3. Build (or reuse one).
let apkUrl = arg('apk-url');
if (!apkUrl) {
  console.log(
    `release: building ${tag} on EAS (profile "${PROFILE}"); this takes about 10 to 20 minutes`,
  );
  const build = run(
    'npx',
    [
      'eas-cli',
      'build',
      '--platform',
      'android',
      '--profile',
      PROFILE,
      '--non-interactive',
      '--wait',
      '--json',
    ],
    { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 },
  );
  if (build.status !== 0) fail('the EAS build failed (see the log above).');
  let builds;
  try {
    builds = JSON.parse(build.stdout);
  } catch {
    fail(`could not read the build result:\n${build.stdout.slice(0, 2000)}`);
  }
  const b = Array.isArray(builds) ? builds[0] : builds;
  apkUrl = b?.artifacts?.applicationArchiveUrl ?? b?.artifacts?.buildUrl;
  if (!apkUrl)
    fail(`the build result has no APK URL:\n${JSON.stringify(b, null, 2).slice(0, 2000)}`);
  console.log(
    `release: built ${b.appVersion ?? version} (${b.appBuildVersion ?? '?'}), build ${b.id}`,
  );
}

// 4. Download and publish.
const dir = mkdtempSync(join(tmpdir(), 'kapitwatt-release-'));
try {
  const file = join(dir, APK_NAME);
  const res = await fetch(apkUrl);
  if (!res.ok) fail(`could not download the APK (HTTP ${res.status}).`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const mb = (statSync(file).size / 1048576).toFixed(1);
  console.log(`release: downloaded ${APK_NAME} (${mb} MB)`);

  const notes = [
    `KapitWatt for Android, version ${version}.`,
    '',
    'Install: download KapitWatt.apk on an Android phone and open it (allow your browser to install apps if asked), or use https://get.kapitwatt.dhekode.com.',
    '',
    'Simulated Laguna pilot: households, grid alerts and reward rates are simulated or placeholders.',
    '',
    `Built from ${head.slice(0, 7)}.`,
  ].join('\n');
  const notesFile = join(dir, 'notes.md');
  writeFileSync(notesFile, notes);
  const created = run(
    'gh',
    [
      'release',
      'create',
      tag,
      `"${file}"`,
      '--target',
      head,
      '--title',
      `"KapitWatt ${version}"`,
      '--notes-file',
      `"${notesFile}"`,
      ...(process.argv.includes('--draft') ? ['--draft'] : ['--latest']),
    ],
    { stdio: 'inherit' },
  );
  if (created.status !== 0) fail('gh release create failed.');
  console.log(`release: published ${tag}. The download page serves it now.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
