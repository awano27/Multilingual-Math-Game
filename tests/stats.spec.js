import { describe, it, expect } from 'vitest';
import { loadStatFactories } from './helpers/extractors.js';

const { createDefaultPlayerStats, normalizePlayerStats } = loadStatFactories();

describe('Player stats factory', () => {
  it('provides populated defaults with hero loadout', () => {
    const stats = createDefaultPlayerStats();
    expect(stats).toHaveProperty('heroLoadout');
    expect(stats.heroLoadout).toMatchObject({
      outfit: expect.any(String),
      head: expect.any(String),
      weapon: expect.any(String),
      companion: null,
      aura: expect.any(String),
      accessory: expect.any(String)
    });
    expect(Array.isArray(stats.badges)).toBe(true);
    expect(Array.isArray(stats.shopUnlocks)).toBe(true);
  });

  it('normalises partial data without losing defaults', () => {
    const partial = {
      points: 150,
      heroLoadout: { outfit: 'astro_cape' },
      badges: ['carry_master'],
      shopUnlocks: ['astro_cape'],
      questProgress: { 'g2-firefly-rescue': { completed: true } }
    };
    const normalized = normalizePlayerStats(partial);
    expect(normalized.points).toBe(150);
    expect(normalized.heroLoadout.outfit).toBe('astro_cape');
    expect(normalized.heroLoadout.aura).toBeDefined();
    expect(normalized.shopUnlocks).toContain('astro_cape');
    expect(normalized.questProgress['g2-firefly-rescue'].completed).toBe(true);
    expect(normalized.languageStats).toHaveProperty('math');
    expect(normalized.badges).toContain('carry_master');
  });

  it('deduplicates badges and unlocks during normalisation', () => {
    const normalized = normalizePlayerStats({ badges: ['carry_master', 'carry_master'], shopUnlocks: ['astro_cape', 'astro_cape'] });
    const uniqueBadges = new Set(normalized.badges);
    const uniqueUnlocks = new Set(normalized.shopUnlocks);
    expect(uniqueBadges.size).toBe(normalized.badges.length);
    expect(uniqueUnlocks.size).toBe(normalized.shopUnlocks.length);
  });
});
