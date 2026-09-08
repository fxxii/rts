import { command } from './commands.js';
import type { World } from './types.js';
import type { Command, PlayerId, CommandResult } from '../protocol/types.js';
export interface QueuedInput { player: PlayerId; seq: number; command: Command }
export function applyInputs(w: World, pending: QueuedInput[], expired: PlayerId[]): (QueuedInput & CommandResult)[] {
  const players = [...new Set(expired)].sort() as PlayerId[];
  if (!w.result && players.length) {
    w.result = { winner: players.length === 2 ? null : players[0] === 0 ? 1 : 0, reason: 'disconnect' };
    w.log.push({ tick: w.tick, disconnect: players });
  }
  return [...pending].sort((a, b) => a.player - b.player || a.seq - b.seq).map(input => ({ ...input, ...command(w, input.player, input.command) }));
}
