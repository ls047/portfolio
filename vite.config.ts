import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'entry-script-fetchpriority',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          /* Vite moves the entry script; keep LCP hint for the main bundle. */
          return html.replace(
            /<script type="module"( crossorigin)? src="(\/assets\/index-[^"]+\.js)"/,
            '<script type="module"$1 src="$2" fetchpriority="high"',
          );
        },
      },
    },
  ],
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.mp3'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules\\three')) {
            return 'three';
          }
          if (id.includes('motion-v')) return 'motion-v';
          if (id.includes('node_modules/pinia')) return 'pinia';
          if (id.includes('node_modules/vue-router')) return 'vue-router';
        },
      },
    },
  },
});
