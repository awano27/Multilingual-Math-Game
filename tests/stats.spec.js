import { describe, it, expect } from 'vitest';
import { loadStatFactories } from './helpers/extractors.js';

const { createDefaultPlayerStats, normalizePlayerStats } = loadStatFactories();

describe('Player stats factory', () => {
  it('provides populated defaults with hero loadout and new systems', () => {
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
    expect(Array.isArray(stats.ugcCreations)).toBe(true);
    expect(Array.isArray(stats.petStable)).toBe(true);
    expect(typeof stats.seasonPassProgress).toBe('object');
    expect(Array.isArray(stats.liveEventCheckins)).toBe(true);
    expect(Array.isArray(stats.sandboxWorlds)).toBe(true);
    expect(stats.communityProfile).toHaveProperty('posts');
  });

  it('normalises partial data without losing defaults', () => {
    const partial = {
      points: 150,
      heroLoadout: { outfit: 'astro_cape' },
      badges: ['carry_master'],
      shopUnlocks: ['astro_cape'],
      questProgress: { 'g2-firefly-rescue': { completed: true } },
      ugcCreations: ['dungeon-001'],
      petStable: ['mizu_slime'],
      seasonPassProgress: { spring_blossom: { tier: 2, claimed: true } },
      communityProfile: { posts: 3, likesGiven: 5 }
    };
    const normalized = normalizePlayerStats(partial);
    expect(normalized.points).toBe(150);
    expect(normalized.heroLoadout.outfit).toBe('astro_cape');
    expect(normalized.heroLoadout.aura).toBeDefined();
    expect(normalized.shopUnlocks).toContain('astro_cape');
    expect(normalized.questProgress['g2-firefly-rescue'].completed).toBe(true);
    expect(normalized.languageStats).toHaveProperty('math');
    expect(normalized.badges).toContain('carry_master');
    expect(normalized.ugcCreations).toContain('dungeon-001');
    expect(normalized.petStable).toContain('mizu_slime');
    expect(normalized.seasonPassProgress.spring_blossom.claimed).toBe(true);
    expect(normalized.communityProfile.posts).toBeGreaterThanOrEqual(3);
  });

  it('deduplicates key collections during normalisation', () => {
    const normalized = normalizePlayerStats({
      badges: ['carry_master', 'carry_master'],
      shopUnlocks: ['astro_cape', 'astro_cape'],
      ugcCreations: ['maze-a', 'maze-a']
    });
    const uniqueBadges = new Set(normalized.badges);
    const uniqueUnlocks = new Set(normalized.shopUnlocks);
    const uniqueCreations = new Set(normalized.ugcCreations);
    expect(uniqueBadges.size).toBe(normalized.badges.length);
    expect(uniqueUnlocks.size).toBe(normalized.shopUnlocks.length);
    expect(uniqueCreations.size).toBe(normalized.ugcCreations.length);
  });
});
