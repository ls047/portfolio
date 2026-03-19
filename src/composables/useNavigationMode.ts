import { ref, computed } from 'vue';

export type NavigationMode = 'manual' | 'automatic';

const mode = ref<NavigationMode>('automatic');

export function useNavigationMode() {
  const isManual = computed(() => mode.value === 'manual');
  const isAutomatic = computed(() => mode.value === 'automatic');

  const setMode = (m: NavigationMode) => {
    mode.value = m;
  };

  const toggleMode = () => {
    mode.value = mode.value === 'manual' ? 'automatic' : 'manual';
  };

  return {
    mode,
    isManual,
    isAutomatic,
    setMode,
    toggleMode,
  };
}
