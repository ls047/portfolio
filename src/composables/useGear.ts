import { ref, computed } from 'vue';

export type Gear = '1' | '2' | '3' | '4' | 'R';

// Manual transmission: 4 gears + R
const GEARS: Gear[] = ['1', '2', '3', '4', 'R'];

const currentGear = ref<Gear>('1');

export function useGear() {
  const setGear = (gear: Gear) => {
    currentGear.value = gear;
  };

  const nextGear = () => {
    const idx = GEARS.indexOf(currentGear.value);
    if (idx < GEARS.length - 1) {
      currentGear.value = GEARS[idx + 1];
    }
  };

  const prevGear = () => {
    const idx = GEARS.indexOf(currentGear.value);
    if (idx > 0) {
      currentGear.value = GEARS[idx - 1];
    }
  };

  const gearIndex = computed(() => GEARS.indexOf(currentGear.value));

  return {
    currentGear,
    gears: GEARS,
    setGear,
    nextGear,
    prevGear,
    gearIndex,
  };
}
