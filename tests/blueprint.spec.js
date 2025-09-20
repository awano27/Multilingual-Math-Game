import { describe, it, expect } from 'vitest';
import { loadBlueprint } from './helpers/extractors.js';

const blueprint = loadBlueprint();

describe('Blueprint integrity', () => {
  it('has quests defined for each supported grade', () => {
    const grades = Object.values(blueprint.gradeCurriculum || {});
    expect(grades.length).toBeGreaterThan(0);
    for (const grade of grades) {
      expect(Array.isArray(grade.quests)).toBe(true);
      expect(grade.quests.length).toBeGreaterThan(0);
    }
  });

  it('includes themed worlds and seasonal showcases', () => {
    expect(Array.isArray(blueprint.themeWorlds)).toBe(true);
    expect(blueprint.themeWorlds.length).toBeGreaterThan(0);
    expect(Array.isArray(blueprint.seasonalShowcases)).toBe(true);
    expect(blueprint.seasonalShowcases.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(blueprint.seasonPasses)).toBe(true);
    expect(blueprint.seasonPasses.length).toBeGreaterThan(0);
  });

  it('exposes key collections for rewards and missions', () => {
    expect(Array.isArray(blueprint.badgeCatalog)).toBe(true);
    expect(blueprint.badgeCatalog.some(badge => badge.requirement?.type === 'quest')).toBe(true);
    expect(Array.isArray(blueprint.shopInventory)).toBe(true);
    expect(blueprint.shopInventory.some(item => item.slot === 'cape')).toBe(true);
    expect(typeof blueprint.miniGameConfigs).toBe('object');
    expect(blueprint.miniGameConfigs.clock_match).toBeDefined();
    expect(Array.isArray(blueprint.arMissionCatalog)).toBe(true);
    expect(blueprint.arMissionCatalog.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(blueprint.ugcTemplates)).toBe(true);
    expect(blueprint.ugcTemplates.some(template => template.supportsAIStory)).toBe(true);
    expect(Array.isArray(blueprint.petCatalog)).toBe(true);
    expect(blueprint.petCatalog.length).toBeGreaterThan(0);
    expect(Array.isArray(blueprint.liveEvents)).toBe(true);
    expect(blueprint.communityFeatures?.forumChannels).toContain('strategy');
    expect(blueprint.collaborationPartners?.museums?.length).toBeGreaterThan(0);
  });
});
