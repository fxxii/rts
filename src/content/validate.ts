import type { Content } from './types.js';
export function validateContent(c: Content): string[] {
  const errors: string[] = [], ids = new Set<string>();
  for (const group of [c.units, c.buildings, c.techs]) for (const [key, item] of Object.entries(group)) {
    if (key !== item.id || ids.has(item.id)) errors.push(`duplicate or mismatched id: ${key}`);
    ids.add(item.id);
    if (Object.entries(item.cost).some(([resource, v]) => !['food', 'wood', 'gold', 'stone'].includes(resource) || typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0)) errors.push(`invalid cost: ${key}`);
    if (item.ticks <= 0 || !Number.isSafeInteger(item.ticks) || !Number.isInteger(item.age) || item.age < 0 || item.age > 3) errors.push(`invalid timing/age: ${key}`);
  }
  for (const item of [...Object.values(c.units), ...Object.values(c.techs)]) if (!c.buildings[item.producer]) errors.push(`missing producer: ${item.id}`);
  for (const unit of Object.values(c.units)) {
    const producer = c.buildings[unit.producer];
    if (producer && (!producer.trains.includes(unit.id) || producer.age > unit.age)) errors.push(`invalid availability: ${unit.id}`);
  }
  for (const tech of Object.values(c.techs)) {
    const producer = c.buildings[tech.producer];
    if (producer && (!producer.research.includes(tech.id) || producer.age > tech.age)) errors.push(`invalid availability: ${tech.id}`);
  }
  for (const b of Object.values(c.buildings)) {
    for (const id of b.trains) if (!c.units[id] || c.units[id].producer !== b.id) errors.push(`invalid training: ${id}`);
    for (const id of b.research) if (!c.techs[id] || c.techs[id].producer !== b.id) errors.push(`invalid research: ${id}`);
  }
  const visit = (id: string, path: string[]) => {
    if (path.includes(id)) { errors.push(`prerequisite cycle: ${id}`); return; }
    const t = c.techs[id]; if (!t) { errors.push(`missing prerequisite: ${id}`); return; }
    for (const req of t.requires) visit(req, [...path, id]);
  };
  for (const id of Object.keys(c.techs)) visit(id, []);
  return errors;
}
