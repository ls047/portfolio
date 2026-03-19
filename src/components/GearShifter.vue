<template>
  <canvas
    ref="canvasRef"
    class="gear-shifter-canvas"
    role="group"
    :aria-label="`Gear shifter, ${currentGear} selected`"
    :style="{ opacity: contentOpacity }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @pointercancel="onPointerUp"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useGear, type Gear } from '../composables/useGear';

const props = defineProps<{
  contentOpacity: number;
}>();

const { currentGear, setGear } = useGear();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const GEARS: Gear[] = ['1', '2', '3', '4', 'R'];

// H-pattern: position per gear (center x, y in canvas coords)
const LAYOUT: Record<Gear, [number, number]> = {
  '1': [0, 0], // top-left
  '3': [0, 2], // top-right
  '2': [1, 0], // mid-left
  '4': [1, 2], // mid-right
  R: [2, 0],  // bottom-left
};

const CANVAS_W = 140;
const CANVAS_H = 200;
const PADDING = 24;
const COLS = 3;
const ROWS = 3;
const CELL_W = (CANVAS_W - 2 * PADDING) / COLS;
const CELL_H = (CANVAS_H - 2 * PADDING) / ROWS;
const STICK_R = 18;    // hit area for stick knob
const KNOB_R = 14;     // visual knob radius
const STICK_H = 32;    // stick height from base to knob center

function getGearCenter(gear: Gear): { x: number; y: number } {
  return getMapGearPos(gear);
}

function clientToCanvas(clientX: number, clientY: number): { x: number; y: number } | null {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return null;
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function positionToGear(x: number, y: number): Gear {
  const nx = (x - MAP_LEFT) / MAP_W;
  const ny = (y - MAP_TOP) / MAP_H;
  const col = Math.floor(nx * COLS);
  const row = Math.floor(ny * ROWS);
  if (row < 0 || row >= ROWS) return currentGear.value;
  if (row === 0) return col <= 1 ? '1' : '3';
  if (row === 1) return col <= 1 ? '2' : '4';
  return 'R';
}

function isOverStick(x: number, y: number): boolean {
  const { x: gx, y: gy } = getGearCenter(currentGear.value);
  return Math.hypot(x - gx, y - gy) <= STICK_R;
}

let isDragging = false;
let stickX = 0;
let stickY = 0;

function syncStickPosition() {
  const { x, y } = getGearCenter(currentGear.value);
  stickX = x;
  stickY = y;
}

function onPointerDown(e: PointerEvent) {
  const pt = clientToCanvas(e.clientX, e.clientY);
  if (!pt || !isOverStick(pt.x, pt.y)) return;
  isDragging = true;
  stickX = pt.x;
  stickY = pt.y;
  (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  canvasRef.value!.style.cursor = 'grabbing';
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return;
  const pt = clientToCanvas(e.clientX, e.clientY);
  if (!pt) return;
  stickX = Math.max(MAP_LEFT + 8, Math.min(MAP_LEFT + MAP_W - 8, pt.x));
  stickY = Math.max(MAP_TOP + 8, Math.min(MAP_TOP + MAP_H - 8, pt.y));
  // Don't change section while dragging - only update stick visual position
  render();
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging) return;
  isDragging = false;
  // Change section only when user releases - based on where they left the stick
  const gear = positionToGear(stickX, stickY);
  setGear(gear);
  syncStickPosition();
  (e.currentTarget as HTMLCanvasElement)?.releasePointerCapture(e.pointerId);
  canvasRef.value!.style.cursor = 'grab';
  render();
}

const MAP_TOP = 16;
const MAP_LEFT = 12;
const MAP_W = CANVAS_W - 24;
const MAP_H = CANVAS_H - 32;
const MAP_CELL_W = MAP_W / 3;
const MAP_CELL_H = MAP_H / 3;
// Pivot in center of map (shifter lives inside the map)
const PIVOT_X = MAP_LEFT + MAP_W / 2;
const PIVOT_Y = MAP_TOP + MAP_H / 2;
const KNOB_BALL_R = 16; // Classic ball knob - larger, rounder

function getMapGearPos(gear: Gear): { x: number; y: number } {
  const [r, c] = LAYOUT[gear];
  return {
    x: MAP_LEFT + (c + 0.5) * MAP_CELL_W,
    y: MAP_TOP + (r + 0.5) * MAP_CELL_H,
  };
}

function drawGearMap(ctx: CanvasRenderingContext2D) {
  // Brushed metal / stamped steel gate plate (classic GM/Mopar)
  const metalGrad = ctx.createLinearGradient(MAP_LEFT, 0, MAP_LEFT + MAP_W, 0);
  metalGrad.addColorStop(0, '#2a2a2a');
  metalGrad.addColorStop(0.15, '#3d3d3d');
  metalGrad.addColorStop(0.5, '#4a4a4a');
  metalGrad.addColorStop(0.85, '#3d3d3d');
  metalGrad.addColorStop(1, '#2a2a2a');
  ctx.fillStyle = metalGrad;
  ctx.beginPath();
  ctx.roundRect(MAP_LEFT, MAP_TOP, MAP_W, MAP_H, 4);
  ctx.fill();

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Metal edge highlight (top)
  ctx.strokeStyle = 'rgba(120,120,120,0.25)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(MAP_LEFT + 0.5, MAP_TOP + 0.5, MAP_W - 1, MAP_H - 1, 3);
  ctx.stroke();

  // H-pattern slots - stamped/cut into metal
  ctx.strokeStyle = '#0d0d0d';
  ctx.lineWidth = 1.2;
  const pad = 3;
  ctx.beginPath();
  ctx.moveTo(MAP_LEFT + MAP_CELL_W + pad, MAP_TOP + MAP_CELL_H);
  ctx.lineTo(MAP_LEFT + MAP_CELL_W * 2 - pad, MAP_TOP + MAP_CELL_H);
  ctx.moveTo(MAP_LEFT + MAP_CELL_W + pad, MAP_TOP + MAP_CELL_H * 2);
  ctx.lineTo(MAP_LEFT + MAP_CELL_W * 2 - pad, MAP_TOP + MAP_CELL_H * 2);
  ctx.moveTo(MAP_LEFT + MAP_CELL_W * 0.5, MAP_TOP + MAP_CELL_H * 0.5 + pad);
  ctx.lineTo(MAP_LEFT + MAP_CELL_W * 0.5, MAP_TOP + MAP_CELL_H * 2.5 - pad);
  ctx.moveTo(MAP_LEFT + MAP_CELL_W * 2.5, MAP_TOP + MAP_CELL_H * 0.5 + pad);
  ctx.lineTo(MAP_LEFT + MAP_CELL_W * 2.5, MAP_TOP + MAP_CELL_H * 2.5 - pad);
  ctx.stroke();

  ctx.font = '700 13px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const gear of GEARS) {
    const { x, y } = getMapGearPos(gear);
    const active = currentGear.value === gear;
    ctx.fillStyle = active ? (gear === 'R' ? '#c33' : '#b8962e') : '#666';
    ctx.fillText(gear, x, y);
  }
}

function drawStick(ctx: CanvasRenderingContext2D) {
  const knobX = stickX;
  const knobY = stickY;
  const isR = currentGear.value === 'R';

  ctx.save();

  // Simple black rubber boot (classic - not leather accordion)
  const bootW = 24;
  const bootH = 14;
  const bootY = PIVOT_Y - 2;

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.ellipse(PIVOT_X, bootY + bootH / 2, bootW / 2, bootH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Tall chrome stick - from pivot to knob (Hurst / classic GM)
  const dx = knobX - PIVOT_X;
  const dy = knobY - PIVOT_Y;
  const len = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);

  ctx.translate(PIVOT_X, PIVOT_Y);
  ctx.rotate(angle);

  const stickW = 5; // Slim shaft - draw along X (toward knob)
  const stickLen = Math.max(0, len - KNOB_BALL_R);
  const stickGrad = ctx.createLinearGradient(0, 0, stickLen, 0);
  stickGrad.addColorStop(0, '#151515');
  stickGrad.addColorStop(0.2, '#404040');
  stickGrad.addColorStop(0.5, '#707070');
  stickGrad.addColorStop(0.8, '#404040');
  stickGrad.addColorStop(1, '#151515');
  ctx.fillStyle = stickGrad;
  ctx.beginPath();
  ctx.roundRect(0, -stickW / 2, stickLen, stickW, 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.roundRect(1, -stickW / 2 + 1, stickLen - 2, 1, 0);
  ctx.fill();

  ctx.rotate(-angle);
  ctx.translate(-PIVOT_X, -PIVOT_Y);

  ctx.translate(knobX, knobY);

  // Classic ball knob - white or black (Hurst style, old GM)
  const ballR = KNOB_BALL_R;
  const ballGrad = ctx.createRadialGradient(-4, -6, 0, 0, 0, ballR);
  if (isR) {
    ballGrad.addColorStop(0, '#6b3a3a');
    ballGrad.addColorStop(0.4, '#4a2222');
    ballGrad.addColorStop(0.8, '#2a1212');
    ballGrad.addColorStop(1, '#150808');
  } else {
    // Classic white ball
    ballGrad.addColorStop(0, '#e8e6e0');
    ballGrad.addColorStop(0.3, '#d4d2ca');
    ballGrad.addColorStop(0.6, '#b8b5aa');
    ballGrad.addColorStop(0.9, '#9a978c');
    ballGrad.addColorStop(1, '#7a776e');
  }
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ballR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isR ? '#4a2222' : '#a09d92';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ball highlight (gloss)
  const glossGrad = ctx.createRadialGradient(-5, -7, 0, 0, 0, ballR);
  glossGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
  glossGrad.addColorStop(0.25, 'rgba(255,255,255,0.15)');
  glossGrad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  glossGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glossGrad;
  ctx.beginPath();
  ctx.arc(0, 0, ballR, 0, Math.PI * 2);
  ctx.fill();

  if (currentGear.value && !isDragging) {
    ctx.strokeStyle = isR ? 'rgba(200,60,60,0.5)' : 'rgba(184,150,46,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ballR + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
  const w = CANVAS_W * dpr;
  const h = CANVAS_H * dpr;
  if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.scale(dpr, dpr);
  }

  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, '#1a1a1a');
  bgGrad.addColorStop(0.5, '#121212');
  bgGrad.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(2, 2, CANVAS_W - 4, CANVAS_H - 4);

  const topEdge = ctx.createLinearGradient(0, 0, 0, 8);
  topEdge.addColorStop(0, 'rgba(80,80,80,0.15)');
  topEdge.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topEdge;
  ctx.fillRect(2, 2, CANVAS_W - 4, 6);

  drawGearMap(ctx);
  drawStick(ctx);
}

function render() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  draw(ctx);
}

onMounted(() => {
  syncStickPosition();
  render();
});

watch(currentGear, () => {
  if (!isDragging) syncStickPosition();
  render();
});

onBeforeUnmount(() => {});
</script>

<style scoped>
.gear-shifter-canvas {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 140px;
  height: 200px;
  z-index: 50;
  cursor: grab;
  display: block;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transition: opacity 0.8s ease-out;
  user-select: none;
  -webkit-user-select: none;
}

.gear-shifter-canvas:active {
  cursor: grabbing;
}
</style>
