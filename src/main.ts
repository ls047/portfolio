import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import { initializeConfig } from './config';
import { readingChars } from './directives/readingChars';
import { preloadCctvGlb } from './utils/preloadCctvGlb';

// Initialize app configuration (theme, SEO, fonts, etc.)
initializeConfig();

/** Overlap CCTV GLB fetch + parse with app boot so the rail can mount without a late pop-in. */
void preloadCctvGlb().catch(() => {});

const pinia = createPinia();
const app = createApp(App);

app.directive('reading-chars', readingChars);

app.use(pinia);
app.use(router);
app.mount('#app');
