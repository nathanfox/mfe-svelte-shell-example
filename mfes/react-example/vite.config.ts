import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    port: 5001,
    cors: true,
  },
  preview: {
    port: 5001,
    cors: true,
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.tsx',
      name: 'reactExample',
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
