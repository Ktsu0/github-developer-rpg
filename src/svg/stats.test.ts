import { describe, it, expect } from "vitest";
import { generateStatsSvg } from "./stats";
import type { DeveloperProfile } from "../types";

const profile: DeveloperProfile = {
  identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
  level: 7,
  xp: 850,
  attributes: { intelligence: 80, crafting: 60, exploration: 40, automation: 20, problemSolving: 100 },
  statistics: { repositories: 12, commits: 300, pullRequests: 8, issues: 3, releases: 2, contributions: 12 },
  projects: [],
  quests: [],
  manualQuests: [],
  achievements: [],
  bosses: [],
  currentQuest: { objective: "x", statusPercent: 0, nextObjective: "y" },
};

describe("generateStatsSvg", () => {
  it("renders the level medallion, XP, all five attribute labels, and repo/commit/PR/release counts", () => {
    const svg = generateStatsSvg(profile);
    expect(svg).toContain(">7<");
    expect(svg).toContain("XP 850");
    expect(svg).toContain("INTELLIGENCE");
    expect(svg).toContain("CRAFTING");
    expect(svg).toContain("EXPLORATION");
    expect(svg).toContain("AUTOMATION");
    expect(svg).toContain("PROBLEM SOLVING");
    expect(svg).toContain("📦 12");
    expect(svg).toContain("💾 300");
    expect(svg).toContain("🔀 8");
    expect(svg).toContain("🚀 2");
  });

  it("stays well under the 50KB budget from spec §6", () => {
    expect(generateStatsSvg(profile).length).toBeLessThan(50_000);
  });
});
