import { onMounted, onBeforeUnmount, type Ref } from 'vue';
import * as THREE from 'three';

const W = 48;
const H = 64;

/** Top-down “car” silhouette — avoids a second GLB parse + duplicate textures (see main intro). */
function createThumbCarGroup(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.35, roughness: 0.45 }),
  );
  body.position.y = 0.04;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.12, 0.32),
    new THREE.MeshStandardMaterial({ color: 0x252528, metalness: 0.25, roughness: 0.5 }),
  );
  cabin.position.set(0, 0.12, -0.06);
  g.add(body, cabin);
  return g;
}

function disposeObject3DTree(root: THREE.Object3D) {
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

export function useScrollbarCar(containerRef: Ref<HTMLElement | null>) {
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    const container = containerRef.value;
    if (!container) return;

    let disposed = false;
    let rafId: number | undefined;
    const car = createThumbCarGroup();

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 1.8, 0.001);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      stencil: false,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(W, H);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(1, 1, 1);
    scene.add(dir);

    car.position.set(0, 0, 0);
    scene.add(car);

    function animate() {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    cleanup = () => {
      if (disposed) return;
      disposed = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);

      disposeObject3DTree(car);
      scene.clear();

      const canvas = renderer.domElement;
      if (canvas.parentNode) canvas.remove();
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
      renderer.dispose();
      const lose = gl?.getExtension?.('WEBGL_lose_context') as { loseContext: () => void } | undefined;
      lose?.loseContext();
    };
  });

  onBeforeUnmount(() => {
    cleanup?.();
  });
}
