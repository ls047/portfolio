import router from '@/router';
import carModelUrl from '@/assets/1987_buick_grand_national_regal_gnx.glb?url';
import tireImageUrl from '@/assets/Polished Buick wheel with chrome detail.png';

const MIN_LOAD_MS = 900;

function preloadFetch(url: string): Promise<void> {
  return fetch(url, { mode: 'same-origin', cache: 'force-cache' })
    .then(() => undefined)
    .catch(() => undefined);
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return document.fonts.ready.then(() => undefined).catch(() => undefined);
}

function frameStable(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export type BootstrapProgressHandler = (percent: number) => void;

/**
 * Sequential milestones 0 → 100 so the bar feels like a game loader.
 */
export async function runAppBootstrap(onProgress: BootstrapProgressHandler): Promise<void> {
  const started = performance.now();
  let p = 0;
  const set = (next: number) => {
    p = Math.max(p, Math.min(100, next));
    onProgress(p);
  };

  set(0);
  await router.isReady();
  set(12);

  await fontsReady();
  set(28);

  await preloadFetch(carModelUrl);
  set(48);

  await preloadImage(tireImageUrl);
  set(62);

  await import('@/pages/home.vue');
  set(82);

  await frameStable();
  set(90);

  const elapsed = performance.now() - started;
  if (elapsed < MIN_LOAD_MS) {
    const steps = 5;
    const remaining = MIN_LOAD_MS - elapsed;
    for (let i = 1; i <= steps; i += 1) {
      await new Promise((r) => setTimeout(r, remaining / steps));
      set(90 + Math.round((10 * i) / steps));
    }
  }

  set(100);
}
