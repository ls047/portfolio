/** Shared home layout (Me, Skills, Experiences, Contact). `.section` is required for `useReadingContrast`. */
export const sectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(2rem,5vh,3.5rem)] px-[clamp(0.75rem,3vw,1.5rem)]';

/** Projects only: asymmetric padding (room for tire). */
export const projectsSectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(2rem,5vh,3.5rem)] pe-[max(1.25rem,min(8vw,5rem))] ps-[clamp(0.5rem,2vw,1rem)]';

/** Inner column; `.section-content` is the anchor for reading-contrast sampling. */
export const sectionContentClass =
  'section-content w-full min-w-0 max-w-[50%] ml-0 mr-auto';
