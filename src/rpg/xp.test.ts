import { describe, it, expect } from "vitest";
import { calculateXp } from "./xp";

describe("calculateXp", () => {
  it("returns 0 for no events", () => {
    expect(
      calculateXp({
        commits: 0,
        pullRequests: 0,
        issues: 0,
        repositories: 0,
        releases: 0,
        completedQuests: 0,
      })
    ).toBe(0);
  });

  it("weights each event type per spec §7", () => {
    const xp = calculateXp({
      commits: 10,
      pullRequests: 2,
      issues: 1,
      repositories: 1,
      releases: 1,
      completedQuests: 1,
    });
    // 10*1 + 2*15 + 1*10 + 1*50 + 1*100 + 1*150 = 10+30+10+50+100+150 = 350
    expect(xp).toBe(350);
  });
});
