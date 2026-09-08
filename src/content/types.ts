export type Resource = 'food' | 'wood' | 'gold' | 'stone';
export type Stock = Record<Resource, number>;
export type Cost = Partial<Stock>;
export interface UnitDef {
  id: string; name: string; cost: Cost; producer: string; age: number; ticks: number;
  hp: number; speed: number; attack: number; armor: number; range: number; cooldown: number;
  category: 'worker' | 'infantry' | 'spear' | 'archer' | 'cavalry'; bonus?: Partial<Record<UnitDef['category'], number>>;
  sight: number; population: number;
}
export interface BuildingDef {
  id: string; name: string; cost: Cost; age: number; ticks: number; hp: number; size: number;
  population: number; dropoff: Resource[]; trains: string[]; research: string[];
  attack: number; range: number; sight: number;
}
export interface TechDef { id: string; name: string; cost: Cost; age: number; ticks: number; producer: string; requires: string[]; effect: 'age' | 'attack' | 'gather'; value: number }
export interface Content { version: string; units: Record<string, UnitDef>; buildings: Record<string, BuildingDef>; techs: Record<string, TechDef> }
