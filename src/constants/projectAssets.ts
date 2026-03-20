/** Shown when `CvProject.image` is missing or fails to load (path under `public/`). */
export const DEFAULT_PROJECT_IMAGE_URL = '/project-placeholder.svg';

/** Resolves a path served from `public/` (or an absolute http(s) URL) for the current `base` in Vite. */
export function publicUrl(path: string): string {
  const p = path.trim();
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.BASE_URL;
  const rel = p.replace(/^\/+/, '');
  return `${base}${rel}`;
}
