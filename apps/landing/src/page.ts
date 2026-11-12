/**
 * The download page, as one HTML string. Mobile first: a single column on a phone, a second column (the
 * QR code for people on a computer) from the expanded size class up. Flat Material 3 per DESIGN.md:
 * surfaces step by tone, one filled button, no shadows or gradients, Albert Sans, colour roles only.
 */

export interface PageInput {
  css: string;
  icons: Record<
    'download' | 'alert' | 'commit' | 'energy' | 'meterPhoto' | 'reward' | 'simulated' | 'info',
    string
  >;
  logo: string;
  mascot: string;
  qr: string;
  /** Always serves the newest release's APK. */
  apkUrl: string;
  /** GitHub API: the latest release, for the version and size labels. */
  releaseApi: string;
  pageUrl: string;
}

const STEPS = [
  {
    icon: 'alert',
    title: 'Grid alert',
    body: 'When the Luzon grid is short of power, KapitWatt tells you before the peak window.',
  },
  {
    icon: 'commit',
    title: 'Commit a cut',
    body: 'Choose how much to cut: 0.5, 1, 1.5 or 2 kW, within what your home can do.',
  },
  {
    icon: 'energy',
    title: 'Shift your use',
    body: 'During the window, turn off or delay what you can: aircon, plantsa, washing machine.',
  },
  {
    icon: 'meterPhoto',
    title: 'Measure',
    body: 'Two meter photos in the app, before and after. With a smart meter, nothing to do.',
  },
  {
    icon: 'reward',
    title: 'Reward',
    body: 'A bill credit for every kWh you verifiably saved, plus a bonus when your barangay hits its target.',
  },
] as const;

const INSTALL = [
  {
    title: 'Download the APK',
    body: 'Tap the button above. Your browser may ask to confirm the download.',
  },
  {
    title: 'Allow the install',
    body: 'Open the file. If Android asks, allow your browser to install unknown apps, then go back.',
  },
  {
    title: 'Open KapitWatt',
    body: 'Sign up with your email, or log in with the demo account the team gives you.',
  },
] as const;

export function renderPage(p: PageInput): string {
  const svg = (paths: string, cls = 'icon') =>
    `<svg class="${cls}" viewBox="0 0 256 256" aria-hidden="true" focusable="false">${paths}</svg>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>KapitWatt for Android</title>
<meta name="description" content="Download KapitWatt for Android. Cut power at the grid's peak, earn a bill credit for what you verifiably save. Simulated Laguna pilot." />
<meta name="theme-color" content="#171C8F" />
<meta property="og:title" content="KapitWatt for Android" />
<meta property="og:description" content="Cut power at the grid's peak, earn a bill credit for what you verifiably save." />
<meta property="og:url" content="${p.pageUrl}" />
<meta property="og:image" content="${p.pageUrl}icon-512.png" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="preload" href="/fonts/AlbertSans-SemiBold.ttf" as="font" type="font/ttf" crossorigin />
<style>${p.css}</style>
</head>
<body>
<a class="skip" href="#download">Skip to download</a>
<header class="bar">
  <div class="wrap bar-inner">
    <span class="logo" role="img" aria-label="KapitWatt">${p.logo}</span>
  </div>
</header>

<main class="wrap layout">
  <div class="main-col">
    <section class="hero" aria-labelledby="hero-title">
      <span class="chip chip-simulated">${svg(p.icons.simulated, 'icon icon-sm')}Simulated Laguna pilot</span>
      <h1 id="hero-title" class="t-headline-large">Bawas kuryente sa peak, may credit ka.</h1>
      <p class="t-body-large muted">
        KapitWatt alerts you when the grid is short of power. Commit to cutting a little during the peak
        window, and earn a bill credit for the energy you verifiably save.
      </p>
      <div class="mascot" aria-hidden="true">${p.mascot}</div>
      <div id="download" class="download">
        <a class="btn btn-filled btn-lg" href="${p.apkUrl}" data-apk>
          ${svg(p.icons.download)}<span>Download for Android</span>
        </a>
        <p class="t-body-medium muted meta" data-release aria-live="polite">For Android phones · APK</p>
      </div>
    </section>

    <section class="card card-filled" aria-labelledby="install-title">
      <h2 id="install-title" class="t-title-large">Install in 3 steps</h2>
      <ol class="install">
        ${INSTALL.map(
          (s, i) => `<li>
          <span class="num t-title-medium" aria-hidden="true">${i + 1}</span>
          <div><h3 class="t-title-medium">${s.title}</h3><p class="t-body-large muted">${s.body}</p></div>
        </li>`,
        ).join('')}
      </ol>
      <p class="note t-body-medium">${svg(p.icons.info, 'icon icon-sm')}<span>Android only for the pilot. There is no iPhone version.</span></p>
    </section>

    <section aria-labelledby="how-title" class="how">
      <h2 id="how-title" class="t-title-large">How it works</h2>
      <ol class="steps">
        ${STEPS.map(
          (s) => `<li class="step">
          <span class="step-icon">${svg(p.icons[s.icon])}</span>
          <div><h3 class="t-title-medium">${s.title}</h3><p class="t-body-large muted">${s.body}</p></div>
        </li>`,
        ).join('')}
      </ol>
    </section>
  </div>

  <aside class="side-col" aria-labelledby="qr-title">
    <div class="card card-outlined qr-card">
      <h2 id="qr-title" class="t-title-medium">On a computer?</h2>
      <p class="t-body-medium muted">Scan with your Android phone to open this page there.</p>
      <div class="qr">${p.qr}</div>
      <p class="t-label-large url">${p.pageUrl.replace(/^https:\/\//, '').replace(/\/$/, '')}</p>
    </div>
    <div class="card card-filled demo">
      <h2 class="t-title-medium">At the demo?</h2>
      <p class="t-body-medium muted">Ask the KapitWatt team for a demo login. Each demo account works on one phone at a time.</p>
    </div>
  </aside>
</main>

<footer class="foot">
  <div class="wrap t-body-medium muted">
    <p><strong>Simulated pilot.</strong> The households, grid alerts and reward rates in KapitWatt are simulated
    or placeholders; real rates would be set by Meralco and the ERC. KapitWatt is not a Meralco product.</p>
    <p>Team CodeBearers · IDOL Hackathon 2026</p>
  </div>
</footer>

<script>
(function () {
  var meta = document.querySelector('[data-release]');
  var button = document.querySelector('[data-apk]');
  fetch(${JSON.stringify(p.releaseApi)}, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (release) {
      if (!release) return;
      var apk = (release.assets || []).filter(function (a) { return /\\.apk$/i.test(a.name); })[0];
      if (!apk) return;
      var mb = Math.round(apk.size / 1048576);
      var date = new Date(release.published_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
      meta.textContent = 'Version ' + String(release.tag_name).replace(/^v/, '') + ' · ' + mb + ' MB · ' + date;
      button.href = apk.browser_download_url;
    })
    .catch(function () {});
})();
</script>
</body>
</html>
`;
}
