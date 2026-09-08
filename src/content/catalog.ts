import type { BuildingDef, Content, UnitDef } from './types.js';
const unit = (v: Partial<UnitDef> & Pick<UnitDef, 'id' | 'name'>): UnitDef => ({
  cost: {}, producer: 'barracks', age: 0, ticks: 240, hp: 50, speed: 100, attack: 6,
  armor: 0, range: 1100, cooldown: 30, category: 'infantry', sight: 6000, population: 1, ...v,
});
const building = (v: Partial<BuildingDef> & Pick<BuildingDef, 'id' | 'name'>): BuildingDef => ({
  cost: {}, age: 0, ticks: 300, hp: 800, size: 2, population: 0, dropoff: [], trains: [], research: [], attack: 0, range: 0, sight: 7000, ...v,
});
export const CONTENT: Content = {
  version: 'ironvale-development-0.1',
  units: Object.fromEntries([
    unit({ id: 'villager', name: 'Worker', cost: { food: 50 }, producer: 'townCenter', hp: 30, speed: 90, attack: 3, category: 'worker', ticks: 200 }),
    unit({ id: 'militia', name: 'Swordsman', cost: { food: 60, gold: 20 }, hp: 60 }),
    unit({ id: 'spearman', name: 'Spearman', cost: { food: 35, wood: 25 }, hp: 45, attack: 3, category: 'spear', bonus: { cavalry: 15 }, ticks: 220 }),
    unit({ id: 'archer', name: 'Archer', cost: { wood: 25, gold: 45 }, producer: 'archeryRange', hp: 35, speed: 95, attack: 4, range: 5500, cooldown: 36, category: 'archer' }),
    unit({ id: 'scout', name: 'Mounted Scout', cost: { food: 80 }, producer: 'stable', hp: 65, speed: 160, attack: 5, category: 'cavalry', sight: 8500 }),
  ].map(v => [v.id, v])),
  buildings: Object.fromEntries([
    building({ id: 'townCenter', name: 'Town Center', cost: { wood: 275, stone: 100 }, hp: 1600, size: 3, ticks: 700, population: 10, dropoff: ['food', 'wood', 'gold', 'stone'], trains: ['villager'], research: ['feudal', 'castle', 'imperial'], attack: 7, range: 6500, sight: 9500 }),
    building({ id: 'house', name: 'House', cost: { wood: 25 }, population: 5, hp: 450, ticks: 200 }),
    building({ id: 'barracks', name: 'Barracks', cost: { wood: 175 }, trains: ['militia', 'spearman'], hp: 1000 }),
    building({ id: 'archeryRange', name: 'Archery Range', cost: { wood: 175 }, trains: ['archer'], hp: 900 }),
    building({ id: 'stable', name: 'Stable', cost: { wood: 175 }, trains: ['scout'], hp: 1000 }),
    building({ id: 'mill', name: 'Mill', cost: { wood: 100 }, dropoff: ['food'], hp: 500 }),
    building({ id: 'lumberCamp', name: 'Lumber Camp', cost: { wood: 100 }, dropoff: ['wood'], hp: 500 }),
    building({ id: 'miningCamp', name: 'Mining Camp', cost: { wood: 100 }, dropoff: ['gold', 'stone'], hp: 500 }),
    building({ id: 'blacksmith', name: 'Blacksmith', cost: { wood: 150 }, age: 1, research: ['forging', 'tools'], hp: 700 }),
  ].map(v => [v.id, v])),
  techs: {
    feudal: { id: 'feudal', name: 'Feudal Age', cost: { food: 500 }, age: 0, ticks: 600, producer: 'townCenter', requires: [], effect: 'age', value: 1 },
    castle: { id: 'castle', name: 'Castle Age', cost: { food: 800, gold: 200 }, age: 1, ticks: 800, producer: 'townCenter', requires: ['feudal'], effect: 'age', value: 2 },
    imperial: { id: 'imperial', name: 'Imperial Age', cost: { food: 1000, gold: 800 }, age: 2, ticks: 1000, producer: 'townCenter', requires: ['castle'], effect: 'age', value: 3 },
    forging: { id: 'forging', name: 'Forged Blades', cost: { food: 150, gold: 50 }, age: 1, ticks: 400, producer: 'blacksmith', requires: ['feudal'], effect: 'attack', value: 1 },
    tools: { id: 'tools', name: 'Iron Tools', cost: { food: 100, wood: 50 }, age: 1, ticks: 400, producer: 'blacksmith', requires: ['feudal'], effect: 'gather', value: 1 },
  },
};
