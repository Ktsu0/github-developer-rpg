import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generate } from "./generate";
import type { GithubClient } from "../github/types";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

function fakeClient(): GithubClient {
  return {
    rest: {
      users: {
        getByUsername: async () => ({
          data: { login: "Ktsu0", name: "Gabriel Wagner", public_repos: 1 },
        }),
      },
      repos: {
        listForUser: async ({ page }) => ({
          data:
            page === 1
              ? [
                  {
                    name: "portifolio_wagner",
                    description: null,
                    fork: false,
                    language: "CSS",
                    topics: [],
                    created_at: "2025-04-10T00:00:00Z",
                    pushed_at: "2025-04-10T00:00:00Z",
                    html_url: "https://github.com/Ktsu0/portifolio_wagner",
                  },
                ]
              : [],
        }),
        listLanguages: async () => ({ data: { CSS: 100, HTML: 50 } }),
        listReleases: async () => ({ data: [] }),
        getContent: async () => {
          throw { status: 404 };
        },
      },
      search: {
        issuesAndPullRequests: async () => ({ data: { total_count: 0 } }),
      },
    },
    graphql: async () =>
      ({
        user: {
          contributionsCollection: {
            totalCommitContributions: 10,
            totalPullRequestContributions: 2,
            totalIssueContributions: 1,
            totalRepositoryContributions: 1,
          },
        },
      }) as any,
  };
}

const MARKER_README = [
  "# Ktsu0",
  "<!-- RPG:START:HERO -->",
  "<!-- RPG:END:HERO -->",
  "<!-- RPG:START:INVENTORY -->",
  "<!-- RPG:END:INVENTORY -->",
  "<!-- RPG:START:WORLDMAP -->",
  "<!-- RPG:END:WORLDMAP -->",
  "<!-- RPG:START:QUESTS -->",
  "<!-- RPG:END:QUESTS -->",
  "<!-- RPG:START:BOSSES -->",
  "<!-- RPG:END:BOSSES -->",
  "<!-- RPG:START:ACHIEVEMENTS -->",
  "<!-- RPG:END:ACHIEVEMENTS -->",
  "<!-- RPG:START:STATS -->",
  "<!-- RPG:END:STATS -->",
  "<!-- RPG:START:CURRENTQUEST -->",
  "<!-- RPG:END:CURRENTQUEST -->",
].join("\n");

describe("generate", () => {
  it("runs the full pipeline: collects data, writes 3 SVGs, and updates the README between markers", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "rpg-test-"));
    const readmePath = path.join(tempDir, "README.md");
    await writeFile(readmePath, MARKER_README, "utf-8");

    const result = await generate({
      client: fakeClient(),
      username: "Ktsu0",
      readmePath,
      outputDir: tempDir,
      imageBaseUrl: "https://raw.githubusercontent.com/Ktsu0/Ktsu0/main/generated",
      cacheBust: "test",
    });

    expect(result.changed).toBe(true);
    expect(result.profile.projects).toHaveLength(1);
    expect(result.profile.projects[0]?.category).toBe("starting-grounds");

    const characterSvg = await readFile(path.join(tempDir, "character.svg"), "utf-8");
    expect(characterSvg).toContain("<svg");

    const updatedReadme = await readFile(readmePath, "utf-8");
    expect(updatedReadme).toContain("character.svg?v=test");
    expect(updatedReadme).toContain("world-map.svg?v=test");
    expect(updatedReadme).toContain("stats.svg?v=test");
    expect(updatedReadme).toContain("Portfólio Wagner");
    expect(updatedReadme).toContain("shields.io/badge/-CSS");
  });

  it("reports changed: false when re-run produces an identical README", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "rpg-test-"));
    const readmePath = path.join(tempDir, "README.md");
    await writeFile(readmePath, MARKER_README, "utf-8");

    const options = {
      client: fakeClient(),
      username: "Ktsu0",
      readmePath,
      outputDir: tempDir,
      imageBaseUrl: "https://raw.githubusercontent.com/Ktsu0/Ktsu0/main/generated",
      cacheBust: "same-value",
    };
    await generate(options);
    const second = await generate(options);
    expect(second.changed).toBe(false);
  });
});
