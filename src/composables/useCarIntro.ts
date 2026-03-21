import { ref, onMounted, onBeforeUnmount, watch, nextTick, type Ref } from 'vue';
import { carIntroSceneReady, carIntroScrollUnlocked, carIntroStartRequested } from './appLoadGate';
import { siteSoundMuted } from './siteSound';
import type {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  DirectionalLight,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Scene,
  Texture,
  WebGLRenderer,
} from 'three';

import carModelUrl from '@/assets/1987_buick_grand_national_regal_gnx.glb?url';
import { shouldSkipHeavyIntro } from '@/utils/perfSkip';
import { preloadCctvGlb } from '@/utils/preloadCctvGlb';
import skidSfxUrl from '@/audio/ES_Car, Skid To Stop, Tire Squeal - Epidemic Sound.mp3';
import lampFlickerSfxUrl from '@/audio/freesound_community-fluorescent-lamp-flickering-17625.mp3';
const CAR_MODEL_URL = carModelUrl;
const LAMP_FLICKER_CLIP_MS = 3000;
const LIGHT_ATTEMPT_PEAK = 30; // intensity during failed attempts (more visible fade)
const DRIFT_START = 1.0; // straight-line drive duration (s); drift begins when car hits DRIVE_END_Z
/** Z where straight drive ends — must match drift phase at p=0 (baseZ = -2). */
const DRIVE_END_Z = -2;
/** Start closer to camera so the car fills the lower frame and motion reads from frame 0. */
const DRIVE_START_Z = -8.85;
const DRIFT_DURATION = 2.85;
/** When within drift phase, play once `p` (0=start…1=end of drift) reaches this — easy to tune; ~0.004 ≈ first 6ms. */
const SKID_SFX_AT_P = 0.004;
/** Skip silent lead-in in the MP3 (seconds). Only set if the clip has dead air and still sounds late after lowering `SKID_SFX_AT_P`. */
const SKID_SFX_TRIM_START_SEC = 0;
const LIGHT_FLASH_DURATION = 2.0;
const LIGHT_FLOOD_DURATION = 1.2; // circular light expands after boot work finishes
const INTRO_BOOT_LOAD_TIMEOUT_MS = 25000;

/** Drives HTML overlay: drift → “code in smoke”, headlights loop until real boot work finishes → flood. */
export type CarIntroPhase = 'idle' | 'drive' | 'drift' | 'boot' | 'done';

// Skid marks offset from arc center (1.25, 0.75) - applied directly to mesh world positions
const SKID_OFFSET_X = 1.0;
const SKID_OFFSET_Z = 8.0;

function waitForPageLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
}

function fontsReadyLocal(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) {
    return Promise.resolve();
  }
  return document.fonts.ready.then(() => undefined).catch(() => undefined);
}

function doubleRaf(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Defer heavy Three.js parse/compile until the browser has painted the loader (improves FCP / TBT on mobile Lighthouse). */
function waitForIdleThenThree(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    const ric = window.requestIdleCallback;
    if (typeof ric === 'function') {
      ric(() => resolve(), { timeout: 1800 });
    } else {
      window.setTimeout(resolve, 320);
    }
  });
}

export function useCarIntro(containerRef: Ref<HTMLElement | null>) {
  const contentOpacity = ref(0);
  const introPhase = ref<CarIntroPhase>('idle');
  /** 0…1 during drift only (for “code through smoke” overlay opacity). */
  const driftProgress = ref(0);
  /** Boot log lines revealed (0…3) — driven by real preload steps, not fixed headlight cycles. */
  const bootLinesRevealed = ref(0);
  /** CCTV/fonts/layout ready; headlight loop stops and flood + content reveal run. */
  const introContentReady = ref(false);

  /** If WebGL or GLB fails (common on strict mobile / privacy modes), still show the page. */
  function revealContentFallback() {
    contentOpacity.value = 1;
    introPhase.value = 'done';
    driftProgress.value = 0;
    bootLinesRevealed.value = 3;
    introContentReady.value = true;
    carIntroSceneReady.value = true;
  }

  /** Runtime namespace — assigned only after `import('three')` (keeps three chunk off initial parse). */
  let THREE!: typeof import('three');

  let scene: Scene;
  let camera: PerspectiveCamera;
  let renderer: WebGLRenderer;
  let car: Group | null = null;
  let headlightLeft: PointLight;
  let headlightRight: PointLight;
  let rearLightLeft: PointLight;
  let rearLightRight: PointLight;
  let headlightLenses: { mesh: Mesh; mat: MeshBasicMaterial }[] = [];
  let headlightOverlays: MeshBasicMaterial[] = []; // scene-level overlays for guaranteed visibility
  let headlightOverlayMeshes: Mesh[] = []; // for cleanup
  let overlayTex: CanvasTexture | null = null;
  let overlayGeo: BufferGeometry | null = null;
  let lightFloodMesh: Mesh | null = null; // circular light that expands to fill screen
  let skidMarksGroup: Group;
  let smokeGroup: Group;
  let groundPlane: Mesh | null = null;
  let groundRoadTexture: CanvasTexture | null = null;
  let screenPlane: Mesh | null = null;
  let ambientLight: AmbientLight | null = null;
  let dirLight: DirectionalLight | null = null;
  let introDisposed = false;
  let introWebglReady = false;
  let introGpuTornDown = false;
  let carIntroCancelled = false;
  let webglRunning = false;
  let frameId = 0;

  /** Procedural asphalt + lane markings (matches PlaneGeometry UVs: U ≈ world X, V ≈ world Z). */
  function createRoadTexture(): CanvasTexture {
    const w = 512;
    const h = 384;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2a2a2c');
    grd.addColorStop(0.5, '#262628');
    grd.addColorStop(1, '#222224');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);

    const laneTint = 'rgba(255, 255, 255, 0.04)';
    ctx.fillStyle = laneTint;
    ctx.fillRect(Math.floor(w * 0.2), 0, Math.floor(w * 0.22), h);
    ctx.fillRect(Math.floor(w * 0.58), 0, Math.floor(w * 0.22), h);

    const edgeW = Math.max(3, Math.floor(w * 0.006));
    const edgeInset = Math.floor(w * 0.055);
    ctx.fillStyle = '#ececec';
    ctx.fillRect(edgeInset, 0, edgeW, h);
    ctx.fillRect(w - edgeInset - edgeW, 0, edgeW, h);

    const dashW = Math.max(4, Math.floor(w * 0.01));
    const cx = Math.floor(w / 2 - dashW / 2);
    const dashLen = Math.floor(h / 28);
    const gapLen = Math.floor(h / 22);
    ctx.fillStyle = '#d4af37';
    for (let y = -dashLen; y < h + dashLen; y += dashLen + gapLen) {
      ctx.fillRect(cx, y, dashW, dashLen);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createSkidMarks() {
    const group = new THREE.Group();
    group.position.y = -0.999; // just above ground so marks are visible (ground y=-1)
    group.rotation.x = -Math.PI / 2;

    // Soft-edged rubber streak texture (marks appear with smoke during drift)
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 8;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 32, 0);
    grad.addColorStop(0, 'rgba(20,15,12,0)');
    grad.addColorStop(0.15, 'rgba(20,15,12,0.5)');
    grad.addColorStop(0.5, 'rgba(15,10,8,0.95)');
    grad.addColorStop(0.85, 'rgba(20,15,12,0.5)');
    grad.addColorStop(1, 'rgba(20,15,12,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 8);
    const streakTex = new THREE.CanvasTexture(canvas);

    const darkMat = new THREE.MeshBasicMaterial({
      map: streakTex,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      depthTest: true,
    });

    // Drift arc: car path from (0,-2) to (2.5,3.5) - drift while going up, center (1.25, 0.75)
    const R = 1.25;
    const trackWidth = 0.11;
    const trackLength = 0.18;
    const tireSpacing = 0.48;
    const numSegments = 28;

    for (let side = -1; side <= 1; side += 2) {
      const offsetX = side * tireSpacing * 0.5;
      for (let i = 0; i < numSegments; i++) {
        const segProgress = numSegments > 1 ? i / (numSegments - 1) : 1;
        const angle = segProgress * Math.PI;
        const jitter = 0.04;
        // Car path: drift while going up - from (0,-2) to (2.5,3.5), offset applied directly to positions
        const worldX = 1.25 - R * Math.cos(angle) + offsetX + (Math.random() - 0.5) * jitter + SKID_OFFSET_X;
        const worldZ = -2 + 5.5 * segProgress + (Math.random() - 0.5) * jitter + SKID_OFFSET_Z;
        const x = worldX;
        const z = worldZ;
        const segLen = trackLength * (0.7 + Math.random() * 0.6);
        const geo = new THREE.PlaneGeometry(segLen, trackWidth);
        const mesh = new THREE.Mesh(geo, darkMat.clone());
        mesh.position.set(x, -z, 0);
        mesh.rotation.z = angle + Math.PI + (Math.random() - 0.5) * 0.15; // 180° to match car direction
        mesh.userData.segmentProgress = segProgress;
        mesh.userData.baseOpacity = 0.9;
        group.add(mesh);
      }
    }
    group.visible = false;
    return group;
  }

  function createSmoke() {
    const group = new THREE.Group();

    // Soft billowing smoke texture (not particles) - larger gradient for cloud-like look
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(220,220,215,0.5)');
    gradient.addColorStop(0.2, 'rgba(190,190,185,0.35)');
    gradient.addColorStop(0.45, 'rgba(140,140,135,0.15)');
    gradient.addColorStop(0.7, 'rgba(100,100,95,0.04)');
    gradient.addColorStop(1, 'rgba(60,60,55,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const smokeMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Fewer, larger smoke planes for billowing smoke (not particle-like)
    // Shared material - all smoke uses same opacity (saves material instances)
    for (let i = 0; i < 4; i++) {
      const size = 2.2 + Math.random() * 1.8;
      const geo = new THREE.PlaneGeometry(size, size);
      const mesh = new THREE.Mesh(geo, smokeMat);
      // Positions behind car (negative Z in group) - spread into a cloud
      mesh.position.set(
        (Math.random() - 0.5) * 2,
        0.3 + Math.random() * 0.8,
        -0.8 - Math.random() * 2.2,
      );
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.phase = Math.random() * Math.PI * 2;
      mesh.userData.riseSpeed = 0.25 + Math.random() * 0.3;
      mesh.userData.spread = 0.15 + Math.random() * 0.2;
      group.add(mesh);
    }
    group.visible = false;
    return group;
  }

  function addHeadlights(carGroup: Group, scale: number) {
    // Car is scaled to 2.5 total; front is 1.25 from center. Local pos = 1.25/scale to reach front
    const offset = 1.25 / scale;
    const headlightWhite = 0xffffff;
    const headlightWarm = 0xfff5e0; // Slight halogen warmth for realism

    // Front lights (model front may be +Z or -Z - we add both)
    headlightLeft = new THREE.PointLight(headlightWarm, 0, 35, 1.2);
    headlightLeft.position.set(0.35 * scale, 0.4 * scale, offset);
    carGroup.add(headlightLeft);

    headlightRight = new THREE.PointLight(headlightWarm, 0, 35, 1.2);
    headlightRight.position.set(-0.35 * scale, 0.4 * scale, offset);
    carGroup.add(headlightRight);

    // Rear lights (animate all 4 - whichever faces camera will glow)
    rearLightLeft = new THREE.PointLight(headlightWarm, 0, 30, 1.2);
    rearLightLeft.position.set(0.35 * scale, 0.4 * scale, -offset);
    carGroup.add(rearLightLeft);
    rearLightRight = new THREE.PointLight(headlightWarm, 0, 30, 1.2);
    rearLightRight.position.set(-0.35 * scale, 0.4 * scale, -offset);
    carGroup.add(rearLightRight);

    // Emissive headlight lenses - visible glow regardless of PointLight reach
    const lensRadius = 0.18 * scale;
    const nudge = 0.08 * scale; // push lenses slightly outward from car body
    const positions: [number, number, number, boolean][] = [
      [0.35 * scale, 0.4 * scale, offset + nudge, true],
      [-0.35 * scale, 0.4 * scale, offset + nudge, true],
      [0.35 * scale, 0.4 * scale, -offset - nudge, false],
      [-0.35 * scale, 0.4 * scale, -offset - nudge, false],
    ];
    for (const [x, y, z, isFront] of positions) {
      const geo = new THREE.CircleGeometry(lensRadius, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: headlightWarm,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.renderOrder = 100;
      if (!isFront) mesh.rotation.y = Math.PI;
      carGroup.add(mesh);
      headlightLenses.push({ mesh, mat });
    }
  }

  function handleResize() {
    if (!webglRunning || !containerRef.value || !renderer || !camera) return;
    camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  }

  function disposeObject3DTree(root: Object3D) {
    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (!mat) return;
      const mats = Array.isArray(mat) ? mat : [mat];
      for (const m of mats) {
        const rec = m as unknown as Record<string, unknown>;
        for (const key of Object.keys(rec)) {
          const v = rec[key];
          if (v && typeof v === 'object' && 'isTexture' in v && (v as Texture).isTexture) {
            (v as Texture).dispose();
          }
        }
        m.dispose();
      }
    });
  }

  let skidSfxAudio: HTMLAudioElement | null = null;
  let skidSfxPreload: HTMLAudioElement | null = null;
  let skidSfxPlayed = false;

  function preloadSkidSfx() {
    if (skidSfxPreload) return;
    try {
      const a = new Audio(skidSfxUrl);
      a.preload = 'metadata';
      void a.load();
      skidSfxPreload = a;
    } catch {
      /* ignore */
    }
  }

  function playSkidSfxOnce() {
    if (skidSfxPlayed) return;
    if (siteSoundMuted.value) return;
    skidSfxPlayed = true;
    try {
      const a = skidSfxPreload ?? new Audio(skidSfxUrl);
      skidSfxPreload = null;
      skidSfxAudio = a;
      a.volume = 0.72;
      const applyTrimAndPlay = () => {
        const trim = SKID_SFX_TRIM_START_SEC;
        if (trim > 0 && Number.isFinite(a.duration) && a.duration > trim + 0.05) {
          a.currentTime = trim;
        } else {
          a.currentTime = 0;
        }
        void a.play().catch(() => {});
      };
      if (a.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) applyTrimAndPlay();
      else a.addEventListener('canplay', applyTrimAndPlay, { once: true });
    } catch {
      /* autoplay / decode blocked */
    }
  }

  function stopSkidSfx() {
    if (skidSfxPreload) {
      skidSfxPreload.pause();
      skidSfxPreload.removeAttribute('src');
      skidSfxPreload.load();
      skidSfxPreload = null;
    }
    if (!skidSfxAudio) return;
    skidSfxAudio.pause();
    skidSfxAudio.removeAttribute('src');
    skidSfxAudio.load();
    skidSfxAudio = null;
  }

  let lampFlickerAudio: HTMLAudioElement | null = null;
  let lampFlickerClipTimer: ReturnType<typeof setTimeout> | null = null;
  let lampFlickerStarted = false;

  function playLampFlickerClipOnce() {
    if (lampFlickerStarted) return;
    if (siteSoundMuted.value) return;
    lampFlickerStarted = true;
    if (lampFlickerClipTimer) {
      clearTimeout(lampFlickerClipTimer);
      lampFlickerClipTimer = null;
    }
    try {
      lampFlickerAudio = new Audio();
      lampFlickerAudio.preload = 'none';
      lampFlickerAudio.src = lampFlickerSfxUrl;
      lampFlickerAudio.volume = 0.5;
      lampFlickerAudio.currentTime = 0;
      const playLamp = () => {
        void lampFlickerAudio?.play().catch(() => {});
      };
      if (lampFlickerAudio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) playLamp();
      else lampFlickerAudio.addEventListener('canplay', playLamp, { once: true });
      lampFlickerClipTimer = window.setTimeout(() => {
        lampFlickerClipTimer = null;
        if (lampFlickerAudio) {
          lampFlickerAudio.pause();
          lampFlickerAudio.currentTime = 0;
        }
      }, LAMP_FLICKER_CLIP_MS);
    } catch {
      /* ignore */
    }
  }

  function stopLampFlicker() {
    if (lampFlickerClipTimer) {
      clearTimeout(lampFlickerClipTimer);
      lampFlickerClipTimer = null;
    }
    if (!lampFlickerAudio) return;
    lampFlickerAudio.pause();
    lampFlickerAudio.removeAttribute('src');
    lampFlickerAudio.load();
    lampFlickerAudio = null;
  }

  watch(siteSoundMuted, (muted) => {
    if (muted) {
      stopSkidSfx();
      stopLampFlicker();
    }
  });

  onMounted(() => {
    if (!containerRef.value) {
      revealContentFallback();
      return;
    }

    if (shouldSkipHeavyIntro()) {
      revealContentFallback();
      return;
    }

    let introKickoff = false;
    function startIntro() {
      if (introKickoff) return;
      introKickoff = true;
      void (async () => {
      await waitForPageLoaded();
      if (carIntroCancelled || !containerRef.value) return;

      /* Yield so the game loader / first paint can commit before parsing Three + compiling shaders (cuts TBT on mobile). */
      await doubleRaf();
      if (carIntroCancelled || !containerRef.value) return;

      await waitForIdleThenThree();
      if (carIntroCancelled || !containerRef.value) return;

      THREE = await import('three');

      void fetch(CAR_MODEL_URL, { mode: 'cors', credentials: 'same-origin' }).catch(() => {});

      try {
        scene = new THREE.Scene();
        introWebglReady = true;
        scene.background = new THREE.Color(0x2a2a2a);

        camera = new THREE.PerspectiveCamera(
          50,
          containerRef.value.clientWidth / containerRef.value.clientHeight,
          0.1,
          1000,
        );
        camera.position.set(0, 1.5, -10);
        camera.lookAt(0, 0, 2);

        renderer = new THREE.WebGLRenderer({
          antialias: false,
          powerPreference: 'low-power',
          stencil: false,
          depth: true,
        });
      } catch {
        revealContentFallback();
        return;
      }

      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    /* Caps GPU color/depth allocation during intro; full-bleed canvas is largest WebGL surface. */
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.value.appendChild(renderer.domElement);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const groundGeo = new THREE.PlaneGeometry(60, 40);
    groundRoadTexture = createRoadTexture();
    groundRoadTexture.anisotropy = Math.min(2, renderer.capabilities.getMaxAnisotropy());
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundRoadTexture,
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.02,
    });
    groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -1;
    groundPlane.position.z = 0;
    scene.add(groundPlane);

    // Vertical plane in front of camera for headlights to hit when car faces us
    screenPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 12),
      new THREE.MeshStandardMaterial({
        color: 0x282828,
        roughness: 0.95,
        metalness: 0,
      }),
    );
    screenPlane.position.set(0, 2, -5);
    scene.add(screenPlane);

    skidMarksGroup = createSkidMarks();
    skidMarksGroup.position.set(0, -0.999, 0); // offset baked into mesh positions via SKID_OFFSET_X/Z
    skidMarksGroup.renderOrder = 1; // render on top of ground
    scene.add(skidMarksGroup);

    smokeGroup = createSmoke();
    scene.add(smokeGroup);

    // Scene-level headlight overlays - soft halogen glow, positioned between car and camera
    const headlightWarm = 0xfff5e0;
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = 64;
    overlayCanvas.height = 64;
    const overlayCtx = overlayCanvas.getContext('2d')!;
    const overlayGrad = overlayCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    overlayGrad.addColorStop(0, 'rgba(255,245,224,0.95)');
    overlayGrad.addColorStop(0.4, 'rgba(255,245,224,0.6)');
    overlayGrad.addColorStop(0.7, 'rgba(255,245,224,0.2)');
    overlayGrad.addColorStop(1, 'rgba(255,245,224,0)');
    overlayCtx.fillStyle = overlayGrad;
    overlayCtx.fillRect(0, 0, 64, 64);
    overlayTex = new THREE.CanvasTexture(overlayCanvas);
    overlayGeo = new THREE.CircleGeometry(0.55, 16);
    for (const x of [2.15, 2.85]) {
      const mat = new THREE.MeshBasicMaterial({
        map: overlayTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(overlayGeo, mat);
      mesh.position.set(x, 0.4, 2.4); // in front of car (2.5,0,3.5) facing camera
      mesh.rotation.y = Math.PI; // face camera at z=-10
      mesh.renderOrder = 200;
      scene.add(mesh);
      headlightOverlays.push(mat);
      headlightOverlayMeshes.push(mesh);
    }

    // Circular light flood - bright center, darker edges (headlight look)
    const floodCanvas = document.createElement('canvas');
    floodCanvas.width = 128;
    floodCanvas.height = 128;
    const floodCtx = floodCanvas.getContext('2d')!;
    const floodGrad = floodCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    floodGrad.addColorStop(0, 'rgba(255,250,240,0.95)');   // bright center
    floodGrad.addColorStop(0.08, 'rgba(255,245,224,0.75)');
    floodGrad.addColorStop(0.16, 'rgba(255,240,210,0.45)');
    floodGrad.addColorStop(0.26, 'rgba(180,160,140,0.15)');
    floodGrad.addColorStop(0.38, 'rgba(30,25,20,0.9)');   // dark
    floodGrad.addColorStop(0.5, 'rgba(8,8,8,1)');          // near black
    floodGrad.addColorStop(1, 'rgb(0,0,0)');               // solid black corners
    floodCtx.fillStyle = floodGrad;
    floodCtx.fillRect(0, 0, 128, 128);
    const floodTex = new THREE.CanvasTexture(floodCanvas);
    const floodGeo = new THREE.CircleGeometry(1, 16);
    const floodMat = new THREE.MeshBasicMaterial({
      map: floodTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    lightFloodMesh = new THREE.Mesh(floodGeo, floodMat);
    lightFloodMesh.position.set(2.5, 0.4, 0); // center between car and camera
    lightFloodMesh.rotation.y = Math.PI; // face camera
    lightFloodMesh.scale.setScalar(0);
    lightFloodMesh.visible = false;
    lightFloodMesh.renderOrder = 300;
    scene.add(lightFloodMesh);

      let introT0 = -1;
      let bootLoadStarted = false;
      let tRevealAnchor = -1;

      async function runIntroBootLoad() {
        const timeout = new Promise<void>((r) => setTimeout(r, INTRO_BOOT_LOAD_TIMEOUT_MS));
        try {
          await Promise.race([
            (async () => {
              await nextTick();
              if (carIntroCancelled) return;
              bootLinesRevealed.value = 1;
              await preloadCctvGlb();
              if (carIntroCancelled) return;
              bootLinesRevealed.value = 2;
              await fontsReadyLocal();
              if (carIntroCancelled) return;
              bootLinesRevealed.value = 3;
              await doubleRaf();
            })(),
            timeout,
          ]);
        } catch {
          /* allow reveal */
        }
        if (!carIntroCancelled) introContentReady.value = true;
      }

      const GLTFLoader = (await import('three/examples/jsm/loaders/GLTFLoader.js')).GLTFLoader;
      const loader = new GLTFLoader();
      try {
        const gltf = await loader.loadAsync(CAR_MODEL_URL);
        if (carIntroCancelled || introGpuTornDown || !containerRef.value) {
          disposeObject3DTree(gltf.scene);
          return;
        }

        car = gltf.scene;

        const box = new THREE.Box3().setFromObject(car);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;

        car.position.sub(center);
        car.scale.setScalar(scale);
        car.rotation.y = 0;
        car.position.set(0, 0, DRIVE_START_Z);

        addHeadlights(car, scale);
        // Enable transparency on car materials for light-flood fade-out
        car.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as Material;
            if ('transparent' in mat) (mat as MeshStandardMaterial).transparent = true;
            if ('opacity' in mat) (mat as MeshStandardMaterial).opacity = 1;
          }
        });
        scene.add(car);

        renderer.compile(scene, camera);
        renderer.render(scene, camera);
        carIntroSceneReady.value = true;

        preloadSkidSfx();

        webglRunning = true;
        window.addEventListener('resize', handleResize);
        frameId = requestAnimationFrame(animate);
      } catch (err) {
        console.error('Error loading car:', err);
        shutdownIntroWebGL();
        revealContentFallback();
      }

    function setAllLights(intensity: number) {
      if (headlightLeft) headlightLeft.intensity = intensity;
      if (headlightRight) headlightRight.intensity = intensity;
      if (rearLightLeft) rearLightLeft.intensity = intensity;
      if (rearLightRight) rearLightRight.intensity = intensity;
      const lensOpacity = Math.min(1, intensity / 60);
      headlightLenses.forEach(({ mat }) => { mat.opacity = lensOpacity; });
      headlightOverlays.forEach((mat) => { mat.opacity = lensOpacity; });
    }

    function animate(timestamp?: number) {
      const ts = timestamp ?? performance.now();
      if (introT0 < 0) introT0 = ts;
      const t = (ts - introT0) / 1000;

      if (car) {
        if (t < DRIFT_START) {
          // Straight drive — linear so speed is constant (no “ease” slow-start)
          const raw = Math.min(1, Math.max(0, t / DRIFT_START));
          const z = DRIVE_START_Z + raw * (DRIVE_END_Z - DRIVE_START_Z);
          car.position.set(0, 0, z);
          car.rotation.y = 0;
          setAllLights(0);
          skidMarksGroup.visible = false;
          smokeGroup.visible = false;
        } else if (t < DRIFT_START + DRIFT_DURATION) {
          if (!bootLoadStarted) {
            bootLoadStarted = true;
            void runIntroBootLoad();
          }
          const p = (t - DRIFT_START) / DRIFT_DURATION;
          // Drift while going up: from (0,-2) to (2.5,3.5) - rear kicks out, car moves forward
          const rotationProgress = 1 - Math.pow(1 - p, 0.4);
          const positionProgress = 1 - Math.pow(1 - p, 1.6);
          if (p >= SKID_SFX_AT_P) playSkidSfxOnce();
          const angle = positionProgress * Math.PI;
          const R = 1.25;
          const cx = 1.25;

          const baseX = cx - R * Math.cos(angle);
          const baseZ = -2 + 5.5 * positionProgress; // z increases during drift (going up)
          const wobble = Math.sin(p * Math.PI) * 0.08;
          car.position.set(baseX + wobble, 0, baseZ);
          car.rotation.y = rotationProgress * Math.PI + wobble * 0.5;
          setAllLights(0);

          skidMarksGroup.visible = true;
          skidMarksGroup.position.set(0, -0.999, 0); // offset baked into mesh positions
          skidMarksGroup.updateMatrixWorld(true); // ensure position change is applied
          skidMarksGroup.renderOrder = 1;
          (skidMarksGroup.children as Mesh[]).forEach((m) => {
            const mat = m.material as MeshBasicMaterial;
            const segP = m.userData.segmentProgress as number;
            // Reveal as rear tires pass - synced with smoke (both from sliding rear wheels)
            const rearOffset = 0.05; // marks appear where rear tires have been
            if (p < segP + rearOffset) {
              mat.opacity = 0;
            } else {
              mat.opacity = 0.95 * Math.min(1, (p - segP - rearOffset) * 15);
            }
          });

          smokeGroup.visible = true;
          // Smoke behind car: offset in car's rear direction (rear = -forward)
          const rearX = -Math.sin(car.rotation.y);
          const rearZ = -Math.cos(car.rotation.y);
          smokeGroup.position.set(
            car.position.x + rearX * 1.8,
            0,
            car.position.z + rearZ * 1.8
          );
          smokeGroup.rotation.y = 0; // smoke stays fixed, does not turn with car
          (smokeGroup.children as Mesh[]).forEach((m) => {
            const mat = m.material as MeshBasicMaterial;
            const driftProgress = p * 1.2;
            mat.opacity = Math.min(0.85, driftProgress) * 0.7;
            m.position.y = m.userData.baseY + Math.sin(t * 2.5 + m.userData.phase) * m.userData.riseSpeed;
            m.position.x = Math.sin(t * 1.8 + m.userData.phase * 2) * m.userData.spread * driftProgress;
          });
        } else if (!introContentReady.value) {
          car.position.set(2.5, 0, 3.5);
          car.rotation.y = Math.PI;
          skidMarksGroup.visible = true;
          (skidMarksGroup.children as Mesh[]).forEach((m) => {
            (m.material as MeshBasicMaterial).opacity = 0.85;
          });
          smokeGroup.visible = false;

          const flashPhase = t - DRIFT_START - DRIFT_DURATION;
          const loopPhase = flashPhase % LIGHT_FLASH_DURATION;
          const cycleDuration = LIGHT_FLASH_DURATION / 3;
          const cycleIndex = Math.floor(loopPhase / cycleDuration);
          const cycleProgress = (loopPhase % cycleDuration) / cycleDuration;
          const fade = cycleProgress < 0.35
            ? cycleProgress / 0.35
            : cycleProgress < 0.5
              ? 1
              : (1 - (cycleProgress - 0.5) / 0.5);
          const attemptPeak = 35;
          const fullIntensity = 60;
          const intensity = cycleIndex < 2 ? fade * attemptPeak : fullIntensity;
          setAllLights(intensity);
        } else {
          if (tRevealAnchor < 0) {
            tRevealAnchor = t;
            playLampFlickerClipOnce();
          }
          car.position.set(2.5, 0, 3.5);
          car.rotation.y = Math.PI;
          setAllLights(60);
          skidMarksGroup.visible = true;
          smokeGroup.visible = false;

          const dt = t - tRevealAnchor;
          if (lightFloodMesh && dt < LIGHT_FLOOD_DURATION) {
            lightFloodMesh.visible = true;
            const p = dt / LIGHT_FLOOD_DURATION;
            const eased = 1 - Math.pow(1 - p, 0.7);
            const maxRadius = 25;
            lightFloodMesh.scale.setScalar(eased * maxRadius);
            const fadeOut = 1 - eased;
            const skidMarksFadeOut = Math.max(0, 1 - eased * 1.4);
            headlightOverlays.forEach((mat) => { mat.opacity = fadeOut; });
            (skidMarksGroup.children as Mesh[]).forEach((m) => {
              (m.material as MeshBasicMaterial).opacity = 0.85 * skidMarksFadeOut;
            });
            car.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => {
                  if ('opacity' in mat) (mat as MeshStandardMaterial).opacity = fadeOut;
                });
              }
            });
          } else if (!lightFloodMesh || dt >= LIGHT_FLOOD_DURATION) {
            if (lightFloodMesh) {
              lightFloodMesh.visible = true;
              lightFloodMesh.scale.setScalar(25);
              headlightOverlays.forEach((mat) => { mat.opacity = 0; });
              (skidMarksGroup.children as Mesh[]).forEach((m) => {
                (m.material as MeshBasicMaterial).opacity = 0;
              });
              if (car) car.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material && 'opacity' in child.material) {
                  (child.material as MeshStandardMaterial).opacity = 0;
                }
              });
            }
            disposeIntroObjects();
            shutdownIntroWebGL();
          }
        }

        const floodDone =
          introContentReady.value &&
          tRevealAnchor >= 0 &&
          t - tRevealAnchor >= LIGHT_FLOOD_DURATION;
        const isRevealed = floodDone;

        if (t < DRIFT_START) {
          introPhase.value = 'drive';
          driftProgress.value = 0;
        } else if (t < DRIFT_START + DRIFT_DURATION) {
          introPhase.value = 'drift';
          driftProgress.value = (t - DRIFT_START) / DRIFT_DURATION;
        } else if (
          !introContentReady.value ||
          (tRevealAnchor >= 0 && t - tRevealAnchor < LIGHT_FLOOD_DURATION)
        ) {
          introPhase.value = 'boot';
          driftProgress.value = 0;
        } else {
          introPhase.value = 'done';
          driftProgress.value = 0;
        }
        contentOpacity.value = isRevealed ? 1 : 0;
      }

      if (webglRunning && renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      if (webglRunning) {
        frameId = requestAnimationFrame(animate);
      }
    }

      })();
    }

    watch(
      carIntroStartRequested,
      (requested) => {
        if (requested) startIntro();
      },
      { immediate: true },
    );
  });

  /** After intro: stop rAF, dispose car-era + environment meshes, tear down WebGL (no idle GPU). */
  function shutdownIntroWebGL() {
    webglRunning = false;
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', handleResize);
    stopSkidSfx();
    stopLampFlicker();
    if (!introWebglReady || introGpuTornDown) return;
    introGpuTornDown = true;

    disposeIntroObjects();

    if (lightFloodMesh) {
      scene.remove(lightFloodMesh);
      lightFloodMesh.geometry.dispose();
      const fm = lightFloodMesh.material as MeshBasicMaterial;
      if (fm.map) fm.map.dispose();
      fm.dispose();
      lightFloodMesh = null;
    }
    if (groundPlane) {
      scene.remove(groundPlane);
      groundPlane.geometry.dispose();
      const gm = groundPlane.material as MeshStandardMaterial;
      if (gm.map) {
        gm.map.dispose();
        groundRoadTexture = null;
      }
      gm.dispose();
      groundPlane = null;
    }
    if (screenPlane) {
      scene.remove(screenPlane);
      screenPlane.geometry.dispose();
      (screenPlane.material as Material).dispose();
      screenPlane = null;
    }
    if (ambientLight) {
      scene.remove(ambientLight);
      ambientLight = null;
    }
    if (dirLight) {
      scene.remove(dirLight);
      dirLight = null;
    }

    scene.clear();

    if (renderer && containerRef.value?.contains(renderer.domElement)) {
      containerRef.value.removeChild(renderer.domElement);
    }
    if (renderer) {
      const canvas = renderer.domElement;
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      renderer.dispose();
      const lose = gl?.getExtension?.('WEBGL_lose_context') as { loseContext: () => void } | undefined;
      lose?.loseContext();
    }
    renderer = null as unknown as WebGLRenderer;
    // Drop refs so car / road / scene graphs can't linger in JS memory
    scene = undefined as unknown as Scene;
    camera = undefined as unknown as PerspectiveCamera;
  }

  function disposeIntroObjects() {
    if (introDisposed) return;
    introDisposed = true;

    // Car (includes headlights, lenses)
    if (car) {
      scene.remove(car);
      car.traverse((obj) => {
        const mesh = obj as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (mat) {
          const mats = Array.isArray(mat) ? mat : [mat];
          for (const m of mats) {
            const rec = m as unknown as Record<string, unknown>;
            for (const key of Object.keys(rec)) {
              const v = rec[key];
              if (v && typeof v === 'object' && 'isTexture' in v && (v as Texture).isTexture) {
                (v as Texture).dispose();
              }
            }
            m.dispose();
          }
        }
      });
      car = null;
    }

    // Skid marks (each mesh: cloned material, **shared** streak texture — dispose map once)
    if (skidMarksGroup) {
      scene.remove(skidMarksGroup);
      let streakMap: Texture | undefined;
      (skidMarksGroup.children as Mesh[]).forEach((m) => {
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as MeshBasicMaterial | undefined;
        if (mat) {
          if (mat.map) streakMap = mat.map;
          mat.dispose();
        }
      });
      if (streakMap) streakMap.dispose();
    }

    // Smoke (all meshes share one material + texture — dispose once)
    if (smokeGroup) {
      scene.remove(smokeGroup);
      const children = smokeGroup.children as Mesh[];
      const sharedMat = children[0]?.material as MeshBasicMaterial | undefined;
      children.forEach((m) => {
        if (m.geometry) m.geometry.dispose();
      });
      if (sharedMat) {
        if (sharedMat.map) sharedMat.map.dispose();
        sharedMat.dispose();
      }
    }

    // Headlight overlays
    headlightOverlayMeshes.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.material) (mesh.material as Material).dispose();
    });
    headlightOverlayMeshes = [];
    headlightOverlays = [];
    if (overlayGeo) overlayGeo.dispose();
    if (overlayTex) overlayTex.dispose();
  }

  onBeforeUnmount(() => {
    carIntroCancelled = true;
    shutdownIntroWebGL();
  });

  watch(
    contentOpacity,
    (v) => {
      carIntroScrollUnlocked.value = v >= 1;
    },
    { immediate: true },
  );

  return { contentOpacity, introPhase, driftProgress, bootLinesRevealed };
}
