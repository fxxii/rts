import type { Stock, Resource } from '../content/types.js';
import type { Command, GameEvent, PlayerId, Point, PlayerView, ViewEntity } from '../protocol/types.js';
export interface Order extends Point { type: 'move' | 'attackMove' | 'patrol' | 'gather' | 'deposit' | 'assist' | 'repair' | 'attack' | 'hold'; target?: number; source?: number; resource?: Resource; returning?: boolean; origin?: Point }
export interface QueueItem { def: string; kind: 'unit' | 'tech'; remaining: number; total: number; paid: Stock; blocked?: string }
export interface Entity extends Point {
  id: number; owner: PlayerId | -1; kind: 'unit' | 'building' | 'resource'; def: string;
  hp: number; maxHp: number; progress: number; buildTotal: number; paid: Stock;
  resource?: Resource; amount: number; carry: number; cargo?: Resource;
  order?: Order; orders: Order[]; path: Point[]; dropoffWait?: number; failedDropoffs?: Record<number, number>; detour?: Point; routeTarget?: string; routeRevision: number; nextPathTick: number; stuck: number;
  work: number; cooldown: number; queue: QueueItem[]; rally?: Point; container?: number; passengers: number[];
}
export interface Attack { attacker: number; target: number; release: number; impact: number; damage: number; ranged: boolean; released: boolean }
export interface PlayerState { events: GameEvent[]; eventCursor: number; nextEventRef: number; resources: Stock; age: number; researched: string[]; explored: number[]; visible: number[]; memory: Record<number, ViewEntity>; refs: Record<number, number>; nextRef: number }
export interface TimedCommand { tick: number; player: PlayerId; command: Command }
export type ReplayInput = TimedCommand | { tick: number; disconnect: PlayerId[] };
export interface RouteSearch { open: number[]; seen: Record<number, boolean>; costs: Record<number, number>; previous: Record<number, number>; start: number; end: number }
export interface World {
  navigation: { tick: number; expanded: number; searches: Record<string, RouteSearch> };
  version: string; seed: number; random: number; tick: number; width: number; height: number;
  nextId: number; nextEvent: number; entities: Record<number, Entity>; players: [PlayerState, PlayerState];
  attacks: Attack[]; events: GameEvent[]; result: PlayerView['result']; revision: number; routes: Record<string, Point[]>;
  log: ReplayInput[];
}
