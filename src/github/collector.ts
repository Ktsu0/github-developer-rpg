import { Octokit } from "@octokit/rest";
import {
  RawRepoSchema,
  RawUserSchema,
  type GithubClient,
  type RawRepo,
  type RawUser,
  type RawGithubData,
  type ContributionStats,
} from "./types";

export function createOctokit(token: string): GithubClient {
  return new Octokit({ auth: token }) as unknown as GithubClient;
}

export async function fetchUser(client: GithubClient, username: string): Promise<RawUser> {
  const res = await client.rest.users.getByUsername({ username });
  return RawUserSchema.parse(res.data);
}

export async function fetchLanguages(
  client: GithubClient,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const res = await client.rest.repos.listLanguages({ owner, repo });
  return res.data;
}

export async function fetchReleaseCount(
  client: GithubClient,
  owner: string,
  repo: string
): Promise<number> {
  const res = await client.rest.repos.listReleases({ owner, repo, per_page: 100 });
  return res.data.length;
}

export async function fetchHasWorkflows(
  client: GithubClient,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const res = await client.rest.repos.getContent({
      owner,
      repo,
      path: ".github/workflows",
    });
    return Array.isArray(res.data) ? res.data.length > 0 : true;
  } catch (err) {
    if (typeof err === "object" && err !== null && "status" in err && err.status === 404) {
      return false;
    }
    throw err;
  }
}

export async function fetchRepos(client: GithubClient, username: string): Promise<RawRepo[]> {
  const repos: RawRepo[] = [];
  let page = 1;
  for (;;) {
    const res = await client.rest.repos.listForUser({
      username,
      type: "owner",
      per_page: 100,
      page,
    });
    if (res.data.length === 0) break;
    for (const raw of res.data) {
      const parsed = RawRepoSchema.parse(raw);
      if (parsed.fork) continue;
      const [languages, releaseCount, hasWorkflows] = await Promise.all([
        fetchLanguages(client, username, parsed.name),
        fetchReleaseCount(client, username, parsed.name),
        fetchHasWorkflows(client, username, parsed.name),
      ]);
      repos.push({ ...parsed, languages, releaseCount, hasWorkflows });
    }
    if (res.data.length < 100) break;
    page += 1;
  }
  return repos;
}

export async function fetchContributionStats(
  client: GithubClient,
  username: string
): Promise<ContributionStats> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalRepositoryContributions
        }
      }
    }
  `;
  const result = await client.graphql<{
    user: { contributionsCollection: ContributionStats };
  }>(query, { login: username });
  return result.user.contributionsCollection;
}

export async function fetchClosedIssueCount(
  client: GithubClient,
  username: string
): Promise<number> {
  const res = await client.rest.search.issuesAndPullRequests({
    q: `author:${username} type:issue is:closed`,
    per_page: 1,
  });
  return res.data.total_count;
}

export async function fetchMergedPullRequestCount(
  client: GithubClient,
  username: string
): Promise<number> {
  const res = await client.rest.search.issuesAndPullRequests({
    q: `author:${username} type:pr is:merged`,
    per_page: 1,
  });
  return res.data.total_count;
}

export async function collectGithubData(
  client: GithubClient,
  username: string
): Promise<RawGithubData> {
  const [user, repos, contributions, closedIssues, mergedPullRequests] = await Promise.all([
    fetchUser(client, username),
    fetchRepos(client, username),
    fetchContributionStats(client, username),
    fetchClosedIssueCount(client, username),
    fetchMergedPullRequestCount(client, username),
  ]);
  return { user, repos, contributions, closedIssues, mergedPullRequests };
}
