import { ref, onMounted, onBeforeUnmount, watch, type Ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Raycaster } from 'three';
import { useGear, type Gear } from './useGear';

import gearModelUrl from '@/assets/gear_selectorgear_shiftergear_switch_cvt.glb?url';

export function useGearShifter3D(
  containerRef: Ref<HTMLElement | null>,
  contentOpacity: Ref<number>,
  currentGear: Ref<Gear>,
) {
  const { setGear } = useGear();

  let scene: THREE.Scene;
  let camera: THREE.OrthographicCamera;
  let renderer: THREE.WebGLRenderer;
  let gearModel: THREE.Group | null = null;
  let stickMesh: THREE.Object3D | null = null;
  let frameId: number;
  let isDragging = false;
  let raycaster: THREE.Raycaster;
  let mouse: THREE.Vector2;
  let stopGearWatch: (() => void) | null = null;

  // Stick rotation per gear (manual H-pattern)
  const GEAR_ROTATIONS: Record<Gear, { x: number; z: number }> = {
    '1': { x: 0.25, z: -0.35 },
    '2': { x: -0.25, z: -0.35 },
    '3': { x: 0.25, z: 0.35 },
    '4': { x: -0.25, z: 0.35 },
    R: { x: -0.5, z: -0.35 },
  };

  function findStick(obj: THREE.Object3D): THREE.Object3D | null {
    const name = (obj.name || '').toLowerCase();
    if (name.includes('stick') || name.includes('lever') || name.includes('handle') || name.includes('shift') || name.includes('knob') || name.includes('selector')) {
      return obj;
    }
    for (const child of obj.children) {
      const found = findStick(child);
      if (found) return found;
    }
    return null;
  }

  function findStickFallback(root: THREE.Group): THREE.Object3D | null {
    const found = findStick(root);
    if (found) return found;
    if (root.children.length > 0) {
      const first = root.children[0];
      if (first.children.length > 0) return first.children[0];
      return first;
    }
    return null;
  }

  function onPointerDown(event: PointerEvent) {
    if (contentOpacity.value < 0.9) return;
    const rect = containerRef.value?.getBoundingClientRect();
    if (!rect) return;

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    if (!gearModel) return;
    const intersects = raycaster.intersectObject(gearModel, true);

    // Start drag on hit OR on any click (easier to use)
    isDragging = true;
    (containerRef.value as HTMLElement).setPointerCapture(event.pointerId);
    onPointerMove(event);
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging || !containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();

    const nx = (event.clientX - rect.left) / rect.width;
    const ny = 1 - (event.clientY - rect.top) / rect.height;

    // Map position to gear (H-pattern zones)
    let gear: Gear = '1';
    if (ny < 0.35) {
      gear = nx < 0.5 ? '1' : '3';
    } else if (ny < 0.65) {
      gear = nx < 0.5 ? '2' : '4';
    } else {
      gear = nx < 0.4 ? 'R' : nx < 0.6 ? '2' : '4';
    }

    setGear(gear);
    if (stickMesh) {
      const r = GEAR_ROTATIONS[gear];
      stickMesh.rotation.x = r.x;
      stickMesh.rotation.z = r.z;
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (isDragging) {
      (containerRef.value as HTMLElement)?.releasePointerCapture(event.pointerId);
      isDragging = false;
    }
  }

  function animate() {
    frameId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  onMounted(() => {
    if (!containerRef.value) return;

    const aspect = 200 / 280;
    scene = new THREE.Scene();
    const frustum = 0.8;
    camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum,
      0.1, 100,
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(200, 280);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x1a1a1a, 1);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.touchAction = 'none';
    containerRef.value.appendChild(renderer.domElement);
    containerRef.value.addEventListener('contextmenu', (e) => e.preventDefault());

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 3, 2);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-1, 1, 1);
    scene.add(fill);

    raycaster = new Raycaster();
    mouse = new THREE.Vector2();

    // Procedural 3D gear shifter (always visible, reliable)
    function createProceduralShifter() {
      const group = new THREE.Group();
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.4,
        roughness: 0.7,
      });
      const stickMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.3,
        roughness: 0.8,
      });
      const knobMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        metalness: 0.5,
        roughness: 0.5,
      });
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.06, 0.15),
        baseMat,
      );
      base.position.y = -0.03;
      group.add(base);
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.22, 16),
        stickMat,
      );
      stick.position.y = 0.08;
      stick.rotation.x = 0.25;
      stick.rotation.z = -0.35;
      stick.userData.isStick = true;
      group.add(stick);
      stickMesh = stick;
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 12),
        knobMat,
      );
      knob.position.y = 0.19;
      stick.add(knob);
      return group;
    }

    const proceduralShifter = createProceduralShifter();
    proceduralShifter.scale.setScalar(2.5);
    gearModel = proceduralShifter;
    scene.add(gearModel);

    const r = GEAR_ROTATIONS[currentGear.value];
    if (stickMesh) {
      stickMesh.rotation.x = r.x;
      stickMesh.rotation.z = r.z;
    }

    // Optionally try loading GLB to replace procedural (CVT model often has scale/orient issues)
    const loader = new GLTFLoader();
    loader.load(
      gearModelUrl,
      (gltf) => {
        const loaded = gltf.scene;
        loaded.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(loaded);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const scale = 1.5 / maxDim;
        loaded.position.set(-center.x, -center.y, -center.z);
        loaded.scale.setScalar(scale);
        const found = findStickFallback(loaded);
        if (found) {
          scene.remove(gearModel!);
          gearModel = loaded;
          stickMesh = found;
          scene.add(gearModel);
          const rot = GEAR_ROTATIONS[currentGear.value];
          stickMesh.rotation.x = rot.x;
          stickMesh.rotation.z = rot.z;
        }
      },
      undefined,
      () => { /* keep procedural */ },
    );

    const el = containerRef.value;
    const preventContext = (e: Event) => e.preventDefault();
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    el.addEventListener('contextmenu', preventContext);

    stopGearWatch = watch(currentGear, (gear) => {
      if (stickMesh) {
        const r = GEAR_ROTATIONS[gear];
        stickMesh.rotation.x = r.x;
        stickMesh.rotation.z = r.z;
      }
    });

    animate();
  });

  onBeforeUnmount(() => {
    stopGearWatch?.();
    containerRef.value?.removeEventListener('contextmenu', (e: Event) => e.preventDefault());
    containerRef.value?.removeEventListener('pointerdown', onPointerDown);
    containerRef.value?.removeEventListener('pointermove', onPointerMove);
    containerRef.value?.removeEventListener('pointerup', onPointerUp);
    containerRef.value?.removeEventListener('pointerleave', onPointerUp);
    frameId && cancelAnimationFrame(frameId);
    renderer?.dispose();
    renderer?.domElement?.remove();
  });

  return {};
}
