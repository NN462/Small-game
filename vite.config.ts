import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the game works on GitHub Pages under /<repo>/ and locally.
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4188,
    strictPort: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    assetsInlineLimit: 0,
  },
});
