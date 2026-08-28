import { describe, it, expect } from "vitest";
import { buildSections, buildImageUrls } from "./sections";
import type { DeveloperProfile } from "../types";

const profile: DeveloperProfile = {
  identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
  level: 4,
  xp: 200,
  attributes: { intelligence: 10, crafting: 10, exploration: 10, automation: 10, problemSolving: 10 },
  statistics: { repositories: 3, commits: 40, pullRequests: 2, issues: 1, releases: 1, contributions: 3 },
  projects: [
    {
      name: "Financeiro",
      repository: "Financeiro",
      description: "Dashboard financeiro.",
      category: "finance",
      region: { id: "Financeiro", label: "Financeiro", icon: "🏦", x: 0, y: 0, category: "finance" },
      status: "completed",
      curated: true,
      source: { language: "JavaScript", topics: [], createdAt: "2026-01-21", pushedAt: "2026-01-21" },
    },
  ],
  quests: [],
  achievements: [{ id: "first-quest", name: "First Quest", icon: "🏆", description: "desc", auto: true }],
  bosses: [],
  currentQuest: { objective: "Ship it", statusPercent: 40, nextObjective: "Ship more" },
};
profile.quests = profile.projects;

describe("buildImageUrls", () => {
  it("appends a cache-busting query parameter to every image URL", () => {
    const urls = buildImageUrls("https://raw.githubusercontent.com/Ktsu0/Ktsu0/main/generated", "abc123");
    expect(urls.character).toBe(
      "https://raw.githubusercontent.com/Ktsu0/Ktsu0/main/generated/character.svg?v=abc123"
    );
    expect(urls.worldMap).toContain("?v=abc123");
    expect(urls.stats).toContain("?v=abc123");
  });
});

describe("buildSections", () => {
  const images = buildImageUrls("https://example.com/generated", "v1");
  const sections = buildSections(profile, images);

  it("produces one entry per README marker", () => {
    for (const key of ["HERO", "PROFILE", "INVENTORY", "WORLDMAP", "QUESTS", "BOSSES", "ACHIEVEMENTS", "STATS", "CURRENTQUEST"]) {
      expect(sections).toHaveProperty(key);
    }
  });

  it("embeds the cache-busted image URLs in HERO/WORLDMAP/STATS", () => {
    expect(sections.HERO).toContain("character.svg?v=v1");
    expect(sections.WORLDMAP).toContain("world-map.svg?v=v1");
    expect(sections.STATS).toContain("stats.svg?v=v1");
  });

  it("lists curated projects as quests and achievements", () => {
    expect(sections.QUESTS).toContain("Financeiro");
    expect(sections.ACHIEVEMENTS).toContain("First Quest");
  });

  it("falls back to a placeholder message when bosses are empty", () => {
    expect(sections.BOSSES).toContain("No bosses recorded yet");
  });
});
