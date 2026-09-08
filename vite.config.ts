import { defineConfig } from 'vite';
export default defineConfig({ server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/socket': { target: 'ws://127.0.0.1:3001', ws: true }, '/health': 'http://127.0.0.1:3001' } }, build: { target: 'es2022' } });
