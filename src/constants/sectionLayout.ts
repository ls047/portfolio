/** Shared home layout (Me, Skills, Experiences, Contact). `.section` is required for `useReadingContrast`. */
/** Below `md`, edge-to-edge. From `md` up, symmetric horizontal padding so copy stays clear of the full-bleed CCTV frame + right rail. */
export const sectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(1.75rem,4.5vh,3.5rem)] px-0 md:px-[clamp(1rem,4vw,1.5rem)] sm:py-[clamp(2rem,5vh,3.5rem)]';

/** Projects: tablet symmetric; lg+ keeps tight start, full end padding vs full-bleed CCTV frame. */
export const projectsSectionRootClass =
  'section flex min-h-screen w-full min-w-0 items-center justify-start py-[clamp(1.75rem,4.5vh,3.5rem)] px-0 sm:py-[clamp(2rem,5vh,3.5rem)] md:max-lg:px-[clamp(1rem,4vw,1.5rem)] lg:ps-[clamp(0.5rem,2vw,1rem)] lg:pe-[max(1.25rem,min(8vw,5rem))]';

/** Inner column: phone flush; tablet centered readable width; lg+ half column beside side camera. */
export const sectionContentClass =
  'section-content w-full min-w-0 max-w-full md:max-lg:mx-auto md:max-lg:max-w-[min(38rem,92vw)] lg:mx-0 lg:ml-0 lg:mr-auto lg:max-w-[50%]';
