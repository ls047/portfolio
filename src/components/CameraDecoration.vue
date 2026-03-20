<template>
  <div
    v-show="visible"
    class="camera-decoration pointer-events-none fixed top-0 right-0 left-auto z-[120] flex h-screen w-[min(28vw,400px)] flex-col items-start justify-start gap-[0.35rem] overflow-visible pt-[env(safe-area-inset-top,0)] pr-[env(safe-area-inset-right,0)] max-lg:right-[max(0.75rem,env(safe-area-inset-right,0px))] max-lg:w-[min(42vw,280px)]"
    aria-hidden="true"
  >
    <div class="flex w-full items-center justify-center self-stretch">

    </div>
    <div
      class="w-[var(--camera-canvas-w)] max-w-none shrink-0"
    >
      <div
        ref="threeHostRef"
        class="relative m-0 h-[var(--camera-canvas-h)] min-h-[260px] max-lg:min-h-[168px] w-[var(--camera-canvas-w)] overflow-visible rounded-none border-0 bg-transparent shadow-none [&_canvas]:m-0 [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:max-w-none"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { getLightCenterPx, getLightSweepBaseAndAmp } from '../utils/readingLight';
  import { readingLightSweepPhase, SWEEP_YAW_LIGHT_COUPLE_SIGN } from '../utils/readingLightSweep';
  import { CCTV_GLB_URL, preloadCctvGlb } from '../utils/preloadCctvGlb';

  const props = defineProps<{
    visible: boolean;
  }>();

  const threeHostRef = ref<HTMLElement | null>(null);

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Mean direction toward the reading column + sweep driven by `readingLightSweepPhase` (same sin as the moving glow). */
  const HEAD_YAW_BIAS = reduceMotion ? -0.48 : -0.56;
  const SWEEP_YAW_MAG = reduceMotion ? 0 : 0.38;
  const SWEEP_PITCH_MAG = reduceMotion ? 0 : 0.12;
  const AIM_PITCH_RANGE = reduceMotion ? 0.2 : 0.32;
  const ROT_SMOOTH = reduceMotion ? 0.45 : 0.11;

  /**
   * Horizontal aim uses the same numbers as the radial gradient: u = (lx − baseX) / amp ≡ sin(phase).
   * `SWEEP_YAW_LIGHT_COUPLE_SIGN` flips if the GLB’s +Y reads opposite to on-screen glow travel.
   *
   * Compact: same rail position as desktop, but glow sits low — **nod down** at bottom center; **no** strong
   * `HEAD_YAW_BIAS` “look left toward column” (that’s desktop-only).
   */
  function aimRotationFromReadingLight(): { targetY: number; targetX: number } {
    const host = threeHostRef.value;
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const { baseX, amp } = getLightSweepBaseAndAmp(vw);
    const { x: lx, y: ly } = getLightCenterPx(vw, vh);
    const u = amp > 1e-6 ? (lx - baseX) / amp : 0;
    const c = reduceMotion ? 1 : Math.cos(readingLightSweepPhase.value);

    if (!host) {
      return {
        targetY: HEAD_YAW_BIAS + SWEEP_YAW_LIGHT_COUPLE_SIGN * u * SWEEP_YAW_MAG,
        targetX: c * SWEEP_PITCH_MAG,
      };
    }

    if (vw < 1024) {
      const rect = host.getBoundingClientRect();
      const hy = rect.top + rect.height * 0.5;
      const dy = ly - hy;
      const ny = Math.max(0, Math.min(1, dy / Math.max(vh * 0.34, 110)));
      const targetY = SWEEP_YAW_LIGHT_COUPLE_SIGN * u * (reduceMotion ? 0.06 : SWEEP_YAW_MAG * 0.42);
      const targetX = ny * (reduceMotion ? 0.3 : 0.84) + c * 0.045;
      return { targetY, targetX };
    }

    const rect = host.getBoundingClientRect();
    const cy = rect.top + rect.height * 0.5;
    const dy = ly - cy;
    const scaleY = Math.max(120, vh * 0.38);
    const ny = Math.max(-1, Math.min(1, dy / scaleY));
    return {
      targetY: HEAD_YAW_BIAS + SWEEP_YAW_LIGHT_COUPLE_SIGN * u * SWEEP_YAW_MAG,
      targetX: ny * AIM_PITCH_RANGE + c * SWEEP_PITCH_MAG,
    };
  }

  let threeInited = false;
  let scene: THREE.Scene | null = null;
  let perspectiveCam: THREE.PerspectiveCamera | null = null;
  let renderer: THREE.WebGLRenderer | null = null;
  /** Whole asset — no per-frame rotation (mount stays put). */
  let modelRoot: THREE.Group | null = null;
  /** PTZ head from GLB (`cam_01`); rotation aims at reading-light center in viewport space. */
  let cctvHeadRef: THREE.Object3D | null = null;
  let frameId = 0;
  let resizeObs: ResizeObserver | null = null;
  /** False during intro (camera rail hidden) — keep rAF but skip draws to avoid extra GPU while car intro runs. */
  let tickRenderEnabled = false;

  function resolveCctvHead(root: THREE.Object3D): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    root.traverse((o) => {
      if (found) return;
      if (o.name === 'cam_01') found = o;
    });
    if (!found) {
      root.traverse((o) => {
        if (found) return;
        if (/^cam_attachment/i.test(o.name)) found = o;
      });
    }
    return found;
  }

  /**
   * Place camera so the loaded rig fills the viewport.
   * `shiftCamWorldX` (× dist): move camera +X after framing so the mesh sits toward the **left** of the canvas (compact only).
   */
  function fitPerspectiveCameraToObject(
    cam: THREE.PerspectiveCamera,
    object: THREE.Object3D,
    margin = 1.32,
    shiftCamWorldX = 0,
  ) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const half = Math.max(size.x, size.y, size.z) * 0.5;
    const fovRad = (cam.fov * Math.PI) / 180;
    const dist = (half * margin) / Math.tan(fovRad / 2);
    const offset = new THREE.Vector3(0.48, 0.38, 0.85).normalize().multiplyScalar(dist);
    cam.position.copy(center).add(offset);
    if (shiftCamWorldX !== 0) {
      cam.position.x += shiftCamWorldX * dist;
    }
    cam.near = Math.max(dist / 128, 0.04);
    cam.far = Math.max(dist * 48, 80);
    cam.updateProjectionMatrix();
    cam.lookAt(center);
  }

  function syncRendererToHost() {
    const host = threeHostRef.value;
    const cam = perspectiveCam;
    if (!renderer || !cam || !host) return;
    const rw = Math.max(1, Math.round(host.getBoundingClientRect().width));
    const rh = Math.max(1, Math.round(host.getBoundingClientRect().height));
    cam.aspect = rw / rh;
    cam.updateProjectionMatrix();
    renderer.setSize(rw, rh, false);
  }

  function tickThree() {
    frameId = requestAnimationFrame(tickThree);
    if (!renderer || !scene || !perspectiveCam) return;
    if (!tickRenderEnabled) return;

    const { targetY, targetX } = aimRotationFromReadingLight();
    const head = cctvHeadRef;
    if (head) {
      head.rotation.y += (targetY - head.rotation.y) * ROT_SMOOTH;
      head.rotation.x += (targetX - head.rotation.x) * ROT_SMOOTH;
    } else if (modelRoot) {
      modelRoot.rotation.y += (targetY - modelRoot.rotation.y) * ROT_SMOOTH;
      modelRoot.rotation.x += (targetX - modelRoot.rotation.x) * ROT_SMOOTH;
    }

    renderer.render(scene, perspectiveCam);
  }

  /** Dispose all GPU refs (geometries, every texture slot on materials) so GLB VRAM + retained textures drop. */
  function disposeThreeTree(root: THREE.Object3D) {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (!mat) return;
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        const rec = m as unknown as Record<string, unknown>;
        for (const key of Object.keys(rec)) {
          const v = rec[key];
          if (v && typeof v === 'object' && 'isTexture' in v && (v as THREE.Texture).isTexture) {
            (v as THREE.Texture).dispose();
          }
        }
        m.dispose();
      }
    });
  }

  function teardownThree() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    tickRenderEnabled = false;
    resizeObs?.disconnect();
    resizeObs = null;

    cctvHeadRef = null;
    if (modelRoot && scene) {
      scene.remove(modelRoot);
      disposeThreeTree(modelRoot);
      modelRoot = null;
    }

    if (renderer) {
      const host = threeHostRef.value;
      if (host?.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
      const canvas = renderer.domElement;
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      renderer.dispose();
      const lose = gl?.getExtension?.('WEBGL_lose_context') as
        | { loseContext: () => void }
        | undefined;
      lose?.loseContext();
      renderer = null;
    }

    scene = null;
    perspectiveCam = null;
    threeInited = false;
  }

  async function setupThree() {
    const host = threeHostRef.value;
    if (!host || threeInited) return;

    const rect = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    const newScene = new THREE.Scene();
    const newCam = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    newCam.position.set(0, 0.4, 2.2);
    newCam.lookAt(0, 0.1, 0);
    scene = newScene;
    perspectiveCam = newCam;

    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      stencil: false,
      depth: true,
    });
    renderer.setClearColor(0x000000, 0);
    /* Rail canvas is small; DPR>1 multiplies color/depth buffers (~4× at 2×) for little visual gain. */
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    newScene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xfff5e8, 1.1);
    key.position.set(2, 4, 3);
    newScene.add(key);
    const fill = new THREE.DirectionalLight(0xa8c8ff, 0.35);
    fill.position.set(-2, 1, -1);
    newScene.add(fill);

    modelRoot = new THREE.Group();
    newScene.add(modelRoot);

    resizeObs = new ResizeObserver(() => {
      syncRendererToHost();
    });
    resizeObs.observe(host);

    threeInited = true;
    tickRenderEnabled = props.visible;
    tickThree();

    try {
      await preloadCctvGlb();
      const gltf = await new GLTFLoader().loadAsync(CCTV_GLB_URL);
      const root = gltf.scene;
      if (!modelRoot || !threeHostRef.value || !props.visible) {
        disposeThreeTree(root);
        return;
      }

      const box = new THREE.Box3().setFromObject(root);
      const center = new THREE.Vector3();
      let maxDim = 1;
      if (!box.isEmpty()) {
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());
        maxDim = Math.max(size.x, size.y, size.z, 1e-4);
      }
      const vw0 = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const compactFit = vw0 < 1024;
      const scale = (compactFit ? 1.08 : 1.28) / maxDim;

      root.position.sub(center);
      root.scale.setScalar(scale);
      root.rotation.y = -Math.PI * 0.06;
      root.rotation.x = -0.05;
      root.visible = true;
      root.traverse((o) => {
        o.visible = true;
      });

      const head = resolveCctvHead(root);
      cctvHeadRef = head;
      if (head) {
        const aim = aimRotationFromReadingLight();
        head.rotation.y = aim.targetY;
        head.rotation.x = aim.targetX;
      }

      modelRoot.add(root);
      root.updateMatrixWorld(true);

      const cam = perspectiveCam;
      if (cam) {
        syncRendererToHost();
        fitPerspectiveCameraToObject(cam, root, compactFit ? 1.48 : 1.2, compactFit ? 0.18 : 0);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[CameraDecoration] GLB load failed:', err);
      teardownThree();
    }
  }

  watch(
    () => props.visible,
    (v) => {
      tickRenderEnabled = v;
    },
    { immediate: true },
  );

  watch(
    [() => threeHostRef.value, () => props.visible],
    async () => {
      await nextTick();
      const host = threeHostRef.value;
      if (!host || !props.visible) {
        teardownThree();
        return;
      }
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (!threeHostRef.value || !props.visible) return;
      await setupThree();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    teardownThree();
  });
</script>

<style scoped>
  /* Shared canvas dimensions (desktop vs mobile) — Tailwind reads via arbitrary properties. */
  .camera-decoration {
    --camera-canvas-w: min(82vw, 640px);
    --camera-canvas-h: min(78vh, 620px);
  }

  @media (max-width: 1023px) {
    .camera-decoration {
      /* Rail nudged left vs desktop (see template `right: max(...)`); larger preview on phone */
      --camera-canvas-w: min(62vw, 252px);
      --camera-canvas-h: min(38vh, 248px);
    }
  }
</style>
