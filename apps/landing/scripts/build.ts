/**
 * Builds get.kapitwatt.dhekode.com into apps/landing/dist: one HTML page whose CSS is generated from
 * @kapitwatt/tokens (so it cannot drift from DESIGN.md), Phosphor glyphs from @kapitwatt/icons, the brand
 * files from packages/assets, and a QR code of the page's own address.
 *
 *   pnpm --filter @kapitwatt/landing build
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { duration, easing, light, radius, size, space, typeScale } from '@kapitwatt/tokens';
import QRCode from 'qrcode';
// The glyph data only: the package entry also exports a React Native component.
import { glyphs } from '../../../packages/icons/src/glyphs';
import { renderPage, type PageInput } from '../src/page';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const assets = join(root, '../../packages/assets');
const dist = join(root, 'dist');

export const PAGE_URL = 'https://get.kapitwatt.dhekode.com/';
const REPO = 'Necookie/KapitWatt_Monorepo';
/** The release asset name `pnpm release:mobile` uploads. */
export const APK_NAME = 'KapitWatt.apk';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const px = (n: number) => `${n}px`;

function css(): string {
  const colors = Object.entries(light)
    .map(([k, v]) => `--${kebab(k)}:${v};`)
    .join('');
  const spaces = Object.entries(space)
    .map(([k, v]) => `--space-${String(k).replace('.', '_')}:${px(v)};`)
    .join('');
  const radii = Object.entries(radius)
    .map(([k, v]) => `--radius-${k}:${px(v)};`)
    .join('');
  const weight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
  const types = Object.entries(typeScale)
    .map(
      ([k, t]) =>
        `.t-${kebab(k)}{font-size:${px(t.fontSize)};line-height:${px(t.lineHeight)};letter-spacing:${px(t.letterSpacing)};font-weight:${weight[t.weight]};${'tabular' in t && t.tabular ? 'font-variant-numeric:tabular-nums;' : ''}}`,
    )
    .join('');
  const ease = `cubic-bezier(${easing.standard.join(',')})`;

  const faces = (['Regular', 'Medium', 'SemiBold'] as const)
    .map(
      (w, i) =>
        `@font-face{font-family:'Albert Sans';src:url(/fonts/AlbertSans-${w}.ttf) format('truetype');font-weight:${[400, 500, 600][i]};font-display:swap}`,
    )
    .join('');

  return `${faces}
:root{${colors}${spaces}${radii}color-scheme:light;--gutter:16px;--max:1080px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--surface);color:var(--on-surface);font-family:'Albert Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3,p,ol{margin:0}
ol{padding:0;list-style:none}
${types}
.muted{color:var(--on-surface-variant)}
.wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 var(--gutter)}
.skip{position:absolute;left:-9999px}
.skip:focus{left:var(--space-4);top:var(--space-4);z-index:2;background:var(--surface);padding:var(--space-2) var(--space-4);border-radius:var(--radius-full)}
:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
.icon{width:${px(size.icon)};height:${px(size.icon)};fill:currentColor;flex:none}
.icon-sm{width:${px(size.iconSm)};height:${px(size.iconSm)}}

.bar{background:var(--surface-container);position:sticky;top:0;z-index:1}
.bar-inner{height:64px;display:flex;align-items:center}
.logo img{display:block;height:28px;width:auto}

.layout{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-6);padding-top:var(--space-6);padding-bottom:var(--space-10)}
.main-col,.side-col{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-6);align-content:start;min-width:0}

.hero{display:grid;gap:var(--space-4);justify-items:start}
.hero h1{color:var(--brand);max-width:16ch}
.mascot{justify-self:center;width:128px}
.mascot svg{display:block;width:100%;height:auto}
.download{display:grid;gap:var(--space-2);width:100%}
.meta{text-align:center}

.chip{display:inline-flex;align-items:center;gap:var(--space-2);height:32px;padding:0 var(--space-3);border-radius:var(--radius-sm);font-size:14px;line-height:20px;letter-spacing:.1px;font-weight:500}
.chip-simulated{background:var(--simulated-container);color:var(--on-simulated-container);border:1px dashed var(--simulated)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);border-radius:var(--radius-full);text-decoration:none;font-weight:600;transition:background-color ${duration.short4}ms ${ease}}
.btn-filled{background:var(--primary);color:var(--on-primary)}
.btn-filled:hover{background:color-mix(in srgb,var(--primary) 92%,var(--on-primary))}
.btn-filled:active{background:color-mix(in srgb,var(--primary) 90%,var(--on-primary))}
.btn-lg{height:${px(size.controlLg)};padding:0 var(--space-8);font-size:16px;line-height:24px;letter-spacing:.15px;width:100%}

.card{border-radius:var(--radius-md);padding:var(--space-4)}
.card-filled{background:var(--surface-container-highest)}
.card-outlined{background:var(--surface);border:1px solid var(--outline-variant)}
.card h2{margin-bottom:var(--space-3)}

.install{display:grid;gap:var(--space-4);margin-bottom:var(--space-4)}
.install li{display:grid;grid-template-columns:40px 1fr;gap:var(--space-3);align-items:start}
.install h3{margin-bottom:var(--space-1)}
.num{width:40px;height:40px;border-radius:var(--radius-full);background:var(--primary-container);color:var(--on-primary-container);display:grid;place-items:center}
.note{display:flex;gap:var(--space-2);align-items:flex-start;color:var(--on-surface-variant)}

.how h2{margin-bottom:var(--space-4)}
.steps{display:grid;gap:var(--space-3)}
.step{display:grid;grid-template-columns:48px 1fr;gap:var(--space-3);align-items:start;background:var(--surface-container-low);border-radius:var(--radius-md);padding:var(--space-4)}
.step h3{margin-bottom:var(--space-1)}
.step-icon{width:48px;height:48px;border-radius:var(--radius-full);background:var(--secondary-container);color:var(--on-secondary-container);display:grid;place-items:center}
.step:last-child .step-icon{background:var(--tertiary-container);color:var(--on-tertiary-container)}

.qr-card{display:none;text-align:center;justify-items:center;gap:var(--space-2)}
.qr{width:184px;margin:var(--space-2) auto}
.qr svg{display:block;width:100%;height:auto}
.url{color:var(--primary)}

.foot{background:var(--surface-container);padding:var(--space-6) 0 calc(var(--space-6) + env(safe-area-inset-bottom))}
.foot .wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--space-2)}

@media (min-width:600px){
  :root{--gutter:24px}
  .btn-lg{width:auto}
  .download{justify-items:start}
  .meta{text-align:left}
  .hero{grid-template-columns:1fr auto;align-items:center}
  .hero>*{grid-column:1}
  .hero .mascot{grid-column:2;grid-row:1/span 3;width:160px}
}
@media (min-width:840px){
  :root{--gutter:32px}
  .layout{grid-template-columns:minmax(0,1fr) 320px;gap:var(--space-8);padding-top:var(--space-10)}
  .side-col{position:sticky;top:88px}
  .qr-card{display:grid}
  .hero h1{font-size:45px;line-height:52px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;
}

const iconPaths = (name: keyof typeof glyphs) =>
  glyphs[name].regular.map((d) => `<path d="${d}"/>`).join('');

/** Phosphor "download-simple", regular weight (not in the app's icon subset). */
function downloadIcon(): string {
  const file = join(
    root,
    '../../node_modules/@phosphor-icons/core/assets/regular/download-simple.svg',
  );
  const svg = readFileSync(file, 'utf8');
  return [...svg.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => `<path d="${m[1]}"/>`).join('');
}

async function qrSvg(): Promise<string> {
  const svg = await QRCode.toString(PAGE_URL, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: light.onSurface, light: light.surface },
  });
  return svg.replace('<svg ', '<svg role="img" aria-label="QR code for this page" ');
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'fonts'), { recursive: true });

const input: PageInput = {
  css: css(),
  icons: {
    download: downloadIcon(),
    alert: iconPaths('alert'),
    commit: iconPaths('commit'),
    energy: iconPaths('energy'),
    meterPhoto: iconPaths('meterPhoto'),
    reward: iconPaths('reward'),
    simulated: iconPaths('simulated'),
    info: iconPaths('info'),
  },
  logo: '<img src="/kapitwatt-lockup.svg" alt="" width="164" height="28" />',
  mascot: readFileSync(join(assets, 'mascot/alitaptap-reward.svg'), 'utf8')
    .replace(/ role="img"/, '')
    .replace(/ aria-label="[^"]*"/, ''),
  qr: await qrSvg(),
  apkUrl: `https://github.com/${REPO}/releases/latest/download/${APK_NAME}`,
  releaseApi: `https://api.github.com/repos/${REPO}/releases/latest`,
  pageUrl: PAGE_URL,
};
writeFileSync(join(dist, 'index.html'), renderPage(input));
writeFileSync(
  join(dist, '404.html'),
  renderPage(input).replace(
    '<title>KapitWatt for Android</title>',
    '<title>Not found · KapitWatt</title>',
  ),
);

for (const w of ['Regular', 'Medium', 'SemiBold']) {
  cpSync(join(assets, `fonts/static/AlbertSans-${w}.ttf`), join(dist, `fonts/AlbertSans-${w}.ttf`));
}
cpSync(join(assets, 'fonts/OFL.txt'), join(dist, 'fonts/OFL.txt'));
cpSync(join(assets, 'logo/kapitwatt-lockup.svg'), join(dist, 'kapitwatt-lockup.svg'));
for (const f of [
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
]) {
  cpSync(join(assets, `logo/web/${f}`), join(dist, f));
}
// Long cache for fonts and images; the page itself is always revalidated.
writeFileSync(
  join(dist, '_headers'),
  `/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/*.svg\n  Cache-Control: public, max-age=86400\n/\n  Cache-Control: no-cache\n`,
);
console.log(`built ${dist}`);
