import { describe, it, expect } from "vitest";
import { collectGithubData } from "./collector";
import type { GithubClient } from "./types";

function fakeClient(): GithubClient {
  return {
    rest: {
      users: {
        getByUsername: async () => ({
          data: { login: "Ktsu0", name: "Gabriel Wagner", public_repos: 2 },
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
                  {
                    name: "a-fork",
                    description: null,
                    fork: true,
                    language: "JavaScript",
                    topics: [],
                    created_at: "2025-01-01T00:00:00Z",
                    pushed_at: "2025-01-01T00:00:00Z",
                    html_url: "https://github.com/Ktsu0/a-fork",
                  },
                ]
              : [],
        }),
        listLanguages: async () => ({ data: { CSS: 100, HTML: 20 } }),
        listReleases: async () => ({ data: [{ id: 1 }] }),
        getContent: async () => {
          throw { status: 404 };
        },
      },
      search: {
        issuesAndPullRequests: async ({ q }) => ({
          data: { total_count: q.includes("is:closed") ? 3 : 1 },
        }),
      },
    },
    graphql: async () =>
      ({
        user: {
          contributionsCollection: {
            totalCommitContributions: 42,
            totalPullRequestContributions: 5,
            totalIssueContributions: 2,
            totalRepositoryContributions: 2,
          },
        },
      }) as any,
  };
}

describe("collectGithubData", () => {
  it("collects user, non-fork repos with languages/releases/workflows, and contribution stats", async () => {
    const result = await collectGithubData(fakeClient(), "Ktsu0");

    expect(result.user.login).toBe("Ktsu0");
    expect(result.repos).toHaveLength(1);
    const [repo] = result.repos;
    expect(repo?.name).toBe("portifolio_wagner");
    expect(repo?.languages).toEqual({ CSS: 100, HTML: 20 });
    expect(repo?.releaseCount).toBe(1);
    expect(repo?.hasWorkflows).toBe(false);
    expect(result.contributions.totalCommitContributions).toBe(42);
    expect(result.closedIssues).toBe(3);
    expect(result.mergedPullRequests).toBe(1);
  });
});
