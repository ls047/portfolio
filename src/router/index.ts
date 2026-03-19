import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/home.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0, left: 0, behavior: 'auto' };
  },
});

export default router;
