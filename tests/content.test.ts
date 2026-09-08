import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/catalog.js';
import { validateContent } from '../src/content/validate.js';

describe('content integrity', () => {
  it('accepts the actual development catalog', () => expect(validateContent(CONTENT)).toEqual([]));
  it('rejects a paid item with a negative cost', () => {
    const c = structuredClone(CONTENT); c.units.villager.cost.food = -50;
    expect(validateContent(c).join(' ')).toContain('cost');
  });
  it('rejects a dangling producer and prerequisite cycles', () => {
    const c = structuredClone(CONTENT); c.units.villager.producer = 'missing';
    c.techs.feudal.requires = ['castle']; c.techs.castle.requires = ['feudal'];
    expect(validateContent(c).join(' ')).toContain('producer');
    expect(validateContent(c).join(' ')).toContain('cycle');
  });
  it('rejects unreachable availability and costs that the treasury cannot charge', () => {
    const c = structuredClone(CONTENT); c.units.villager.producer = 'barracks'; c.buildings.townCenter.trains = [];
    Object.assign(c.units.militia.cost, { diamonds: 1 });
    expect(validateContent(c).join(' ')).toContain('availability');
    expect(validateContent(c).join(' ')).toContain('cost');
  });
});
