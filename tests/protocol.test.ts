import { describe, expect, it } from 'vitest';
import { decodeCommand } from '../src/protocol/decode.js';
describe('command decoder', () => {
  it('rejects JSON objects as discriminants without coercing them', () => {
    expect(decodeCommand({ type: { toString: null, valueOf: null } })).toBeUndefined();
  });
  it('accepts an intention and rejects non-finite movement', () => {
    expect(decodeCommand({ type: 'move', ids: [1], x: 12000, z: 3000 })).toEqual({ type: 'move', ids: [1], x: 12000, z: 3000 });
    expect(decodeCommand({ type: 'move', ids: [1], x: NaN, z: 3000 })).toBeUndefined();
  });
  it('bounds selections and rejects forged outcomes', () => {
    expect(decodeCommand({ type: 'move', ids: Array.from({ length: 201 }, (_, i) => i + 1), x: 1, z: 1 })).toBeUndefined();
    expect(decodeCommand({ type: 'grantResources', food: 9999 })).toBeUndefined();
    expect(decodeCommand({ type: 'attack', ids: [-1], target: 2 })).toBeUndefined();
  });
});
