import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { startServer } from '../src/server/app.js';
import type { PlayerView } from '../src/protocol/types.js';
type Message = Record<string, unknown>;
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function connect(port: number) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/socket`, { origin: 'http://localhost:5173' });
  const messages: Message[] = [];
  socket.on('message', data => messages.push(JSON.parse(data.toString()) as Message));
  await new Promise<void>((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  cleanups.push(async () => { socket.terminate(); });
  return { socket, messages, send: (m: Message) => socket.send(JSON.stringify({ version: 1, ...m })), wait: async (type: string) => {
    await expect.poll(() => messages.some(m => m.type === type), { timeout: 10000 }).toBe(true);
    const index = messages.findIndex(m => m.type === type); return messages.splice(index, 1)[0];
  } };
}
describe('real authoritative transport', () => {
  it('recovers the same seat after a real ten-second outage with simulated 150ms round-trip delivery', async () => {
    const server = await startServer({ port: 0 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'create' }); const welcome = await a.wait('welcome');
    const b = await connect(server.port); b.send({ type: 'join', room: welcome.room }); await b.wait('welcome');
    a.send({ type: 'ready' }); b.send({ type: 'ready' }); const state = await a.wait('state');
    const view = state.view as PlayerView, tc = view.entities.find(e => e.owner === 0 && e.def === 'townCenter')!;
    const order = { type: 'order', epoch: state.epoch, seq: 1, command: { type: 'train', building: tc.id, def: 'villager' } };
    const started = performance.now();
    await new Promise(r => setTimeout(r, 75)); a.send(order); const ack = await a.wait('ack'); await new Promise(r => setTimeout(r, 75));
    expect(ack.ok).toBe(true); expect(performance.now() - started).toBeGreaterThanOrEqual(150);
    a.socket.close(); await new Promise(r => a.socket.once('close', r));
    const disconnected = performance.now(); await new Promise(r => setTimeout(r, 10000));
    const impostor = await connect(server.port); impostor.send({ type: 'reconnect', room: welcome.room, token: 'wrong-token' });
    expect((await impostor.wait('error')).reason).toBe('Invalid session');
    const c = await connect(server.port); c.send({ type: 'reconnect', room: welcome.room, token: welcome.token });
    const resumed = await c.wait('welcome'), fresh = (await c.wait('state')).view as PlayerView;
    expect(performance.now() - disconnected).toBeGreaterThanOrEqual(10000);
    expect(resumed).toMatchObject({ player: 0, epoch: state.epoch, sequence: 1 });
    expect(fresh.tick).toBeGreaterThan(view.tick + 180); expect(fresh.resources.food).toBe(150);
    // Ten wall-clock seconds can end a few ticks before the ten-simulation-second queue.
    // Wait for the actual authoritative completion, then assert its exact identity count.
    await expect.poll(() => {
      const latest = c.messages.filter(m => m.type === 'state').at(-1)?.view as PlayerView | undefined;
      return (latest ?? fresh).entities.filter(e => e.owner === 0 && e.def === 'villager').length;
    }).toBe(4);
    c.send(order); expect((await c.wait('ack')).duplicate).toBe(true);
  }, 20000);
  it('rejects malformed discriminants before authentication and remains available', async () => {
    const server = await startServer({ port: 0 }); cleanups.unshift(server.close);
    const a = await connect(server.port);
    a.send({ type: { toString: null, valueOf: null } });
    expect((await a.wait('error')).reason).toBe('Invalid action');
    a.send({ type: 'practice' });
    expect((await a.wait('welcome')).player).toBe(0);
  });
  it('isolates two seats, filters state, reconnects and makes duplicates harmless', async () => {
    const server = await startServer({ port: 0 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'create' }); const welcome = await a.wait('welcome');
    const b = await connect(server.port); b.send({ type: 'join', room: welcome.room }); const other = await b.wait('welcome');
    expect(other.player).toBe(1); expect(welcome.player).toBe(0); expect(other.token).not.toBe(welcome.token);
    const third = await connect(server.port); third.send({ type: 'join', room: welcome.room }); expect((await third.wait('error')).reason).toBe('Room is full');
    a.send({ type: 'ready' }); b.send({ type: 'ready' });
    const state = await a.wait('state'); const view = state.view as { entities: { id: number; owner: number; def: string }[]; resources: { food: number } };
    expect(view.entities.some(e => e.owner === 1)).toBe(false); expect(JSON.stringify(state)).not.toContain('seed');
    const tc = view.entities.find(e => e.owner === 0 && e.def === 'townCenter')!;
    const order = { type: 'order', epoch: state.epoch, seq: 1, command: { type: 'train', building: tc.id, def: 'villager' } };
    a.send(order); expect((await a.wait('ack')).ok).toBe(true); a.send(order); expect((await a.wait('ack')).duplicate).toBe(true);
    const c = await connect(server.port); c.send({ type: 'reconnect', room: welcome.room, token: welcome.token });
    const reconnected = await c.wait('welcome'); expect(reconnected.player).toBe(0); expect(reconnected.sequence).toBe(1);
    const refreshed = await c.wait('state'); expect((refreshed.view as typeof view).resources.food).toBe(150);
    c.send({ type: 'order', epoch: state.epoch, seq: 2, command: { type: 'grantResources', amount: 99999 } });
    expect((await c.wait('error')).reason).toBe('Invalid command');
  });
  it('clears ready consent when its owner disconnects', async () => {
    const server = await startServer({ port: 0 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'create' }); const welcome = await a.wait('welcome');
    const b = await connect(server.port); b.send({ type: 'join', room: welcome.room }); await b.wait('welcome');
    a.send({ type: 'ready' }); await expect.poll(() => b.messages.some(m => m.type === 'lobby' && (m.ready as boolean[])[0])).toBe(true);
    a.socket.close(); await b.wait('notice'); b.messages.length = 0;
    b.send({ type: 'ready' }); const lobby = await b.wait('lobby');
    expect(lobby.running).toBe(false); expect(lobby.ready).toEqual([false, true]);
    const c = await connect(server.port); c.send({ type: 'reconnect', room: welcome.room, token: welcome.token }); await c.wait('welcome');
    c.send({ type: 'ready' }); expect((await c.wait('state')).epoch).toBe(1);
  });

  it('retains aged practice rooms throughout grace and collects after expiry', async () => {
    const server = await startServer({ port: 0, retentionMs: 0, cleanupMs: 10, graceMs: 500 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'practice' }); const welcome = await a.wait('welcome'); const state = await a.wait('state');
    a.socket.close(); await new Promise(resolve => a.socket.once('close', resolve));
    // Several cleanup sweeps must run while the seat is reserved.
    await new Promise(resolve => setTimeout(resolve, 80));
    const b = await connect(server.port); b.send({ type: 'reconnect', room: welcome.room, token: welcome.token });
    expect((await b.wait('welcome')).epoch).toBe(state.epoch);
    expect((await b.wait('state')).epoch).toBe(state.epoch);
    b.socket.close(); await new Promise(resolve => b.socket.once('close', resolve));
    await expect.poll(async () => (await (await fetch(`http://127.0.0.1:${server.port}/health`)).json() as { rooms: number }).rooms).toBe(0);
  });
  it('keeps the seat rate bucket on replacement without limiting the opponent', async () => {
    const server = await startServer({ port: 0 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'create' }); const welcome = await a.wait('welcome');
    const b = await connect(server.port); b.send({ type: 'join', room: welcome.room }); await b.wait('welcome');
    for (let i = 0; i < 59; i++) a.send({ type: 'invalid' });
    await expect.poll(() => a.messages.filter(m => m.type === 'error').length).toBe(59);
    const c = await connect(server.port); c.send({ type: 'reconnect', room: welcome.room, token: welcome.token }); await c.wait('welcome');
    const closed = new Promise<number>(resolve => c.socket.once('close', code => resolve(code)));
    for (let i = 0; i < 30; i++) c.send({ type: 'invalid' });
    expect(await closed).toBe(4008);
    b.messages.length = 0; b.send({ type: 'ready' }); expect((await b.wait('lobby')).ready).toEqual([false, true]);
  });
  it('never invents successful duplicate results, including after reply eviction', async () => {
    const server = await startServer({ port: 0 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'practice' }); await a.wait('welcome'); const state = await a.wait('state');
    const order = (seq: number) => ({ type: 'order', epoch: state.epoch, seq, command: { type: 'train', building: -1, def: 'villager' } });
    // A valid positive reference unknown to the observer reaches worker validation.
    const invalidOrder = (seq: number) => ({ ...order(seq), command: { type: 'train', building: 999999, def: 'villager' } });
    a.send(invalidOrder(1)); a.send(invalidOrder(1));
    const first = await a.wait('ack'), second = await a.wait('ack');
    expect(first.ok).not.toBe(true); expect(second.ok).not.toBe(true);
    expect([first, second].some(m => m.ok === false)).toBe(true);
    for (let seq = 2; seq <= 130; seq++) {
      a.send(invalidOrder(seq)); expect((await a.wait('ack')).ok).toBe(false);
    }
    a.send(invalidOrder(1)); const old = await a.wait('ack');
    expect(old.status).toBe('already-processed'); expect(old).not.toHaveProperty('ok'); expect(old.duplicate).toBe(true);
  }, 20000);
  it('clears rematch consent on close and isolates the new epoch from old grace', async () => {
    const server = await startServer({ port: 0, graceMs: 250 }); cleanups.unshift(server.close);
    const a = await connect(server.port); a.send({ type: 'create' }); const welcome = await a.wait('welcome');
    const b = await connect(server.port); b.send({ type: 'join', room: welcome.room }); await b.wait('welcome');
    a.send({ type: 'ready' }); b.send({ type: 'ready' }); const state = await a.wait('state');
    a.send({ type: 'order', epoch: state.epoch, seq: 1, command: { type: 'resign' } }); await a.wait('ack');
    await expect.poll(() => b.messages.some(m => m.type === 'lobby' && m.finished)).toBe(true);
    a.send({ type: 'rematch' }); await a.wait('notice'); a.socket.close(); await b.wait('notice');
    b.messages.length = 0; b.send({ type: 'rematch' }); await b.wait('notice');
    const c = await connect(server.port); c.send({ type: 'reconnect', room: welcome.room, token: welcome.token });
    expect((await c.wait('welcome')).epoch).toBe(state.epoch);
    c.send({ type: 'rematch' });
    await expect.poll(() => c.messages.some(m => m.type === 'state' && m.epoch === Number(state.epoch) + 1)).toBe(true);
    await expect.poll(() => c.messages.some(m => m.type === 'state' && m.epoch === Number(state.epoch) + 1 && (m.view as { tick: number }).tick >= 8)).toBe(true);
    expect(c.messages.some(m => m.type === 'lobby' && m.epoch === Number(state.epoch) + 1 && m.finished)).toBe(false);
  });

});
