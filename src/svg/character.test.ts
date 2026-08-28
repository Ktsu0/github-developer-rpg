import { describe, it, expect } from "vitest";
import { generateCharacterSvg, CHARACTER_PLACEHOLDER_EMOJI } from "./character";
import type { DeveloperProfile } from "../types";

function profile(overrides: Partial<DeveloperProfile> = {}): DeveloperProfile {
  return {
    identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
    level: 5,
    xp: 320,
    attributes: { intelligence: 10, crafting: 10, exploration: 10, automation: 10, problemSolving: 10 },
    statistics: { repositories: 5, commits: 50, pullRequests: 5, issues: 2, releases: 1, contributions: 5 },
    projects: [],
    quests: [],
    manualQuests: [],
    achievements: [],
    bosses: [],
    currentQuest: { objective: "x", statusPercent: 0, nextObjective: "y" },
    ...overrides,
  };
}

describe("generateCharacterSvg", () => {
  it("renders a valid SVG banner with the placeholder emoji, name, class pill, level pill and XP bar", () => {
    const svg = generateCharacterSvg(profile());
    expect(svg).toContain("<svg");
    expect(svg).toContain(CHARACTER_PLACEHOLDER_EMOJI);
    expect(svg).toContain("<title>");
    expect(svg).toContain("<desc>");
    expect(svg).toContain("Gabriel Wagner");
    expect(svg).toContain("FULL STACK DEVELOPER");
    expect(svg).toContain("LEVEL 5");
    expect(svg).toContain("XP ");
    expect(svg).toContain("% to next level");
  });

  it("escapes the '</>' decorative code fragment so the SVG stays well-formed XML", () => {
    const svg = generateCharacterSvg(profile());
    expect(svg).toContain("&lt;/&gt;");
    expect(svg).not.toMatch(/<text[^>]*><\/>/);
  });

  it("escapes special characters in the name", () => {
    const svg = generateCharacterSvg(profile({ identity: { username: "x", name: "A & B", class: "Dev" } }));
    expect(svg).toContain("A &amp; B");
  });

  it("stays well under the 50KB budget from spec §6", () => {
    const svg = generateCharacterSvg(profile());
    expect(svg.length).toBeLessThan(50_000);
  });
});
