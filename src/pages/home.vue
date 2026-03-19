<template>
  <div
    class="content-wrapper"
    :class="{ 'manual-mode': isManual }"
  >
    <div class="content-area">
      <!-- 1 - Me -->
      <MeSection
        v-show="isManual ? currentGear === '1' : true"
        :me="cvData.me"
      />
      <!-- 2 - Skills -->
      <SkillsSection
        v-show="isManual ? currentGear === '2' : true"
        :skills="cvData.skills"
      />
      <!-- 3 - Projects -->
      <ProjectsSection
        v-show="isManual ? currentGear === '3' : true"
        :projects="cvData.projects"
      />
      <!-- 4 - Experiences -->
      <ExperiencesSection
        v-show="isManual ? currentGear === '4' : true"
        :experiences="cvData.experiences"
        :education="cvData.education"
      />
      <!-- R - Contact -->
      <ContactSection
        v-show="isManual ? currentGear === 'R' : true"
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
import { useGear } from '../composables/useGear';
import { useNavigationMode } from '../composables/useNavigationMode';
import { cvData } from '../data/cv';
import MeSection from '../components/sections/MeSection.vue';
import SkillsSection from '../components/sections/SkillsSection.vue';
import ProjectsSection from '../components/sections/ProjectsSection.vue';
import ExperiencesSection from '../components/sections/ExperiencesSection.vue';
import ContactSection from '../components/sections/ContactSection.vue';

const { appTitle, appDescription } = useAppConfig();
const { currentGear } = useGear();
const { isManual } = useNavigationMode();

    useSeo({
      title: appTitle.value,
      description: appDescription.value,
  });
</script>

<style scoped>
.content-wrapper {
  min-height: 100vh;
  /* No overflow here - layout's content-overlay is the scroll container */
}

.content-wrapper.manual-mode {
  height: 100vh;
  overflow: hidden;
}

.content-area {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.content-wrapper.manual-mode .content-area {
  height: 100%;
}

.content-area :deep(.section) {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem;
}

.content-wrapper.manual-mode .content-area :deep(.section) {
  flex: 1;
}

.content-area :deep(.container) {
  max-width: 36rem;
  margin: 0;
}
</style>
