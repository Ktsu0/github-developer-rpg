import { z } from "zod";

export const RawRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  fork: z.boolean(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  created_at: z.string(),
  pushed_at: z.string(),
  html_url: z.string(),
  // GitHub returns "" rather than null for "no homepage" fairly often —
  // normalized to null so downstream code has one falsy shape to check.
  homepage: z
    .string()
    .nullish()
    .transform((value) => (value && value.trim().length > 0 ? value : null)),
});

export type RawRepo = z.infer<typeof RawRepoSchema> & {
  languages: Record<string, number>;
  releaseCount: number;
  hasWorkflows: boolean;
};

export const RawUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  public_repos: z.number(),
});

export type RawUser = z.infer<typeof RawUserSchema>;

export interface ContributionStats {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalRepositoryContributions: number;
}

export interface RawGithubData {
  user: RawUser;
  repos: RawRepo[];
  contributions: ContributionStats;
  closedIssues: number;
  mergedPullRequests: number;
}

/**
 * Narrow structural interface over the Octokit surface actually used by
 * this project — lets tests pass a plain object instead of mocking the
 * real Octokit class.
 */
export interface GithubClient {
  rest: {
    users: {
      getByUsername(params: { username: string }): Promise<{ data: unknown }>;
    };
    repos: {
      listForUser(params: {
        username: string;
        type: string;
        per_page: number;
        page: number;
      }): Promise<{ data: unknown[] }>;
      listLanguages(params: {
        owner: string;
        repo: string;
      }): Promise<{ data: Record<string, number> }>;
      listReleases(params: {
        owner: string;
        repo: string;
        per_page: number;
      }): Promise<{ data: unknown[] }>;
      getContent(params: {
        owner: string;
        repo: string;
        path: string;
      }): Promise<{ data: unknown }>;
    };
    search: {
      issuesAndPullRequests(params: {
        q: string;
        per_page: number;
      }): Promise<{ data: { total_count: number } }>;
    };
  };
  graphql<T>(query: string, variables: Record<string, unknown>): Promise<T>;
}
