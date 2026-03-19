import { onMounted, onBeforeUnmount, type Ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import carModelUrl from '@/assets/1987_buick_grand_national_regal_gnx.glb?url';

const W = 48;
const H = 64;

export function useScrollbarCar(containerRef: Ref<HTMLElement | null>) {
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null; // transparent - no fill behind car

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 1.8, 0.001); // top-down view (above the car)
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.pointerEvents = 'none'; // let thumb receive drag/scroll
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 1, 1);
    scene.add(dir);

    let car: THREE.Group | null = null;
    let frameId: number;

    const loader = new GLTFLoader();
    loader.load(
      carModelUrl,
      (gltf) => {
        car = gltf.scene;
        const box = new THREE.Box3().setFromObject(car);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.85 / maxDim;

        car.position.sub(center);
        car.scale.setScalar(scale);
        // Top-down: no rotation - roof faces camera
        car.position.set(0, 0, 0);
        scene.add(car);
      },
      undefined,
      () => {}
    );

    function animate() {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    cleanup = () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      renderer.domElement?.remove();
    };
  });

  onBeforeUnmount(() => {
    cleanup?.();
  });
}
