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
      url: "https://github.com/Ktsu0/Financeiro",
      source: { language: "JavaScript", topics: [], createdAt: "2026-01-21", pushedAt: "2026-01-21" },
    },
  ],
  quests: [],
  manualQuests: [
    {
      name: "Termo Infinito",
      description: "A world of mini-games.",
      status: "completed",
      url: "https://termo-infinito.example.com",
      icon: "🎮",
    },
  ],
  achievements: [{ id: "first-quest", name: "First Quest", icon: "🏆", description: "desc", auto: true }],
  bosses: [],
  currentQuest: { objective: "Ship it", statusPercent: 40, nextObjective: "Ship more" },
  techStack: ["React", "Firebase"],
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
    for (const key of ["HERO", "INVENTORY", "WORLDMAP", "QUESTS", "ACHIEVEMENTS", "STATS", "CURRENTQUEST"]) {
      expect(sections).toHaveProperty(key);
    }
  });

  it("embeds the cache-busted image URLs in HERO/WORLDMAP/STATS", () => {
    expect(sections.HERO).toContain("character.svg?v=v1");
    expect(sections.WORLDMAP).toContain("world-map.svg?v=v1");
    expect(sections.STATS).toContain("stats.svg?v=v1");
  });

  it("renders detected languages as shields.io badges", () => {
    expect(sections.INVENTORY).toContain("![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E");
  });

  it("renders detected tech-stack labels (frameworks/platforms a language alone can't show) as badges too", () => {
    expect(sections.INVENTORY).toContain("![React](https://img.shields.io/badge/-React-61DAFB");
    expect(sections.INVENTORY).toContain("![Firebase](https://img.shields.io/badge/-Firebase-FFCA28");
  });

  it("lists curated projects as quests and achievements", () => {
    expect(sections.QUESTS).toContain("Financeiro");
    expect(sections.ACHIEVEMENTS).toContain("First Quest");
  });

  it("links each quest — repo-backed projects to GitHub, manual quests to their curated url", () => {
    expect(sections.QUESTS).toContain("[**Financeiro**](https://github.com/Ktsu0/Financeiro)");
    expect(sections.QUESTS).toContain("[**Termo Infinito**](https://termo-infinito.example.com)");
  });

  it("does not render a BOSSES section (removed until there are real stories to curate)", () => {
    expect(sections).not.toHaveProperty("BOSSES");
  });
});
