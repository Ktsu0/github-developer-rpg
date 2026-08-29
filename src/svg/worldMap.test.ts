import { describe, it, expect } from "vitest";
import { generateWorldMapSvg, computeKingdoms } from "./worldMap";
import { CHARACTER_PLACEHOLDER_EMOJI } from "./character";
import type { DeveloperProfile, Project } from "../types";

/** Shoelace formula — used to verify the Voronoi kingdoms tile their rectangle exactly (no gaps, no overlaps), not just "some polygons got rendered". */
function polygonArea(points: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

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
    techStack: [],
  };
}

describe("generateWorldMapSvg", () => {
  it("renders terrain and ambient texture visibly enough to read as a map, not a flat black void", () => {
    const svg = generateWorldMapSvg(profile([project({})]));
    // Regression: terrain motifs were opacity 0.06 (effectively invisible)
    // before user feedback that the map looked like an empty black plane.
    expect(svg).toContain('opacity="0.18"');
    expect(svg).not.toContain('opacity="0.06"');
    // Landmass territory outlines, marker ground ellipses, and the ambient dot scatter fill in the empty canvas.
    expect((svg.match(/<polygon/g) ?? []).length).toBeGreaterThan(0);
    expect((svg.match(/<ellipse/g) ?? []).length).toBeGreaterThan(0);
    expect((svg.match(/<circle cx="\d+" cy="\d+" r="1(\.\d+)?" /g) ?? []).length).toBeGreaterThan(10);
  });

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

  it("tiles the 5 kingdoms across the whole world zone with no gaps and no overlap (a real Voronoi partition, not decorative blobs)", () => {
    const cells = computeKingdoms();
    expect(cells.size).toBe(5);
    const areas = Array.from(cells.values()).map(polygonArea);
    // No degenerate (zero-area) cell — every category actually claims territory.
    for (const area of areas) expect(area).toBeGreaterThan(1000);
    // The 5 cells partition the 680x600 world rectangle exactly: their areas sum to its area.
    const totalArea = areas.reduce((sum, a) => sum + a, 0);
    expect(totalArea).toBeCloseTo(680 * 600, 0);
  });

  it("renders a region legend and tints each region's marker with its own category color, not one uniform accent", () => {
    const svg = generateWorldMapSvg(
      profile([
        project({ category: "finance", region: { id: "Financeiro", label: "Financeiro", icon: "🏦", x: 500, y: 420, category: "finance" } }),
        project({
          name: "RPG Lost World",
          repository: "RPG-Lost-World",
          category: "games",
          region: { id: "RPG-Lost-World", label: "RPG Lost World", icon: "🎮", x: 190, y: 170, category: "games" },
        }),
      ])
    );
    expect(svg).toContain("REGIONS");
    // Finance is gold, games is purple — distinct labeled markers, not both the same teal accent.
    expect(svg).toContain('fill="#e0b954" text-anchor="middle">Financeiro');
    expect(svg).toContain('fill="#b98cf2" text-anchor="middle">RPG Lost World');
  });

  it("connects same-region markers with a settlement line when a category has more than one pinned project", () => {
    const svg = generateWorldMapSvg(
      profile([
        project({
          name: "Site Mystic",
          repository: "siteMysticReact",
          category: "projects",
          region: { id: "siteMysticReact", label: "Site Mystic", icon: "🏠", x: 350, y: 470, category: "projects" },
        }),
        project({
          name: "Copa do Mundo",
          repository: "Copa-do-Mundo",
          category: "projects",
          region: { id: "Copa-do-Mundo", label: "Copa do Mundo", icon: "🏠", x: 300, y: 500, category: "projects" },
        }),
      ])
    );
    expect(svg).toContain('<line x1="350" y1="470" x2="300" y2="500"');
  });
});
