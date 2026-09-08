import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { decodeCommand } from '../protocol/decode.js';
import type { PlayerId, PlayerView } from '../protocol/types.js';
interface Bucket { budget: number; last: number }
const consume = (bucket: Bucket, now: number) => { bucket.budget = Math.min(60, bucket.budget + (now - bucket.last) * .03); bucket.last = now; return --bucket.budget >= 0; };
interface Seat { bucket: Bucket; pending: Set<number>; reservedUntil?: number; token: string; socket?: WebSocket; ready: boolean; sequence: number; replies: Map<number, object>; disconnected?: ReturnType<typeof setTimeout> }
interface Room { code: string; seats: Seat[]; epoch: number; practice: boolean; worker?: Worker; replay?: unknown; views?: [PlayerView, PlayerView]; finished: boolean; rematch: Set<number>; created: number }
const send = (socket: WebSocket | undefined, value: object) => { if (socket?.readyState === WebSocket.OPEN && socket.bufferedAmount < 1_000_000) socket.send(JSON.stringify(value)); };
export async function startServer(options: { port?: number; host?: string; staticRoot?: string; graceMs?: number; cleanupMs?: number; retentionMs?: number } = {}) {
  const rooms = new Map<string, Room>(), bindings = new Map<WebSocket, { room: Room; player: PlayerId }>();
  const staticRoot = resolve(options.staticRoot ?? 'dist');
  const origins = new Set((process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001,http://127.0.0.1:3001').split(','));
  const server = createServer(async (req, res) => {
    if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ status: 'ok', version: '0.1.0', rooms: rooms.size })); return; }
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      const file = resolve(staticRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(staticRoot + sep) || !(await stat(file)).isFile()) throw new Error('not found');
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.png': 'image/png' };
      res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }); res.end(await readFile(file));
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024, perMessageDeflate: false });
  server.on('upgrade', (req, socket, head) => {
    if (req.url !== '/socket' || !req.headers.origin || !origins.has(req.headers.origin)) { socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });
  const lobby = (room: Room) => { for (const seat of room.seats) send(seat.socket, { type: 'lobby', room: room.code, players: room.seats.length, ready: room.seats.map(s => s.ready), practice: room.practice, epoch: room.epoch, running: !!room.worker, finished: room.finished }); };
  const humansConnected = (room: Room) => room.seats.every((s, p) => (room.practice && p === 1) || s.socket?.readyState === WebSocket.OPEN);
  function start(room: Room) {
    if (!humansConnected(room)) return;
    if (room.worker) void room.worker.terminate();
    room.epoch++; room.finished = false; room.rematch.clear(); room.views = undefined; room.replay = undefined;
    for (const s of room.seats) { s.sequence = 0; s.replies.clear(); s.pending.clear(); if (s.disconnected) clearTimeout(s.disconnected); s.disconnected = undefined; s.reservedUntil = undefined; }
    const js = new URL('./match-worker.js', import.meta.url), ts = new URL('./match-worker.ts', import.meta.url);
    const source = existsSync(js) ? js : ts;
    const loader = `import('tsx/esm/api').then(({register})=>{register();return import(${JSON.stringify(source.href)})})`;
    const worker = existsSync(js) ? new Worker(js, { workerData: { seed: randomBytes(4).readUInt32LE(), practice: room.practice } }) : new Worker(loader, { eval: true, workerData: { seed: randomBytes(4).readUInt32LE(), practice: room.practice } });
    room.worker = worker;
    worker.on('message', (m: { type: string; views: [PlayerView, PlayerView]; player: PlayerId; seq: number; result: unknown; replay?: unknown }) => {
      if (room.worker !== worker) return;
      if (m.type === 'views') { room.views = m.views; room.seats.forEach((s, p) => send(s.socket, { type: 'state', epoch: room.epoch, view: m.views[p] })); }
      if (m.type === 'ack') { const s = room.seats[m.player]; const reply = { ...m, epoch: room.epoch }; s.pending.delete(m.seq); s.replies.set(m.seq, reply); if (s.replies.size > 128) s.replies.delete(s.replies.keys().next().value!); send(s.socket, reply); }
      // Full replay is server-private; lobby/state serialization must never include it.
      if (m.type === 'finished') { room.finished = true; room.replay = m.replay; lobby(room); }
    });
    worker.on('error', () => { room.finished = true; for (const s of room.seats) send(s.socket, { type: 'error', reason: 'Match interrupted. Return to the lobby and retry.' }); });
    lobby(room);
  }
  function bind(socket: WebSocket, room: Room, p: PlayerId) {
    const s = room.seats[p]; if (s.disconnected) clearTimeout(s.disconnected);
    if (s.socket && s.socket !== socket) { bindings.delete(s.socket); s.socket.close(4001, 'Session reconnected'); }
    s.disconnected = undefined; s.reservedUntil = undefined;
    s.socket = socket; bindings.set(socket, { room, player: p });
    send(socket, { type: 'welcome', room: room.code, token: s.token, player: p, epoch: room.epoch, sequence: s.sequence, practice: room.practice });
    lobby(room); room.worker?.postMessage({ type: 'snapshot' });
  }
  wss.on('connection', socket => {
    const bucket: Bucket = { budget: 60, last: Date.now() };
    socket.on('error', () => {});
    socket.on('message', raw => {
      const now = Date.now(), authenticated = bindings.get(socket);
      if (!consume(authenticated ? authenticated.room.seats[authenticated.player].bucket : bucket, now)) { socket.close(4008, 'Command rate exceeded'); return; }
      let m: Record<string, unknown>; try { m = JSON.parse(raw.toString()) as Record<string, unknown>; } catch { send(socket, { type: 'error', reason: 'Malformed message' }); return; }
      if (!m || typeof m !== 'object' || m.version !== 1) { send(socket, { type: 'error', reason: 'Protocol mismatch' }); return; }
      const error = (reason: string) => send(socket, { type: 'error', reason });
      if (typeof m.type !== 'string') { error('Invalid action'); return; }
      if (['create', 'practice', 'join', 'reconnect'].includes(m.type)) {
        if (bindings.has(socket)) { error('Already in a room'); return; }
        if (m.type === 'create' || m.type === 'practice') {
          if (rooms.size >= 8) { error('Server is full. Retry shortly.'); return; }
          const code = randomBytes(3).toString('hex').toUpperCase(), seat = (): Seat => ({ token: randomBytes(24).toString('hex'), ready: false, sequence: 0, replies: new Map(), pending: new Set(), bucket: { budget: 60, last: now } });
          const room: Room = { code, seats: [seat()], epoch: 0, practice: m.type === 'practice', finished: false, rematch: new Set(), created: now };
          if (room.practice) { room.seats.push(seat()); room.seats[1].ready = true; }
          rooms.set(code, room); bind(socket, room, 0);
          if (room.practice) { room.seats[0].ready = true; start(room); } return;
        }
        const room = typeof m.room === 'string' ? rooms.get(m.room.toUpperCase()) : undefined;
        if (!room) { error('Room not found'); return; }
        if (m.type === 'reconnect') { const p = room.seats.findIndex(s => s.token === m.token); if (p < 0) { error('Invalid session'); return; } bind(socket, room, p as PlayerId); return; }
        if (room.seats.length >= 2 || room.worker) { error('Room is full'); return; }
        room.seats.push({ token: randomBytes(24).toString('hex'), ready: false, sequence: 0, replies: new Map(), pending: new Set(), bucket: { budget: 60, last: now } }); bind(socket, room, 1); return;
      }
      const binding = bindings.get(socket); if (!binding) { error('Join a room first'); return; }
      const { room, player } = binding, seat = room.seats[player];
      if (m.type === 'ready' && !room.worker) { seat.ready = true; if (room.seats.length === 2 && room.seats.every(s => s.ready) && humansConnected(room)) start(room); else lobby(room); return; }
      if (m.type === 'rematch' && room.finished) { room.rematch.add(player); if ((room.practice || room.rematch.size === 2) && humansConnected(room)) start(room); else send(socket, { type: 'notice', message: 'Waiting for your opponent to accept the rematch.' }); return; }
      if (m.type === 'order') {
        if (!room.worker || room.finished || m.epoch !== room.epoch) { error('Match is not accepting orders'); return; }
        const c = decodeCommand(m.command); if (!c) { error('Invalid command'); return; }
        if (typeof m.seq !== 'number' || !Number.isSafeInteger(m.seq) || m.seq < 1) { error('Invalid sequence'); return; }
        if (m.seq <= seat.sequence) { send(socket, { ...(seat.replies.get(m.seq) ?? { type: 'ack', seq: m.seq, status: seat.pending.has(m.seq) ? 'pending' : 'already-processed' }), epoch: room.epoch, duplicate: true }); return; }
        if (m.seq !== seat.sequence + 1) { send(socket, { type: 'sequence', expected: seat.sequence + 1 }); return; }
        seat.sequence = m.seq; seat.pending.add(m.seq); room.worker.postMessage({ type: 'command', player, seq: m.seq, command: c }); return;
      }
      error('Invalid action');
    });
    socket.on('close', () => {
      const b = bindings.get(socket); bindings.delete(socket); if (!b) return;
      const seat = b.room.seats[b.player]; if (seat.socket !== socket) return; seat.socket = undefined; seat.ready = false; b.room.rematch.delete(b.player);
      const epoch = b.room.epoch; seat.reservedUntil = Date.now() + (options.graceMs ?? 60000);
      for (const s of b.room.seats) send(s.socket, { type: 'notice', message: 'Opponent disconnected. Reconnect grace: 60 seconds.' });
      seat.disconnected = setTimeout(() => { if (!seat.socket && b.room.epoch === epoch && rooms.get(b.room.code) === b.room) b.room.worker?.postMessage({ type: 'forfeit', player: b.player }); }, options.graceMs ?? 60000);
    });
  });
  const cleanup = setInterval(() => { for (const [code, room] of rooms) if (room.seats.every((s, p) => !s.socket || (room.practice && p === 1)) && Date.now() - room.created > (options.retentionMs ?? 120000) && room.seats.every(s => !s.reservedUntil || s.reservedUntil <= Date.now())) { for (const s of room.seats) if (s.disconnected) clearTimeout(s.disconnected); void room.worker?.terminate(); rooms.delete(code); } }, options.cleanupMs ?? 30000);
  await new Promise<void>(resolveReady => server.listen(options.port ?? 3001, options.host ?? '127.0.0.1', resolveReady));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Server did not bind TCP');
  return { port: address.port, close: async () => {
    clearInterval(cleanup); for (const room of rooms.values()) { for (const s of room.seats) if (s.disconnected) clearTimeout(s.disconnected); if (room.worker) await room.worker.terminate(); }
    for (const s of wss.clients) s.terminate(); await new Promise<void>(r => wss.close(() => r())); await new Promise<void>(r => server.close(() => r()));
  } };
}
