import router from '@/router';
import carModelUrl from '@/assets/1987_buick_grand_national_regal_gnx.glb?url';

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
  set(46);

  await preloadFetch('/low-poly_cctv_camera.glb');
  set(56);

  await import('@/pages/home.vue');
  set(78);

  await frameStable();
  set(95);

  set(100);
}
