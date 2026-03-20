<template>
  <!-- Phone: narrow column; tablet: wider centered column + bottom padding for low glow; lg+: full row beside right camera. -->
  <div
    class="home-page min-h-screen min-w-0 py-[clamp(1.25rem,4vh,4rem)] max-md:px-[clamp(0.875rem,5vw,1.25rem)] max-md:pb-[max(6.5rem,min(40vh,17rem))] md:max-lg:ps-[clamp(1rem,4vw,1.75rem)] md:max-lg:pe-[max(0px,calc(clamp(1rem,4vw,1.75rem)-24px))] md:max-lg:pb-[max(5.5rem,min(32vh,15rem))] sm:py-[clamp(2rem,6vh,4rem)]"
  >
    <div
      class="flex min-h-full min-w-0 flex-col justify-center gap-[clamp(1.75rem,6vh,4.5rem)] max-md:mx-auto max-md:w-full max-md:max-w-[19rem] md:max-lg:mx-auto md:max-lg:w-full md:max-lg:max-w-[min(38rem,92vw)] lg:mx-0 lg:max-w-none md:gap-[clamp(2.5rem,10vh,5.5rem)] lg:gap-[clamp(3rem,12vh,8rem)] xl:gap-[clamp(4rem,14vh,10rem)]"
    >
      <SectionReveal>
        <MeSection :me="cvData.me" />
      </SectionReveal>
      <SectionReveal>
        <SkillsSection :skills="cvData.skills" />
      </SectionReveal>
      <SectionReveal>
        <ProjectsSection :projects="cvData.projects" />
      </SectionReveal>
      <SectionReveal>
        <ExperiencesSection
          :experiences="cvData.experiences"
          :education="cvData.education"
        />
      </SectionReveal>
      <SectionReveal>
        <ContactSection
          :phone="cvData.me.phone"
          :email="cvData.me.email"
          :languages="cvData.languages"
          :links="cvData.links"
        />
      </SectionReveal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeo } from '../utils';
import { useAppConfig } from '../composables/useAppConfig';
import { cvData } from '../data/cv';
import SectionReveal from '../components/SectionReveal.vue';
import MeSection from '../components/sections/MeSection.vue';
import SkillsSection from '../components/sections/SkillsSection.vue';
import ProjectsSection from '../components/sections/ProjectsSection.vue';
import ExperiencesSection from '../components/sections/ExperiencesSection.vue';
import ContactSection from '../components/sections/ContactSection.vue';

const { appTitle, appDescription } = useAppConfig();

useSeo({
  title: appTitle.value,
  description: appDescription.value,
});
</script>
