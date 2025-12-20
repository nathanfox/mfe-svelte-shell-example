import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    port: 5004,
    cors: true,
  },
  preview: {
    port: 5004,
    cors: true,
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.tsx',
      name: 'solidExample',
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
