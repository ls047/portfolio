import router from '@/router';
import carModelUrl from '@/assets/1987_buick_grand_national_regal_gnx.glb?url';
import { shouldSkipHeavyIntro } from '@/utils/perfSkip';

function preloadFetch(url: string): Promise<void> {
  return fetch(url, { mode: 'same-origin', cache: 'force-cache' })
    .then(() => undefined)
    .catch(() => undefined);
}

function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return document.fonts.ready.then(() => undefined).catch(() => undefined);
}

/** Don’t block bootstrap on slow font CSS/network — caps main-thread wait for Lighthouse TBT. */
function fontsReadyOrTimeout(ms: number): Promise<void> {
  return Promise.race([
    fontsReady(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
}

function frameStable(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Splits long synchronous chains so the main thread can process input + paint (lower TBT in Lighthouse). */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export type BootstrapProgressHandler = (percent: number) => void;

/**
 * Sequential milestones 0 → 100 so the bar feels like a game loader.
 */
export async function runAppBootstrap(onProgress: BootstrapProgressHandler): Promise<void> {
  let p = 0;
  const set = (next: number) => {
    p = Math.max(p, Math.min(100, next));
    onProgress(p);
  };

  set(0);
  await router.isReady();
  set(12);
  await yieldToMain();

  /* Light path: shorter font wait — mobile Lighthouse TBT is sensitive to long main-thread stalls. */
  if (shouldSkipHeavyIntro()) {
    await fontsReadyOrTimeout(750);
  } else {
    await Promise.all([
      fontsReadyOrTimeout(1400),
      preloadFetch(carModelUrl),
      preloadFetch('/low-poly_cctv_camera.glb'),
    ]);
  }
  set(56);
  await yieldToMain();

  /* Home + layout load after bootstrap via lazy route / async layout */
  await frameStable();
  set(72);

  await frameStable();
  set(88);
  await yieldToMain();

  set(100);
}
