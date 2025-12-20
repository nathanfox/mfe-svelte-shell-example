import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    port: 5002,
    cors: true,
  },
  preview: {
    port: 5002,
    cors: true,
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.ts',
      name: 'vueExample',
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
