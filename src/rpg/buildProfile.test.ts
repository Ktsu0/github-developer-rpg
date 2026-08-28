import { describe, it, expect } from "vitest";
import { buildProfile } from "./buildProfile";
import type { RawGithubData } from "../github/types";
import type { CuratedProject } from "./categorize";
import type { ManualQuest } from "../types";

const curatedProjects: CuratedProject[] = [
  {
    repository: "Financeiro",
    name: "Financeiro",
    description: "Dashboard.",
    category: "finance",
    status: "completed",
    icon: "🏦",
  },
];

const manualQuests: ManualQuest[] = [
  {
    name: "Termo Infinito",
    description: "A world of mini-games.",
    status: "completed",
    url: "https://termo-infinito.example.com",
    icon: "🎮",
  },
];

function rawData(): RawGithubData {
  return {
    user: { login: "Ktsu0", name: "Gabriel Wagner", public_repos: 2 },
    repos: [
      {
        name: "Financeiro",
        description: null,
        fork: false,
        language: "JavaScript",
        topics: [],
        created_at: "2026-01-21T00:00:00Z",
        pushed_at: "2026-01-21T00:00:00Z",
        html_url: "https://github.com/Ktsu0/Financeiro",
        languages: { JavaScript: 300, CSS: 20 },
        releaseCount: 1,
        hasWorkflows: true,
      },
      {
        name: "mystery-repo",
        description: "An experiment.",
        fork: false,
        language: "TypeScript",
        topics: [],
        created_at: "2026-02-01T00:00:00Z",
        pushed_at: "2026-02-01T00:00:00Z",
        html_url: "https://github.com/Ktsu0/mystery-repo",
        languages: { TypeScript: 100 },
        releaseCount: 0,
        hasWorkflows: false,
      },
    ],
    contributions: {
      totalCommitContributions: 120,
      totalPullRequestContributions: 4,
      totalIssueContributions: 2,
      totalRepositoryContributions: 2,
    },
    closedIssues: 5,
    mergedPullRequests: 3,
  };
}

describe("buildProfile", () => {
  it("builds a full DeveloperProfile from raw data and config", () => {
    const profile = buildProfile(rawData(), {
      developer: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
      curatedProjects,
      manualQuests,
      bosses: [],
      currentQuest: { objective: "Ship it", statusPercent: 50, nextObjective: "Ship more" },
    });

    expect(profile.identity.username).toBe("Ktsu0");
    expect(profile.projects).toHaveLength(2);
    expect(profile.quests).toHaveLength(1);
    expect(profile.quests[0]?.name).toBe("Financeiro");
    expect(profile.quests[0]?.url).toBe("https://github.com/Ktsu0/Financeiro");
    expect(profile.manualQuests).toHaveLength(1);
    expect(profile.manualQuests[0]?.url).toBe("https://termo-infinito.example.com");
    expect(profile.statistics.repositories).toBe(2);
    expect(profile.statistics.commits).toBe(120);
    expect(profile.statistics.releases).toBe(1);
    expect(profile.xp).toBeGreaterThan(0);
    expect(profile.level).toBeGreaterThanOrEqual(1);
    expect(profile.achievements.map((a) => a.id)).toContain("first-quest");
    expect(profile.currentQuest.objective).toBe("Ship it");
  });
});
