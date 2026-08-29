import { describe, it, expect } from "vitest";
import { assignMapPositions } from "./mapLayout";
import type { CategorizedProject } from "./categorize";

function baseProject(overrides: Partial<CategorizedProject>): CategorizedProject {
  return {
    name: "Some Project",
    repository: "some-project",
    description: "",
    category: "games",
    status: "completed",
    curated: true,
    url: "https://github.com/Ktsu0/some-project",
    source: { language: "GDScript", topics: [], createdAt: "2025-01-01", pushedAt: "2025-01-01" },
    ...overrides,
  };
}

describe("assignMapPositions", () => {
  it("assigns a MapNode with the category's default icon and a category-appropriate position", () => {
    const [result] = assignMapPositions([baseProject({})]);
    expect(result?.region.category).toBe("games");
    expect(result?.region.icon).toBe("🎮");
    expect(typeof result?.region.x).toBe("number");
    expect(typeof result?.region.y).toBe("number");
  });

  it("scatters multiple projects in the same category apart from each other (not stacked in a straight line)", () => {
    const results = assignMapPositions([
      baseProject({ repository: "a" }),
      baseProject({ repository: "b" }),
      baseProject({ repository: "c" }),
    ]);
    const [a, b, c] = results;
    expect(a?.region.x).not.toBe(b?.region.x);
    expect(a?.region.y).not.toBe(b?.region.y);
    expect(b?.region.x).not.toBe(c?.region.x);
    expect(b?.region.y).not.toBe(c?.region.y);
  });

  it("places starting-grounds at its own dedicated position", () => {
    const [result] = assignMapPositions([
      baseProject({ category: "starting-grounds", repository: "portifolio_wagner" }),
    ]);
    expect(result?.region.icon).toBe("🌱");
  });

  it("uses the curated icon override instead of the category default when present", () => {
    const [result] = assignMapPositions([
      baseProject({ category: "finance", repository: "Financeiro", icon: "💰" }),
    ]);
    expect(result?.region.icon).toBe("💰");
  });
});
