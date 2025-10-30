import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose VITE_GEMINI_API_KEY to the client-side code
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Prevent Vite from bundling React and ReactDOM,
      // relying on the importmap in index.html instead.
      optimizeDeps: {
        exclude: ['react', 'react-dom'],
      },
      build: {
        rollupOptions: {
          external: ['react', 'react-dom'],
        },
      },
    };
});