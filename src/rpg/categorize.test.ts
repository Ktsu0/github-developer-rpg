import { describe, it, expect } from "vitest";
import { categorizeRepo, heuristicCategory, type CuratedProject } from "./categorize";
import type { RawRepo } from "../github/types";

function repo(overrides: Partial<RawRepo>): RawRepo {
  return {
    name: "some-repo",
    description: null,
    fork: false,
    language: "TypeScript",
    topics: [],
    created_at: "2025-01-01T00:00:00Z",
    pushed_at: "2025-01-01T00:00:00Z",
    html_url: "https://github.com/Ktsu0/some-repo",
    languages: { TypeScript: 100 },
    releaseCount: 0,
    hasWorkflows: false,
    ...overrides,
  };
}

const curated: CuratedProject[] = [
  {
    repository: "Financeiro",
    name: "Financeiro",
    description: "Dashboard para controle de gastos.",
    category: "finance",
    status: "completed",
    icon: "🏦",
  },
];

describe("heuristicCategory", () => {
  it("maps GDScript to games", () => {
    expect(heuristicCategory(repo({ language: "GDScript" }))).toBe("games");
  });

  it("falls back to uncharted for unmapped languages", () => {
    expect(heuristicCategory(repo({ language: "Ruby" }))).toBe("uncharted");
  });

  it("falls back to uncharted when language is null", () => {
    expect(heuristicCategory(repo({ language: null }))).toBe("uncharted");
  });
});

describe("categorizeRepo", () => {
  it("uses curated data when the repo name matches (case-insensitive)", () => {
    const result = categorizeRepo(repo({ name: "financeiro" }), curated);
    expect(result.curated).toBe(true);
    expect(result.name).toBe("Financeiro");
    expect(result.category).toBe("finance");
    expect(result.status).toBe("completed");
    expect(result.icon).toBe("🏦");
  });

  it("falls back to an Uncharted Land entry for unlisted repos, with no icon override", () => {
    const result = categorizeRepo(repo({ name: "mystery-repo", language: "TypeScript" }), curated);
    expect(result.curated).toBe(false);
    expect(result.name).toBe("Uncharted Land — mystery-repo");
    expect(result.status).toBe("in-progress");
    expect(result.icon).toBeUndefined();
    expect(result.url).toBe("https://github.com/Ktsu0/some-repo");
  });

  it("links to the repo's html_url when the curated entry has no url override", () => {
    const result = categorizeRepo(repo({ name: "financeiro" }), curated);
    expect(result.url).toBe("https://github.com/Ktsu0/some-repo");
  });

  it("links to the curated url override instead of the repo when present (e.g. a private repo's live site)", () => {
    const withUrl: CuratedProject[] = [{ ...curated[0]!, url: "https://financeiro.example.com" }];
    const result = categorizeRepo(repo({ name: "financeiro" }), withUrl);
    expect(result.url).toBe("https://financeiro.example.com");
  });
});
