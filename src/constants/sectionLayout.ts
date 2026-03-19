/** Shared home layout (Me, Skills, Experiences, Contact). `.section` is required for `useReadingContrast`. */
/** `px-0` below md — edge-to-edge on phones; horizontal padding from `md` up. */
export const sectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(1.75rem,4.5vh,3.5rem)] px-0 md:px-[clamp(1rem,4vw,1.5rem)] sm:py-[clamp(2rem,5vh,3.5rem)]';

/** Projects: flush on small screens; asymmetric padding from md+ (desktop right tire). */
export const projectsSectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(1.75rem,4.5vh,3.5rem)] px-0 sm:py-[clamp(2rem,5vh,3.5rem)] md:px-[clamp(1rem,4vw,1.5rem)] md:pe-[max(1.25rem,min(8vw,5rem))] md:ps-[clamp(0.5rem,2vw,1rem)]';

/** Inner column: full width on small screens; half max on lg+ beside side tire (desktop). */
export const sectionContentClass =
  'section-content w-full min-w-0 max-w-full lg:max-w-[50%] ml-0 mr-auto';
