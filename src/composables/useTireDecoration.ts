import { onMounted, onBeforeUnmount, type Ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import tireModelUrl from '@/assets/race_car_tire.glb?url';

const FALL_SPEED = 0.5; // units per second
const ROTATION_SPEED = 1.2; // radians per second
const SPAWN_INTERVAL = 3; // seconds between new tires (less quantity)
const SPAWN_Y = 2.0; // spawn above view
const DESTROY_Y = -2.2; // destroy below view
const MIN_SPACING = 0.95; // minimum distance between tires (no sticking)
const TIRE_SCALE = 0.78; // bigger size
const QUAT_Y_90 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
const WORLD_X = new THREE.Vector3(1, 0, 0);

type FallingTire = {
  mesh: THREE.Group;
  spinAngle: number;
  vx: number;
  vy: number;
  vz: number;
};

export function useTireDecoration(containerRef: Ref<HTMLElement | null>) {
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00000000);

    const frustumSize = 2.4;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(2.2, 1.2, 1.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const lightPositions = [
      [2, 2, 2], [2, -2, 2], [-2, 2, 2], [2, 2, -2],
      [0, 3, 0], [0, -3, 0], [3, 0, 0], [-3, 0, 0],
    ];
    lightPositions.forEach((pos) => {
      const light = new THREE.DirectionalLight(0xffffff, 0.4);
      light.position.set(pos[0], pos[1], pos[2]);
      scene.add(light);
    });

    let templateTire: THREE.Group | null = null;
    const fallingTires: FallingTire[] = [];
    let frameId: number;
    let spawnAccum = 0;
    const spinQuat = new THREE.Quaternion();
    const tempPos = new THREE.Vector3();

    const loader = new GLTFLoader();
    loader.load(
      tireModelUrl,
      (gltf) => {
        const src = gltf.scene;
        const box = new THREE.Box3().setFromObject(src);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = TIRE_SCALE / maxDim;

        src.position.sub(center);
        src.scale.setScalar(scale);
        src.quaternion.copy(QUAT_Y_90);
        src.position.x = -0.3;
        src.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = (obj as THREE.Mesh).material;
            if (Array.isArray(m)) m.forEach((mat) => { mat.side = THREE.DoubleSide; });
            else if (m) m.side = THREE.DoubleSide;
          }
        });
        templateTire = src;
      },
      undefined,
      (err) => console.error('Error loading tire:', err)
    );

    function isTooCloseToOthers(px: number, py: number, pz: number): boolean {
      tempPos.set(px, py, pz);
      for (const t of fallingTires) {
        const dist = tempPos.distanceTo(t.mesh.position);
        if (dist < MIN_SPACING) return true;
      }
      return false;
    }

    function spawnTire() {
      if (!templateTire) return;
      let xOff: number;
      let zOff: number;
      let tries = 0;
      const maxTries = 12;
      do {
        xOff = (Math.random() - 0.5) * 0.5;
        zOff = (Math.random() - 0.5) * 1;
        tries++;
        if (tries >= maxTries) return; // skip spawn if can't find clear spot
      } while (isTooCloseToOthers(-0.3 + xOff, SPAWN_Y, zOff));

      const clone = templateTire.clone(true) as THREE.Group;
      clone.position.set(-0.3 + xOff, SPAWN_Y, zOff);
      clone.quaternion.copy(QUAT_Y_90);
      scene.add(clone);
      const vx = (Math.random() - 0.5) * 0.12;
      const vy = -FALL_SPEED * (0.7 + Math.random() * 0.6);
      const vz = (Math.random() - 0.5) * 0.15;
      fallingTires.push({ mesh: clone, spinAngle: 0, vx, vy, vz });
    }

    function animate() {
      frameId = requestAnimationFrame(animate);
      const dt = 0.016;
      spawnAccum += dt;
      if (spawnAccum >= SPAWN_INTERVAL) {
        spawnAccum -= SPAWN_INTERVAL;
        spawnTire();
      }

      for (let i = fallingTires.length - 1; i >= 0; i--) {
        const t = fallingTires[i];
        t.mesh.position.x += t.vx * dt;
        t.mesh.position.y += t.vy * dt;
        t.mesh.position.z += t.vz * dt;
        t.spinAngle += ROTATION_SPEED * dt;
        spinQuat.setFromAxisAngle(WORLD_X, t.spinAngle);
        t.mesh.quaternion.copy(QUAT_Y_90).premultiply(spinQuat);

        if (t.mesh.position.y < DESTROY_Y) {
          scene.remove(t.mesh);
          fallingTires.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      const aspect = w / h;
      camera.left = (-frustumSize * aspect) / 2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    cleanup = () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      fallingTires.forEach((t) => scene.remove(t.mesh));
      renderer.dispose();
      renderer.domElement?.remove();
    };
  });

  onBeforeUnmount(() => {
    cleanup?.();
  });
}
