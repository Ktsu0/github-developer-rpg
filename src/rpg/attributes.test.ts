import { describe, it, expect } from "vitest";
import { calculateAttributes, ATTRIBUTE_CAPS } from "./attributes";

describe("calculateAttributes", () => {
  it("returns all zeros for no signal", () => {
    const attrs = calculateAttributes({
      languageCount: 0,
      craftedRepos: 0,
      totalRepos: 0,
      recentLanguageCount: 0,
      reposWithWorkflows: 0,
      closedIssues: 0,
      mergedPullRequests: 0,
    });
    expect(attrs).toEqual({
      intelligence: 0,
      crafting: 0,
      exploration: 0,
      automation: 0,
      problemSolving: 0,
    });
  });

  it("scales proportionally to the documented cap and clamps at 100", () => {
    const attrs = calculateAttributes({
      languageCount: ATTRIBUTE_CAPS.intelligence * 2,
      craftedRepos: ATTRIBUTE_CAPS.crafting,
      totalRepos: 20,
      recentLanguageCount: 1,
      reposWithWorkflows: 0,
      closedIssues: 0,
      mergedPullRequests: 0,
    });
    expect(attrs.intelligence).toBe(100);
    expect(attrs.crafting).toBe(100);
  });

  it("never returns a negative value", () => {
    const attrs = calculateAttributes({
      languageCount: -5,
      craftedRepos: 0,
      totalRepos: 0,
      recentLanguageCount: 0,
      reposWithWorkflows: 0,
      closedIssues: 0,
      mergedPullRequests: 0,
    });
    expect(attrs.intelligence).toBeGreaterThanOrEqual(0);
  });
});
