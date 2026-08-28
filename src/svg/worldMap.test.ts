import { describe, it, expect } from "vitest";
import { generateWorldMapSvg } from "./worldMap";
import { CHARACTER_PLACEHOLDER_EMOJI } from "./character";
import type { DeveloperProfile, Project } from "../types";

function project(overrides: Partial<Project>): Project {
  return {
    name: "Financeiro",
    repository: "Financeiro",
    description: "",
    category: "finance",
    region: { id: "Financeiro", label: "Financeiro", icon: "🏦", x: 600, y: 300, category: "finance" },
    status: "completed",
    curated: true,
    url: "https://github.com/Ktsu0/Financeiro",
    source: { language: "JavaScript", topics: [], createdAt: "2026-01-21", pushedAt: "2026-01-21" },
    ...overrides,
  };
}

function profile(projects: Project[]): DeveloperProfile {
  return {
    identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
    level: 3,
    xp: 100,
    attributes: { intelligence: 0, crafting: 0, exploration: 0, automation: 0, problemSolving: 0 },
    statistics: { repositories: projects.length, commits: 0, pullRequests: 0, issues: 0, releases: 0, contributions: 0 },
    projects,
    quests: projects.filter((p) => p.curated),
    manualQuests: [],
    achievements: [],
    bosses: [],
    currentQuest: { objective: "x", statusPercent: 0, nextObjective: "y" },
  };
}

describe("generateWorldMapSvg", () => {
  it("renders one labeled region per project", () => {
    const svg = generateWorldMapSvg(
      profile([
        project({}),
        project({
          name: "Antes de Dormir",
          repository: "antes-de-dormir",
          region: {
            id: "antes-de-dormir",
            label: "Antes de Dormir",
            icon: "🏠",
            x: 400,
            y: 420,
            category: "projects",
          },
        }),
      ])
    );
    expect(svg).toContain("Financeiro");
    expect(svg).toContain("Antes de Dormir");
  });

  it("excludes starting-grounds projects from the map entirely — no pin, no marker (user feedback: they clutter the map)", () => {
    const svg = generateWorldMapSvg(
      profile([
        project({
          name: "Portfólio Wagner",
          repository: "portifolio_wagner",
          category: "starting-grounds",
          status: "in-progress",
          region: { id: "portifolio_wagner", label: "Portfólio Wagner", icon: "🌱", x: 90, y: 420, category: "starting-grounds" },
        }),
      ])
    );
    expect(svg).not.toContain("Portfólio Wagner");
    expect(svg).not.toContain(CHARACTER_PLACEHOLDER_EMOJI);
  });

  it("places the placeholder emoji marker at a curated in-progress project, when present", () => {
    const svg = generateWorldMapSvg(
      profile([project({ status: "in-progress" })])
    );
    expect(svg).toContain(CHARACTER_PLACEHOLDER_EMOJI);
  });

  it("falls back to the first curated project when none is in-progress", () => {
    const svg = generateWorldMapSvg(profile([project({ status: "completed" })]));
    expect(svg).toContain(CHARACTER_PLACEHOLDER_EMOJI);
  });

  it("renders no marker when there are no curated projects", () => {
    const svg = generateWorldMapSvg(profile([project({ curated: false, status: "in-progress" })]));
    expect(svg).not.toContain(CHARACTER_PLACEHOLDER_EMOJI);
  });

  it("lists uncharted repos in the sidebar instead of pinning them individually on the map", () => {
    const svg = generateWorldMapSvg(
      profile([
        project({
          name: "Uncharted Land — some-repo",
          repository: "some-repo",
          category: "uncharted",
          curated: false,
          region: { id: "some-repo", label: "Uncharted Land — some-repo", icon: "🌫️", x: 700, y: 70, category: "uncharted" },
        }),
      ])
    );
    expect(svg).toContain("UNCHARTED LAND");
    // The sidebar strips the "Uncharted Land — " prefix; the raw pinned
    // label format should NOT appear (that would mean it fell back to an
    // individually-pinned <g> region instead of the sidebar list).
    expect(svg).toContain("· some-repo");
    expect(svg).not.toContain("Uncharted Land — some-repo</text>");
  });

  it("caps the sidebar list and shows an overflow count beyond the row limit", () => {
    const many = Array.from({ length: 13 }, (_, i) =>
      project({
        name: `Uncharted Land — repo-${i}`,
        repository: `repo-${i}`,
        category: "uncharted",
        curated: false,
        region: { id: `repo-${i}`, label: `Uncharted Land — repo-${i}`, icon: "🌫️", x: 700, y: 70, category: "uncharted" },
      })
    );
    const svg = generateWorldMapSvg(profile(many));
    expect(svg).toContain("+3 more");
  });
});
