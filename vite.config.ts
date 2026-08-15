import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Support both VITE_GEMINI_API_KEY (Vercel) and GEMINI_API_KEY (AI Studio)
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      target: 'es2022',
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Three.js core — large but unavoidable
            if (id.includes('node_modules/three/')) {
              return 'vendor-three-core';
            }
            // React-Three ecosystem (fiber + drei + postprocessing)
            if (
              id.includes('@react-three/fiber') ||
              id.includes('@react-three/drei') ||
              id.includes('@react-three/postprocessing') ||
              id.includes('postprocessing') ||
              id.includes('suspend-react')
            ) {
              return 'vendor-three-react';
            }
            // Framer Motion
            if (id.includes('framer-motion') || id.includes('/motion/')) {
              return 'vendor-motion';
            }
            // Google GenAI SDK
            if (id.includes('@google/genai')) {
              return 'vendor-genai';
            }
            // Gesture handling
            if (id.includes('@use-gesture')) {
              return 'vendor-gesture';
            }
          },
        },
      },
    },
  };
});
