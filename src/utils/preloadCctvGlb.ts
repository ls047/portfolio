export const CCTV_GLB_URL = '/low-poly_cctv_camera.glb';

/** Warm HTTP cache + bandwidth early; `GLTFLoader` later hits cache and parses once (safe to dispose). */
let fetchPromise: Promise<void> | null = null;

export function preloadCctvGlb(): Promise<void> {
  if (!fetchPromise) {
    fetchPromise = fetch(CCTV_GLB_URL, { mode: 'cors', credentials: 'same-origin' }).then(
      () => {},
      () => {},
    );
  }
  return fetchPromise;
}
