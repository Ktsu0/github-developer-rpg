import { describe, it, expect } from "vitest";
import { calculateAchievements } from "./achievements";
import type { Statistics } from "../types";

const zeroStats: Statistics = {
  repositories: 0,
  commits: 0,
  pullRequests: 0,
  issues: 0,
  releases: 0,
  contributions: 0,
};

describe("calculateAchievements", () => {
  it("unlocks nothing at zero stats and zero curated projects", () => {
    expect(calculateAchievements(zeroStats, 0)).toEqual([]);
  });

  it("unlocks First Quest once there is at least one curated project", () => {
    const result = calculateAchievements(zeroStats, 1);
    expect(result.map((a) => a.id)).toContain("first-quest");
  });

  it("unlocks Century at 100+ commits", () => {
    const result = calculateAchievements({ ...zeroStats, commits: 100 }, 0);
    expect(result.map((a) => a.id)).toContain("hundred-commits");
  });

  it("marks every returned achievement as auto", () => {
    const result = calculateAchievements({ ...zeroStats, releases: 1 }, 0);
    expect(result.every((a) => a.auto)).toBe(true);
  });
});
