import { startServer } from './app.js';
const server = await startServer({ port: Number(process.env.PORT ?? 3001), host: process.env.HOST ?? '127.0.0.1' });
console.log(`Ironvale server listening at http://${process.env.HOST ?? '127.0.0.1'}:${server.port}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { void server.close().then(() => process.exit(0)); });
