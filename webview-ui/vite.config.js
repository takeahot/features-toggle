import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: 'index.js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        }
    },
    server: {
        port: 5173,
        strictPort: false,
        host: true,
        open: false
    }
});
