/** Thumb and focus styles for the range input; injected once (web: the dashboard ships to the web). */
export function ensureParamSliderCss(primary: string, ring: string, surface: string) {
  if (typeof document === 'undefined' || document.getElementById('kw-param-css')) return;
  const style = document.createElement('style');
  style.id = 'kw-param-css';
  style.textContent = `
.kw-param{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;margin:0;outline:none;cursor:pointer}
.kw-param::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${primary};border:3px solid ${surface}}
.kw-param::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:${primary};border:3px solid ${surface}}
.kw-param:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px ${ring}}
.kw-param:focus-visible::-moz-range-thumb{box-shadow:0 0 0 3px ${ring}}`;
  document.head.appendChild(style);
}
