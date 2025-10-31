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
          // Explicitly alias React and ReactDOM to CDN paths for Vite's resolver
          'react': 'https://aistudiocdn.com/react@19.2.0',
          'react-dom': 'https://aistudiocdn.com/react-dom@19.2.0',
          'react/jsx-dev-runtime': 'https://aistudiocdn.com/react@19.2.0/jsx-dev-runtime',
          'react-dom/client': 'https://aistudiocdn.com/react-dom@19.2.0/client'
        }
      }
    };
});