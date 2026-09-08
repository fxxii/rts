import type { Stock, Resource } from '../content/types.js';
export type PlayerId = 0 | 1;
export interface Point { x: number; z: number }
export type Command =
  | ({ type: 'move' | 'attackMove' | 'patrol'; ids: number[]; queued?: boolean } & Point)
  | { type: 'gather' | 'attack' | 'repair' | 'assist' | 'deposit'; ids: number[]; target: number; queued?: boolean }
  | { type: 'stop' | 'hold'; ids: number[] }
  | ({ type: 'build'; ids: number[]; def: string; queued?: boolean } & Point)
  | { type: 'train' | 'research'; building: number; def: string }
  | { type: 'cancel'; building: number; index: number }
  | ({ type: 'rally'; building: number } & Point)
  | { type: 'resign' };
export type Rejection = 'invalid' | 'ownership' | 'target' | 'resources' | 'prerequisite' | 'placement' | 'blocked' | 'queueFull' | 'finished';
export type CommandResult = { ok: true } | { ok: false; reason: Rejection };
export interface ViewEntity extends Point {
  id: number; owner: PlayerId | -1; kind: 'unit' | 'building' | 'resource'; def: string;
  hp: number; maxHp: number; visible: boolean; progress?: number;
  resource?: Resource; amount?: number; carried?: number; cargo?: Resource;
  activity?: string; queue?: { def: string; remaining: number; total: number; blocked?: string }[];
  rally?: Point;
}
export interface GameEvent extends Point { id: number; name: string; owner: PlayerId | -1; entity?: number }
export interface PlayerView {
  tick: number; player: PlayerId; width: number; height: number;
  resources: Stock; population: number; capacity: number; age: number; researched: string[];
  entities: ViewEntity[]; visible: number[]; explored: number[]; events: GameEvent[];
  result: { winner: PlayerId | null; reason: string } | null;
}
export const PROTOCOL_VERSION = 1;
