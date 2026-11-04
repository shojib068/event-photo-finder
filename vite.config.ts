import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { photoProxyDevPlugin } from './tools/vite/photo-proxy-dev';

export default defineConfig({
  plugins: [react(), tailwindcss(), photoProxyDevPlugin()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000, // the face engine (TensorFlow.js) is one large lazy chunk
  },
});
