<template>
  <div class="min-h-screen min-w-0 py-[clamp(2rem,6vh,4rem)]">
    <div class="flex min-h-full min-w-0 flex-col justify-center gap-[clamp(4rem,14vh,10rem)]">
      <MeSection :me="cvData.me" />
      <SkillsSection :skills="cvData.skills" />
      <ProjectsSection :projects="cvData.projects" />
      <ExperiencesSection
        :experiences="cvData.experiences"
        :education="cvData.education"
      />
      <ContactSection
        :phone="cvData.me.phone"
        :email="cvData.me.email"
        :languages="cvData.languages"
        :links="cvData.links"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSeo } from '../utils';
import { useAppConfig } from '../composables/useAppConfig';
import { cvData } from '../data/cv';
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
