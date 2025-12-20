import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5000,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
