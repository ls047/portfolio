/** Shared home layout (Me, Skills, Experiences, Contact). `.section` is required for `useReadingContrast`. */
/** `px-0` below md — edge-to-edge on phones; horizontal padding from `md` up. */
export const sectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(1.75rem,4.5vh,3.5rem)] px-0 md:px-[clamp(1rem,4vw,1.5rem)] sm:py-[clamp(2rem,5vh,3.5rem)]';

/** Projects: tablet = symmetric inset (bottom tire); lg+ = extra end padding for right strip tire. */
export const projectsSectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(1.75rem,4.5vh,3.5rem)] px-0 sm:py-[clamp(2rem,5vh,3.5rem)] md:max-lg:px-[clamp(1rem,4vw,1.5rem)] lg:px-[clamp(1rem,4vw,1.5rem)] lg:pe-[max(1.25rem,min(8vw,5rem))] lg:ps-[clamp(0.5rem,2vw,1rem)]';

/** Inner column: phone flush; tablet centered readable width; lg+ half column beside side tire. */
export const sectionContentClass =
  'section-content w-full min-w-0 max-w-full md:max-lg:mx-auto md:max-lg:max-w-[min(38rem,92vw)] lg:mx-0 lg:ml-0 lg:mr-auto lg:max-w-[50%]';
