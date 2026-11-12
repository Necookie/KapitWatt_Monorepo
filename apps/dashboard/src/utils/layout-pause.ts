/**
 * Lets the app shell pause width-driven layout while the sidebar animates. During the pause,
 * components that size themselves from their measured width (bento rows, grids, charts) keep their
 * current layout and let the browser reflow them; when it ends they take their final width once.
 * Without it they would measure and re-render on every frame of the animation.
 */
let pausedUntil = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

export function pauseLayout(ms: number) {
  pausedUntil = Date.now() + ms;
  clearTimeout(timer);
  timer = setTimeout(() => {
    pausedUntil = 0;
    listeners.forEach((resume) => resume());
  }, ms);
}

export const layoutPaused = () => Date.now() < pausedUntil;

/** Called once when a pause ends. Returns the unsubscribe. */
export function onLayoutResume(resume: () => void) {
  listeners.add(resume);
  return () => {
    listeners.delete(resume);
  };
}
