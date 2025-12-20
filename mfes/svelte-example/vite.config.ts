import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    port: 5003,
    cors: true,
  },
  preview: {
    port: 5003,
    cors: true,
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.ts',
      name: 'svelteExample',
      fileName: 'remoteEntry',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'remoteEntry.js',
      },
    },
  },
});
