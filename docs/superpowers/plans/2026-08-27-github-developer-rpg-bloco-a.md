# GitHub Developer RPG — Bloco A (Bootstrap Funcional) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the full GitHub Developer RPG data/automation pipeline — real GitHub data collection, XP/Level/attribute calculation, hybrid project categorization, SVG generation, and README marker updates — running end-to-end via GitHub Actions against the real `Ktsu0/Ktsu0` profile repository, using a simple emoji as the character placeholder (the animated horse-rider SVG is out of scope; it is Bloco B).

**Architecture:** A single TypeScript engine repository (`github-developer-rpg`) collects real data via `@octokit/rest`, transforms it through a pure-function "RPG Engine" into a `DeveloperProfile`, renders that profile into three SVGs and nine README sections, and a thin CLI script wires it together for both local runs and a daily GitHub Actions workflow that pushes the result into the separate `Ktsu0/Ktsu0` profile repository.

**Tech Stack:** TypeScript (strict, ESM, `Bundler` module resolution) + Node.js 20 + `@octokit/rest` + `zod` + `vitest` + `tsx` + GitHub Actions.

## Global Constraints

- No equipment/weapon system on the character — ever (spec §1, §2.1).
- No invented skill percentages — every attribute/bar value must be derived from a documented formula over real data (spec §7, §19).
- The README never executes JavaScript — all dynamism is pre-rendered SVG (spec §2.3, §8).
- Secrets (`GITHUB_TOKEN`/PAT) are read from environment variables populated by GitHub Actions Secrets — never hardcoded, never committed (spec §3, §45 of the original spec).
- Every generated image URL includes a cache-busting query parameter that changes per run (spec §3).
- Each generated SVG stays under ~50KB and includes `<title>`/`<desc>` (spec §6).
- Character in this block is the placeholder emoji **🧑‍💻** — no horse-rider art, no piece decomposition, no SMIL animation (spec §2.4, §13 Bloco A).
- `config/` holds all manually curated narrative data; `src/` never imports from `config/` — config imports domain types from `src/types.ts` instead (spec §39, §5).
- TypeScript strict mode; all cross-module code is unit- or integration-tested with `vitest` before being wired into the CLI.
- Automated update frequency: 1×/day cron, `workflow_dispatch` also enabled (spec §9, §44 of the original spec).
- Rate-limit mitigation (spec §14: skip API calls for repos whose `pushed_at` hasn't changed since the last run) is **intentionally deferred to Bloco B's optimization pass (§13 B6)**. At the current repo count (~19), a full run costs roughly 60 authenticated API calls once per day — far under the 5000/hour limit — so the extra caching layer isn't needed yet; revisit if the repo count grows an order of magnitude.

---

## File Structure

```
github-developer-rpg/
├── CLAUDE.md
├── .gitignore                      (already exists)
├── .github/workflows/update-profile.yml
├── config/
│   ├── developer.ts
│   ├── projects.ts
│   ├── bosses.ts
│   └── currentQuest.ts
├── src/
│   ├── types.ts
│   ├── github/
│   │   ├── types.ts
│   │   ├── collector.ts
│   │   └── collector.test.ts
│   ├── rpg/
│   │   ├── xp.ts
│   │   ├── xp.test.ts
│   │   ├── level.ts
│   │   ├── level.test.ts
│   │   ├── categorize.ts
│   │   ├── categorize.test.ts
│   │   ├── mapLayout.ts
│   │   ├── mapLayout.test.ts
│   │   ├── attributes.ts
│   │   ├── attributes.test.ts
│   │   ├── achievements.ts
│   │   ├── achievements.test.ts
│   │   ├── buildProfile.ts
│   │   └── buildProfile.test.ts
│   ├── svg/
│   │   ├── theme.ts
│   │   ├── theme.test.ts
│   │   ├── character.ts
│   │   ├── character.test.ts
│   │   ├── worldMap.ts
│   │   ├── worldMap.test.ts
│   │   ├── stats.ts
│   │   └── stats.test.ts
│   ├── readme/
│   │   ├── applyMarkers.ts
│   │   ├── applyMarkers.test.ts
│   │   ├── sections.ts
│   │   └── sections.test.ts
│   └── pipeline/
│       ├── generate.ts
│       └── generate.test.ts
├── scripts/
│   ├── generate.ts
│   └── workflow.test.ts
├── README.template.md
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

Each `src/**` module is a small, pure, independently testable unit. Only `src/github/collector.ts` and `src/pipeline/generate.ts` touch the outside world (network/filesystem), and both take their client/paths as parameters so tests inject fakes instead of hitting real services.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm run build` (type-check), `npm test` (vitest), `npm run generate` (CLI) — every later task relies on these three scripts existing.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "github-developer-rpg",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc --noEmit",
    "test": "vitest run",
    "generate": "tsx scripts/generate.ts"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "vitest": "^2.1.4",
    "tsx": "^4.19.2",
    "@types/node": "^22.9.0",
    "yaml": "^2.6.0"
  },
  "dependencies": {
    "@octokit/rest": "^21.0.2",
    "zod": "^3.23.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src", "config", "scripts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts", "config/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: exits 0, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 5: Verify the toolchain wires up**

Run: `npx vitest --version` and `npx tsc --version`
Expected: both print version numbers with exit code 0. (Full `npm run build` is verified starting in Task 2, once `src/types.ts` exists — `tsc` errors on an empty `include` set.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "chore: scaffold TypeScript project (npm, tsconfig, vitest)"
```

---

### Task 2: Core domain types

**Files:**
- Create: `src/types.ts`
- Test: `src/types.test.ts`

**Interfaces:**
- Produces: `ProjectCategory`, `QuestStatus`, `MapNode`, `Project`, `Quest` (alias of `Project`), `Piece`, `Boss`, `Achievement`, `Attributes`, `Statistics`, `CurrentQuest`, `DeveloperConfig`, `DeveloperProfile` — every later task imports these names verbatim from `../types` (or `../../types` from two levels deep).

- [ ] **Step 1: Write the failing test**

```ts
// src/types.test.ts
import { describe, it, expect } from "vitest";
import type { DeveloperProfile, ProjectCategory } from "./types";

describe("domain types", () => {
  it("accepts a fully-formed DeveloperProfile shape", () => {
    const category: ProjectCategory = "starting-grounds";
    const profile: DeveloperProfile = {
      identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
      level: 1,
      xp: 0,
      attributes: {
        intelligence: 0,
        crafting: 0,
        exploration: 0,
        automation: 0,
        problemSolving: 0,
      },
      statistics: {
        repositories: 0,
        commits: 0,
        pullRequests: 0,
        issues: 0,
        releases: 0,
        contributions: 0,
      },
      projects: [],
      quests: [],
      achievements: [],
      bosses: [],
      currentQuest: {
        objective: "Build useful software from ideas.",
        statusPercent: 0,
        nextObjective: "Create something worth remembering.",
      },
    };
    expect(profile.identity.username).toBe("Ktsu0");
    expect(category).toBe("starting-grounds");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types.test.ts`
Expected: FAIL — `Cannot find module './types'`.

- [ ] **Step 3: Write `src/types.ts`**

```ts
export type ProjectCategory =
  | "games"
  | "backend"
  | "finance"
  | "team"
  | "projects"
  | "starting-grounds"
  | "uncharted";

export type QuestStatus = "completed" | "in-progress" | "planned" | "blocked";

export interface MapNode {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  category: ProjectCategory;
}

export interface ProjectSource {
  language: string | null;
  topics: string[];
  createdAt: string;
  pushedAt: string;
}

export interface Project {
  name: string;
  repository: string;
  description: string;
  category: ProjectCategory;
  region: MapNode;
  status: QuestStatus;
  curated: boolean;
  source: ProjectSource;
}

/** A Quest is the curated subset of Project shown in the Quest Log (spec §4). */
export type Quest = Project;

export interface Piece {
  id: string;
  group: string;
  initialPos: { x: number; y: number };
  finalPos: { x: number; y: number };
  initialRotation: number;
  finalRotation: number;
  delay: number;
  duration: number;
}

export interface Boss {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  auto: boolean;
  unlockedAt?: string;
}

export interface Attributes {
  intelligence: number;
  crafting: number;
  exploration: number;
  automation: number;
  problemSolving: number;
}

export interface Statistics {
  repositories: number;
  commits: number;
  pullRequests: number;
  issues: number;
  releases: number;
  contributions: number;
}

export interface CurrentQuest {
  objective: string;
  statusPercent: number;
  nextObjective: string;
}

export interface DeveloperConfig {
  username: string;
  name: string;
  class: string;
}

export interface DeveloperProfile {
  identity: DeveloperConfig;
  level: number;
  xp: number;
  attributes: Attributes;
  statistics: Statistics;
  projects: Project[];
  quests: Quest[];
  achievements: Achievement[];
  bosses: Boss[];
  currentQuest: CurrentQuest;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Verify the project type-checks**

Run: `npm run build`
Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/types.test.ts
git commit -m "feat: add core domain types (DeveloperProfile and friends)"
```

---

### Task 3: GitHub API raw types and zod schemas

**Files:**
- Create: `src/github/types.ts`
- Test: `src/github/types.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (standalone transport-layer types).
- Produces: `RawRepoSchema`, `RawRepo`, `RawUserSchema`, `RawUser`, `ContributionStats`, `RawGithubData`, `GithubClient` — Task 4 (collector) and Task 7 (categorize) import `RawRepo`; Task 4 implements `GithubClient`; Task 11 (buildProfile) and Task 16 (pipeline) consume `RawGithubData`.

- [ ] **Step 1: Write the failing test**

```ts
// src/github/types.test.ts
import { describe, it, expect } from "vitest";
import { RawRepoSchema, RawUserSchema } from "./types";

describe("GitHub raw schemas", () => {
  it("parses a valid repo payload", () => {
    const parsed = RawRepoSchema.parse({
      name: "portifolio_wagner",
      description: null,
      fork: false,
      language: "CSS",
      topics: [],
      created_at: "2025-04-10T00:00:00Z",
      pushed_at: "2025-04-10T00:00:00Z",
      html_url: "https://github.com/Ktsu0/portifolio_wagner",
    });
    expect(parsed.name).toBe("portifolio_wagner");
    expect(parsed.topics).toEqual([]);
  });

  it("defaults topics to an empty array when missing", () => {
    const parsed = RawRepoSchema.parse({
      name: "x",
      description: null,
      fork: true,
      language: null,
      created_at: "2025-01-01T00:00:00Z",
      pushed_at: "2025-01-01T00:00:00Z",
      html_url: "https://github.com/Ktsu0/x",
    });
    expect(parsed.topics).toEqual([]);
  });

  it("rejects a payload missing required fields", () => {
    expect(() => RawUserSchema.parse({ login: "Ktsu0" })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/github/types.test.ts`
Expected: FAIL — `Cannot find module './types'`.

- [ ] **Step 3: Write `src/github/types.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/github/types.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/github/types.ts src/github/types.test.ts
git commit -m "feat: add GitHub API raw types, zod schemas, and GithubClient interface"
```

---

### Task 4: GitHub data collector

**Files:**
- Create: `src/github/collector.ts`
- Test: `src/github/collector.test.ts`

**Interfaces:**
- Consumes: `GithubClient`, `RawRepoSchema`, `RawUserSchema`, `RawRepo`, `RawUser`, `RawGithubData`, `ContributionStats` from `./types` (Task 3).
- Produces: `createOctokit(token: string): GithubClient`, `collectGithubData(client: GithubClient, username: string): Promise<RawGithubData>` — Task 16 (pipeline) and Task 17 (CLI) call these by name.

- [ ] **Step 1: Write the failing test**

```ts
// src/github/collector.test.ts
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
    expect(result.repos[0].name).toBe("portifolio_wagner");
    expect(result.repos[0].languages).toEqual({ CSS: 100, HTML: 20 });
    expect(result.repos[0].releaseCount).toBe(1);
    expect(result.repos[0].hasWorkflows).toBe(false);
    expect(result.contributions.totalCommitContributions).toBe(42);
    expect(result.closedIssues).toBe(3);
    expect(result.mergedPullRequests).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/github/collector.test.ts`
Expected: FAIL — `Cannot find module './collector'`.

- [ ] **Step 3: Write `src/github/collector.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/github/collector.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Type-check**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/github/collector.ts src/github/collector.test.ts
git commit -m "feat: collect real GitHub data (repos, languages, releases, contributions)"
```

---

### Task 5: Config layer

**Files:**
- Create: `config/developer.ts`
- Create: `config/projects.ts`
- Create: `config/bosses.ts`
- Create: `config/currentQuest.ts`
- Test: `config/projects.test.ts`

**Interfaces:**
- Consumes: `DeveloperConfig`, `Boss`, `CurrentQuest` from `../src/types` (Task 2); `CuratedProject` from `../src/rpg/categorize` (Task 7 — see note below).
- Produces: `developer`, `curatedProjects`, `startingGroundsProjects`, `bosses`, `currentQuest` — Task 11 (`buildProfile`) and Task 17 (CLI) import these by name.

> **Ordering note:** `config/projects.ts` imports the `CuratedProject` type from `src/rpg/categorize.ts`, which is written in Task 7. TypeScript type-only imports don't need the file to exist at *runtime* order — but since we're doing this file-by-file, do Task 5's `developer.ts`, `bosses.ts`, and `currentQuest.ts` now, and come back to write `config/projects.ts` at the end of Task 7 (it's called out again there). This task's test only covers `developer.ts`, `bosses.ts`, `currentQuest.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// config/projects.test.ts
// (placed here so the whole config/ layer has one test file; runs after Task 7 adds projects.ts)
import { describe, it, expect } from "vitest";
import { developer } from "./developer";
import { bosses } from "./bosses";
import { currentQuest } from "./currentQuest";

describe("config layer", () => {
  it("defines the developer identity", () => {
    expect(developer.username).toBe("Ktsu0");
    expect(developer.name).toBe("Gabriel Wagner");
    expect(developer.class).toBe("Full Stack Developer");
  });

  it("defines bosses as an array (possibly empty, curated manually)", () => {
    expect(Array.isArray(bosses)).toBe(true);
  });

  it("defines a current quest with a valid status percent", () => {
    expect(currentQuest.statusPercent).toBeGreaterThanOrEqual(0);
    expect(currentQuest.statusPercent).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run config/projects.test.ts`
Expected: FAIL — `Cannot find module './developer'`.

- [ ] **Step 3: Write `config/developer.ts`**

```ts
import type { DeveloperConfig } from "../src/types";

export const developer: DeveloperConfig = {
  username: "Ktsu0",
  name: "Gabriel Wagner",
  class: "Full Stack Developer",
};
```

- [ ] **Step 4: Write `config/bosses.ts`**

```ts
import type { Boss } from "../src/types";

/**
 * 100% manual/narrative (spec §4). Empty until curated — the SVG/README
 * generators must render gracefully with zero bosses (see src/readme
 * §"BOSSES" section, which falls back to a placeholder message).
 *
 * Example shape once curated:
 * { id: "async-kraken", name: "Async Kraken", icon: "🌊",
 *   description: "A gnarly race condition that took three days to track down." }
 */
export const bosses: Boss[] = [];
```

- [ ] **Step 5: Write `config/currentQuest.ts`**

```ts
import type { CurrentQuest } from "../src/types";

export const currentQuest: CurrentQuest = {
  objective: "Build useful software from ideas.",
  statusPercent: 40,
  nextObjective: "Create something worth remembering.",
};
```

- [ ] **Step 6: Run test to verify the three implemented files pass**

Run: `npx vitest run config/projects.test.ts`
Expected: FAIL still — `Cannot find module './projects'` doesn't apply yet (this test file doesn't import projects.ts), but if it fails for a different reason, resolve it before continuing. Expected once `developer.ts`/`bosses.ts`/`currentQuest.ts` exist: PASS (3 tests) — `config/projects.ts` is added in Task 7 and does not affect this test file.

- [ ] **Step 7: Commit**

```bash
git add config/developer.ts config/bosses.ts config/currentQuest.ts config/projects.test.ts
git commit -m "feat: add developer identity, bosses, and current quest config"
```

---

### Task 6: RPG Engine — XP and Level

**Files:**
- Create: `src/rpg/xp.ts`
- Create: `src/rpg/xp.test.ts`
- Create: `src/rpg/level.ts`
- Create: `src/rpg/level.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure functions over plain numbers).
- Produces: `XpEvents`, `XP_WEIGHTS`, `calculateXp(events: XpEvents): number`, `calculateLevel(xp: number): number` — Task 11 (`buildProfile`) calls both by name.

- [ ] **Step 1: Write the failing test for XP**

```ts
// src/rpg/xp.test.ts
import { describe, it, expect } from "vitest";
import { calculateXp } from "./xp";

describe("calculateXp", () => {
  it("returns 0 for no events", () => {
    expect(
      calculateXp({
        commits: 0,
        pullRequests: 0,
        issues: 0,
        repositories: 0,
        releases: 0,
        completedQuests: 0,
      })
    ).toBe(0);
  });

  it("weights each event type per spec §7", () => {
    const xp = calculateXp({
      commits: 10,
      pullRequests: 2,
      issues: 1,
      repositories: 1,
      releases: 1,
      completedQuests: 1,
    });
    // 10*1 + 2*15 + 1*10 + 1*50 + 1*100 + 1*150 = 10+30+10+50+100+150 = 350
    expect(xp).toBe(350);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rpg/xp.test.ts`
Expected: FAIL — `Cannot find module './xp'`.

- [ ] **Step 3: Write `src/rpg/xp.ts`**

```ts
export interface XpEvents {
  commits: number;
  pullRequests: number;
  issues: number;
  repositories: number;
  releases: number;
  completedQuests: number;
}

export const XP_WEIGHTS = {
  commit: 1,
  pullRequest: 15,
  issue: 10,
  repository: 50,
  release: 100,
  quest: 150,
} as const;

export function calculateXp(events: XpEvents): number {
  return (
    events.commits * XP_WEIGHTS.commit +
    events.pullRequests * XP_WEIGHTS.pullRequest +
    events.issues * XP_WEIGHTS.issue +
    events.repositories * XP_WEIGHTS.repository +
    events.releases * XP_WEIGHTS.release +
    events.completedQuests * XP_WEIGHTS.quest
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rpg/xp.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for Level**

```ts
// src/rpg/level.test.ts
import { describe, it, expect } from "vitest";
import { calculateLevel } from "./level";

describe("calculateLevel", () => {
  it("is level 1 at zero XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("follows the floor(1 + sqrt(xp/40)) curve from spec §7", () => {
    expect(calculateLevel(40)).toBe(2);
    expect(calculateLevel(360)).toBe(4);
    expect(calculateLevel(1000)).toBe(6);
  });

  it("never returns a level below 1", () => {
    expect(calculateLevel(-100)).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/rpg/level.test.ts`
Expected: FAIL — `Cannot find module './level'`.

- [ ] **Step 7: Write `src/rpg/level.ts`**

```ts
export function calculateLevel(xp: number): number {
  const safeXp = Math.max(0, xp);
  return Math.floor(1 + Math.sqrt(safeXp / 40));
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/rpg/level.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add src/rpg/xp.ts src/rpg/xp.test.ts src/rpg/level.ts src/rpg/level.test.ts
git commit -m "feat: add XP and Level formulas (spec §7)"
```

---

### Task 7: RPG Engine — categorization (and the deferred `config/projects.ts`)

**Files:**
- Create: `src/rpg/categorize.ts`
- Create: `src/rpg/categorize.test.ts`
- Create: `config/projects.ts`

**Interfaces:**
- Consumes: `RawRepo` from `../github/types` (Task 3); `Project`, `ProjectCategory`, `QuestStatus` from `../types` (Task 2).
- Produces: `CuratedProject`, `CategorizedProject` (= `Omit<Project, "region"> & { icon?: string }`), `heuristicCategory(repo: RawRepo): ProjectCategory`, `findCuratedProject(repo: RawRepo, curated: CuratedProject[]): CuratedProject | undefined`, `categorizeRepo(repo: RawRepo, curated: CuratedProject[]): CategorizedProject` — Task 8 (`mapLayout`) consumes the `CategorizedProject` shape (including the optional `icon` override); Task 11 (`buildProfile`) calls `categorizeRepo`; `config/projects.ts` (this task) and `config/bosses.ts`-style config consumers import `CuratedProject`.

- [ ] **Step 1: Write the failing test**

```ts
// src/rpg/categorize.test.ts
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
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rpg/categorize.test.ts`
Expected: FAIL — `Cannot find module './categorize'`.

- [ ] **Step 3: Write `src/rpg/categorize.ts`**

```ts
import type { RawRepo } from "../github/types";
import type { Project, ProjectCategory, QuestStatus } from "../types";

export interface CuratedProject {
  /** Must match RawRepo.name, case-insensitive. */
  repository: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: QuestStatus;
  icon: string;
}

/**
 * Only maps languages that reliably imply a category on their own.
 * "finance"/"team"/"projects"/"starting-grounds" are curation-only —
 * they can't be inferred from language alone (spec §5).
 */
const LANGUAGE_CATEGORY_MAP: Partial<Record<string, ProjectCategory>> = {
  GDScript: "games",
};

export function heuristicCategory(repo: RawRepo): ProjectCategory {
  if (repo.language && repo.language in LANGUAGE_CATEGORY_MAP) {
    return LANGUAGE_CATEGORY_MAP[repo.language] as ProjectCategory;
  }
  return "uncharted";
}

export function findCuratedProject(
  repo: RawRepo,
  curated: CuratedProject[]
): CuratedProject | undefined {
  return curated.find((c) => c.repository.toLowerCase() === repo.name.toLowerCase());
}

/**
 * Everything categorizeRepo can determine before a map position exists.
 * `icon`, when present, overrides the category's default MapNode icon
 * (mapLayout.ts falls back to the category default when it's absent —
 * i.e. for every non-curated repo).
 */
export type CategorizedProject = Omit<Project, "region"> & { icon?: string };

export function categorizeRepo(
  repo: RawRepo,
  curated: CuratedProject[]
): CategorizedProject {
  const match = findCuratedProject(repo, curated);
  const source = {
    language: repo.language,
    topics: repo.topics,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
  };

  if (match) {
    return {
      name: match.name,
      repository: repo.name,
      description: match.description,
      category: match.category,
      status: match.status,
      curated: true,
      source,
      icon: match.icon,
    };
  }

  return {
    // Name always signals "not yet curated"; category still uses the
    // heuristic so it clusters near related curated regions on the map.
    name: `Uncharted Land — ${repo.name}`,
    repository: repo.name,
    description: repo.description ?? "",
    category: heuristicCategory(repo),
    status: "in-progress",
    curated: false,
    source,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rpg/categorize.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write `config/projects.ts`**

```ts
import type { CuratedProject } from "../src/rpg/categorize";

/**
 * Fixed list, not a heuristic (decision recorded in spec §5.1): the
 * user's first course projects, confirmed against real GitHub data on
 * 2026-08-27.
 */
export const startingGroundsProjects: CuratedProject[] = [
  {
    repository: "portifolio_wagner",
    name: "Portfólio Wagner",
    description: "Meus primeiros passos em desenvolvimento web.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "portifolio_react",
    name: "Portfólio React",
    description: "Primeiro contato com React, ainda aprendendo.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "login_page",
    name: "Tela de Login",
    description: "Prática de formulários e validação em JavaScript puro.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
  {
    repository: "front_end_react",
    name: "Front End React",
    description: "Projeto de front-end para a matéria de Back-end.",
    category: "starting-grounds",
    status: "completed",
    icon: "🌱",
  },
];

export const curatedProjects: CuratedProject[] = [
  ...startingGroundsProjects,
  {
    repository: "Financeiro",
    name: "Financeiro",
    description: "Dashboard para controle de gastos pessoais.",
    category: "finance",
    status: "completed",
    icon: "🏦",
  },
  {
    repository: "antes-de-dormir",
    name: "Antes de Dormir",
    description: "Plataforma para publicar histórias curtas.",
    category: "projects",
    status: "completed",
    icon: "🏠",
  },
  {
    repository: "PlantaGamer",
    name: "PlantaGamer",
    description: "Projeto em time aplicando Scrum.",
    category: "team",
    status: "completed",
    icon: "🤝",
  },
];
```

- [ ] **Step 6: Run the full config test file now that `projects.ts` exists**

Run: `npx vitest run config/projects.test.ts`
Expected: PASS (3 tests, from Task 5 — unaffected by this file's addition but confirms nothing broke).

- [ ] **Step 7: Type-check**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/rpg/categorize.ts src/rpg/categorize.test.ts config/projects.ts
git commit -m "feat: add hybrid project categorization and curated project config"
```

---

### Task 8: RPG Engine — World Map layout

**Files:**
- Create: `src/rpg/mapLayout.ts`
- Create: `src/rpg/mapLayout.test.ts`

**Interfaces:**
- Consumes: `Project`, `MapNode`, `ProjectCategory` from `../types` (Task 2); `CategorizedProject` from `./categorize` (Task 7).
- Produces: `assignMapPositions(projects: CategorizedProject[]): Project[]` — Task 11 (`buildProfile`) calls this directly after `categorizeRepo`.

- [ ] **Step 1: Write the failing test**

```ts
// src/rpg/mapLayout.test.ts
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
    source: { language: "GDScript", topics: [], createdAt: "2025-01-01", pushedAt: "2025-01-01" },
    ...overrides,
  };
}

describe("assignMapPositions", () => {
  it("assigns a MapNode with the category's default icon and a category-appropriate position", () => {
    const [result] = assignMapPositions([baseProject({})]);
    expect(result.region.category).toBe("games");
    expect(result.region.icon).toBe("🎮");
    expect(typeof result.region.x).toBe("number");
    expect(typeof result.region.y).toBe("number");
  });

  it("spreads multiple projects in the same category to distinct positions", () => {
    const results = assignMapPositions([
      baseProject({ repository: "a" }),
      baseProject({ repository: "b" }),
    ]);
    expect(results[0].region.x).not.toBe(results[1].region.x);
  });

  it("places starting-grounds at its own dedicated position", () => {
    const [result] = assignMapPositions([
      baseProject({ category: "starting-grounds", repository: "portifolio_wagner" }),
    ]);
    expect(result.region.icon).toBe("🌱");
  });

  it("uses the curated icon override instead of the category default when present", () => {
    const [result] = assignMapPositions([
      baseProject({ category: "finance", repository: "Financeiro", icon: "💰" }),
    ]);
    expect(result.region.icon).toBe("💰");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rpg/mapLayout.test.ts`
Expected: FAIL — `Cannot find module './mapLayout'`.

- [ ] **Step 3: Write `src/rpg/mapLayout.ts`**

```ts
import type { MapNode, Project, ProjectCategory } from "../types";
import type { CategorizedProject } from "./categorize";

const BASE_POSITIONS: Record<ProjectCategory, { x: number; y: number }> = {
  "starting-grounds": { x: 80, y: 420 },
  games: { x: 200, y: 120 },
  backend: { x: 400, y: 80 },
  finance: { x: 600, y: 300 },
  team: { x: 150, y: 300 },
  projects: { x: 400, y: 420 },
  uncharted: { x: 650, y: 120 },
};

const CATEGORY_ICONS: Record<ProjectCategory, string> = {
  "starting-grounds": "🌱",
  games: "🎮",
  backend: "⚙️",
  finance: "🏦",
  team: "🤝",
  projects: "🏠",
  uncharted: "🌫️",
};

export function assignMapPositions(projects: CategorizedProject[]): Project[] {
  const counters: Partial<Record<ProjectCategory, number>> = {};
  return projects.map((project) => {
    const { icon: iconOverride, ...projectFields } = project;
    const base = BASE_POSITIONS[project.category];
    const index = counters[project.category] ?? 0;
    counters[project.category] = index + 1;
    const offsetX = (index % 4) * 36;
    const offsetY = Math.floor(index / 4) * 36;
    const region: MapNode = {
      id: project.repository,
      label: project.name,
      icon: iconOverride ?? CATEGORY_ICONS[project.category],
      x: base.x + offsetX,
      y: base.y + offsetY,
      category: project.category,
    };
    return { ...projectFields, region };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rpg/mapLayout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/rpg/mapLayout.ts src/rpg/mapLayout.test.ts
git commit -m "feat: assign World Map positions per project category"
```

---

### Task 9: RPG Engine — Attributes

**Files:**
- Create: `src/rpg/attributes.ts`
- Create: `src/rpg/attributes.test.ts`

**Interfaces:**
- Consumes: `Attributes` from `../types` (Task 2).
- Produces: `AttributeInputs`, `ATTRIBUTE_CAPS`, `calculateAttributes(inputs: AttributeInputs): Attributes` — Task 11 (`buildProfile`) calls this by name.

- [ ] **Step 1: Write the failing test**

```ts
// src/rpg/attributes.test.ts
import { describe, it, expect } from "vitest";
import { calculateAttributes, ATTRIBUTE_CAPS } from "./attributes";

describe("calculateAttributes", () => {
  it("returns all zeros for no signal", () => {
    const attrs = calculateAttributes({
      languageCount: 0,
      reposWithReleases: 0,
      totalRepos: 0,
      recentLanguageCount: 0,
      reposWithWorkflows: 0,
      closedIssues: 0,
      mergedPullRequests: 0,
    });
    expect(attrs).toEqual({
      intelligence: 0,
      crafting: 0,
      exploration: 0,
      automation: 0,
      problemSolving: 0,
    });
  });

  it("scales proportionally to the documented cap and clamps at 100", () => {
    const attrs = calculateAttributes({
      languageCount: ATTRIBUTE_CAPS.intelligence * 2,
      reposWithReleases: ATTRIBUTE_CAPS.crafting,
      totalRepos: 20,
      recentLanguageCount: 1,
      reposWithWorkflows: 0,
      closedIssues: 0,
      mergedPullRequests: 0,
    });
    expect(attrs.intelligence).toBe(100);
    expect(attrs.crafting).toBe(100);
  });

  it("never returns a negative value", () => {
    const attrs = calculateAttributes({
      languageCount: -5,
      reposWithReleases: 0,
      totalRepos: 0,
      recentLanguageCount: 0,
      reposWithWorkflows: 0,
      closedIssues: 0,
      mergedPullRequests: 0,
    });
    expect(attrs.intelligence).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rpg/attributes.test.ts`
Expected: FAIL — `Cannot find module './attributes'`.

- [ ] **Step 3: Write `src/rpg/attributes.ts`**

```ts
import type { Attributes } from "../types";

export interface AttributeInputs {
  languageCount: number;
  reposWithReleases: number;
  totalRepos: number;
  recentLanguageCount: number;
  reposWithWorkflows: number;
  closedIssues: number;
  mergedPullRequests: number;
}

export const ATTRIBUTE_CAPS = {
  intelligence: 12,
  crafting: 8,
  exploration: 6,
  automation: 10,
  problemSolving: 60,
} as const;

function scale(value: number, cap: number): number {
  const safeValue = Math.max(0, value);
  return Math.max(0, Math.min(100, Math.round((safeValue / cap) * 100)));
}

export function calculateAttributes(inputs: AttributeInputs): Attributes {
  return {
    intelligence: scale(inputs.languageCount, ATTRIBUTE_CAPS.intelligence),
    crafting: scale(inputs.reposWithReleases, ATTRIBUTE_CAPS.crafting),
    exploration: scale(inputs.recentLanguageCount, ATTRIBUTE_CAPS.exploration),
    automation: scale(inputs.reposWithWorkflows, ATTRIBUTE_CAPS.automation),
    problemSolving: scale(
      inputs.closedIssues + inputs.mergedPullRequests,
      ATTRIBUTE_CAPS.problemSolving
    ),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rpg/attributes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/rpg/attributes.ts src/rpg/attributes.test.ts
git commit -m "feat: derive RPG attributes from real GitHub signals (spec §7)"
```

---

### Task 10: RPG Engine — Achievements

**Files:**
- Create: `src/rpg/achievements.ts`
- Create: `src/rpg/achievements.test.ts`

**Interfaces:**
- Consumes: `Achievement`, `Statistics` from `../types` (Task 2).
- Produces: `AchievementRule`, `AUTO_ACHIEVEMENT_RULES`, `calculateAchievements(stats: Statistics, curatedProjectCount: number): Achievement[]` — Task 11 (`buildProfile`) calls this by name.

- [ ] **Step 1: Write the failing test**

```ts
// src/rpg/achievements.test.ts
import { describe, it, expect } from "vitest";
import { calculateAchievements } from "./achievements";
import type { Statistics } from "../types";

const zeroStats: Statistics = {
  repositories: 0,
  commits: 0,
  pullRequests: 0,
  issues: 0,
  releases: 0,
  contributions: 0,
};

describe("calculateAchievements", () => {
  it("unlocks nothing at zero stats and zero curated projects", () => {
    expect(calculateAchievements(zeroStats, 0)).toEqual([]);
  });

  it("unlocks First Quest once there is at least one curated project", () => {
    const result = calculateAchievements(zeroStats, 1);
    expect(result.map((a) => a.id)).toContain("first-quest");
  });

  it("unlocks Century at 100+ commits", () => {
    const result = calculateAchievements({ ...zeroStats, commits: 100 }, 0);
    expect(result.map((a) => a.id)).toContain("hundred-commits");
  });

  it("marks every returned achievement as auto", () => {
    const result = calculateAchievements({ ...zeroStats, releases: 1 }, 0);
    expect(result.every((a) => a.auto)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rpg/achievements.test.ts`
Expected: FAIL — `Cannot find module './achievements'`.

- [ ] **Step 3: Write `src/rpg/achievements.ts`**

```ts
import type { Achievement, Statistics } from "../types";

export interface AchievementRule {
  id: string;
  name: string;
  icon: string;
  description: string;
  check: (stats: Statistics, curatedProjectCount: number) => boolean;
}

export const AUTO_ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    id: "first-quest",
    name: "First Quest",
    icon: "🏆",
    description: "Created your first curated project.",
    check: (_stats, curatedProjectCount) => curatedProjectCount >= 1,
  },
  {
    id: "hundred-commits",
    name: "Century",
    icon: "💯",
    description: "Reached 100 commit contributions.",
    check: (stats) => stats.commits >= 100,
  },
  {
    id: "ten-repositories",
    name: "Explorer",
    icon: "🌎",
    description: "Reached 10 public repositories.",
    check: (stats) => stats.repositories >= 10,
  },
  {
    id: "first-release",
    name: "Launcher",
    icon: "🚀",
    description: "Published a first release.",
    check: (stats) => stats.releases >= 1,
  },
  {
    id: "first-pull-request",
    name: "Team Player",
    icon: "🤝",
    description: "Opened a first pull request.",
    check: (stats) => stats.pullRequests >= 1,
  },
];

export function calculateAchievements(
  stats: Statistics,
  curatedProjectCount: number
): Achievement[] {
  return AUTO_ACHIEVEMENT_RULES.filter((rule) => rule.check(stats, curatedProjectCount)).map(
    (rule) => ({
      id: rule.id,
      name: rule.name,
      icon: rule.icon,
      description: rule.description,
      auto: true,
    })
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rpg/achievements.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/rpg/achievements.ts src/rpg/achievements.test.ts
git commit -m "feat: add automatic achievements from real GitHub stats (spec §33)"
```

---

### Task 11: RPG Engine — buildProfile orchestrator

**Files:**
- Create: `src/rpg/buildProfile.ts`
- Create: `src/rpg/buildProfile.test.ts`

**Interfaces:**
- Consumes: `RawGithubData` from `../github/types` (Task 3); `DeveloperProfile`, `DeveloperConfig`, `Boss`, `CurrentQuest`, `Statistics` from `../types` (Task 2); `categorizeRepo`, `CuratedProject` from `./categorize` (Task 7); `assignMapPositions` from `./mapLayout` (Task 8); `calculateXp` from `./xp` (Task 6); `calculateLevel` from `./level` (Task 6); `calculateAttributes` from `./attributes` (Task 9); `calculateAchievements` from `./achievements` (Task 10).
- Produces: `BuildProfileConfig`, `buildProfile(raw: RawGithubData, config: BuildProfileConfig, now?: Date): DeveloperProfile` — Task 16 (`src/pipeline/generate.ts`) calls this by name.

- [ ] **Step 1: Write the failing test**

```ts
// src/rpg/buildProfile.test.ts
import { describe, it, expect } from "vitest";
import { buildProfile } from "./buildProfile";
import type { RawGithubData } from "../github/types";
import type { CuratedProject } from "./categorize";

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
      bosses: [],
      currentQuest: { objective: "Ship it", statusPercent: 50, nextObjective: "Ship more" },
    });

    expect(profile.identity.username).toBe("Ktsu0");
    expect(profile.projects).toHaveLength(2);
    expect(profile.quests).toHaveLength(1);
    expect(profile.quests[0].name).toBe("Financeiro");
    expect(profile.statistics.repositories).toBe(2);
    expect(profile.statistics.commits).toBe(120);
    expect(profile.statistics.releases).toBe(1);
    expect(profile.xp).toBeGreaterThan(0);
    expect(profile.level).toBeGreaterThanOrEqual(1);
    expect(profile.achievements.map((a) => a.id)).toContain("first-quest");
    expect(profile.currentQuest.objective).toBe("Ship it");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/rpg/buildProfile.test.ts`
Expected: FAIL — `Cannot find module './buildProfile'`.

- [ ] **Step 3: Write `src/rpg/buildProfile.ts`**

```ts
import type { RawGithubData } from "../github/types";
import type { Boss, CurrentQuest, DeveloperConfig, DeveloperProfile, Statistics } from "../types";
import { categorizeRepo, type CuratedProject } from "./categorize";
import { assignMapPositions } from "./mapLayout";
import { calculateXp } from "./xp";
import { calculateLevel } from "./level";
import { calculateAttributes } from "./attributes";
import { calculateAchievements } from "./achievements";

export interface BuildProfileConfig {
  developer: DeveloperConfig;
  curatedProjects: CuratedProject[];
  bosses: Boss[];
  currentQuest: CurrentQuest;
}

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

export function buildProfile(
  raw: RawGithubData,
  config: BuildProfileConfig,
  now: Date = new Date()
): DeveloperProfile {
  const categorized = raw.repos.map((repo) => categorizeRepo(repo, config.curatedProjects));
  const projects = assignMapPositions(categorized);
  const quests = projects.filter((p) => p.curated);

  const statistics: Statistics = {
    repositories: raw.repos.length,
    commits: raw.contributions.totalCommitContributions,
    pullRequests: raw.contributions.totalPullRequestContributions,
    issues: raw.contributions.totalIssueContributions,
    releases: raw.repos.reduce((sum, r) => sum + r.releaseCount, 0),
    contributions: raw.contributions.totalRepositoryContributions,
  };

  const completedQuests = quests.filter((q) => q.status === "completed").length;
  const xp = calculateXp({
    commits: statistics.commits,
    pullRequests: statistics.pullRequests,
    issues: statistics.issues,
    repositories: statistics.repositories,
    releases: statistics.releases,
    completedQuests,
  });
  const level = calculateLevel(xp);

  const sixMonthsAgo = new Date(now.getTime() - SIX_MONTHS_MS);
  const allLanguages = new Set<string>();
  const recentLanguages = new Set<string>();
  let reposWithReleases = 0;
  let reposWithWorkflows = 0;
  for (const repo of raw.repos) {
    for (const lang of Object.keys(repo.languages)) {
      allLanguages.add(lang);
      if (new Date(repo.pushed_at) >= sixMonthsAgo) recentLanguages.add(lang);
    }
    if (repo.releaseCount > 0) reposWithReleases += 1;
    if (repo.hasWorkflows) reposWithWorkflows += 1;
  }

  const attributes = calculateAttributes({
    languageCount: allLanguages.size,
    reposWithReleases,
    totalRepos: raw.repos.length,
    recentLanguageCount: recentLanguages.size,
    reposWithWorkflows,
    closedIssues: raw.closedIssues,
    mergedPullRequests: raw.mergedPullRequests,
  });

  const achievements = calculateAchievements(statistics, quests.length);

  return {
    identity: config.developer,
    level,
    xp,
    attributes,
    statistics,
    projects,
    quests,
    achievements,
    bosses: config.bosses,
    currentQuest: config.currentQuest,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/rpg/buildProfile.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Type-check and run the full RPG Engine test suite**

Run: `npm run build && npx vitest run src/rpg`
Expected: build exits 0; all RPG Engine test files pass.

- [ ] **Step 6: Commit**

```bash
git add src/rpg/buildProfile.ts src/rpg/buildProfile.test.ts
git commit -m "feat: orchestrate DeveloperProfile construction (RPG Engine entrypoint)"
```

---

### Task 12: SVG theme and character generator (emoji placeholder)

**Files:**
- Create: `src/svg/theme.ts`
- Create: `src/svg/theme.test.ts`
- Create: `src/svg/character.ts`
- Create: `src/svg/character.test.ts`

**Interfaces:**
- Consumes: `DeveloperProfile` from `../types` (Task 2).
- Produces: `THEME`, `escapeXml(value: string): string` from `./theme`; `CHARACTER_PLACEHOLDER_EMOJI`, `generateCharacterSvg(profile: DeveloperProfile): string` from `./character` — Task 13 (`worldMap`) imports `CHARACTER_PLACEHOLDER_EMOJI` and both later SVG tasks import `THEME`/`escapeXml`; Task 16 (pipeline) calls `generateCharacterSvg`.

- [ ] **Step 1: Write the failing test for theme**

```ts
// src/svg/theme.test.ts
import { describe, it, expect } from "vitest";
import { THEME, escapeXml } from "./theme";

describe("theme", () => {
  it("exposes the palette locked in spec §2.2", () => {
    expect(THEME.background).toBe("#0b0f14");
    expect(THEME.character).toBe("#FFFFFF");
    expect(THEME.glow).toBe("#ffb454");
    expect(THEME.accent).toBe("#54e0c7");
  });
});

describe("escapeXml", () => {
  it("escapes XML-significant characters", () => {
    expect(escapeXml(`R&D <Team> "quotes" 'apos'`)).toBe(
      "R&amp;D &lt;Team&gt; &quot;quotes&quot; &apos;apos&apos;"
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeXml("Gabriel Wagner")).toBe("Gabriel Wagner");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/svg/theme.test.ts`
Expected: FAIL — `Cannot find module './theme'`.

- [ ] **Step 3: Write `src/svg/theme.ts`**

```ts
export const THEME = {
  background: "#0b0f14",
  character: "#FFFFFF",
  pathBase: "#22303a",
  glow: "#ffb454",
  accent: "#54e0c7",
  font: "monospace",
} as const;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/svg/theme.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for the character generator**

```ts
// src/svg/character.test.ts
import { describe, it, expect } from "vitest";
import { generateCharacterSvg, CHARACTER_PLACEHOLDER_EMOJI } from "./character";
import type { DeveloperProfile } from "../types";

function profile(overrides: Partial<DeveloperProfile> = {}): DeveloperProfile {
  return {
    identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
    level: 5,
    xp: 320,
    attributes: { intelligence: 10, crafting: 10, exploration: 10, automation: 10, problemSolving: 10 },
    statistics: { repositories: 5, commits: 50, pullRequests: 5, issues: 2, releases: 1, contributions: 5 },
    projects: [],
    quests: [],
    achievements: [],
    bosses: [],
    currentQuest: { objective: "x", statusPercent: 0, nextObjective: "y" },
    ...overrides,
  };
}

describe("generateCharacterSvg", () => {
  it("renders a valid SVG with the placeholder emoji, name, class and level", () => {
    const svg = generateCharacterSvg(profile());
    expect(svg).toContain("<svg");
    expect(svg).toContain(CHARACTER_PLACEHOLDER_EMOJI);
    expect(svg).toContain("<title>");
    expect(svg).toContain("<desc>");
    expect(svg).toContain("Gabriel Wagner");
    expect(svg).toContain("Full Stack Developer");
    expect(svg).toContain("Level 5");
  });

  it("escapes special characters in the name", () => {
    const svg = generateCharacterSvg(profile({ identity: { username: "x", name: "A & B", class: "Dev" } }));
    expect(svg).toContain("A &amp; B");
  });

  it("stays well under the 50KB budget from spec §6", () => {
    const svg = generateCharacterSvg(profile());
    expect(svg.length).toBeLessThan(50_000);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/svg/character.test.ts`
Expected: FAIL — `Cannot find module './character'`.

- [ ] **Step 7: Write `src/svg/character.ts`**

```ts
import type { DeveloperProfile } from "../types";
import { THEME, escapeXml } from "./theme";

/**
 * Bloco A placeholder (spec §2.4) — the horse-rider replaces this in Bloco B
 * without changing any consumer of generateCharacterSvg.
 */
export const CHARACTER_PLACEHOLDER_EMOJI = "🧑‍💻";

export function generateCharacterSvg(profile: DeveloperProfile): string {
  const name = escapeXml(profile.identity.name);
  const cls = escapeXml(profile.identity.class);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" role="img">
  <title>${name} — Developer RPG</title>
  <desc>Character portrait placeholder for ${name}, ${cls}.</desc>
  <rect width="400" height="260" fill="${THEME.background}"/>
  <text x="200" y="110" font-size="72" text-anchor="middle" dominant-baseline="middle">${CHARACTER_PLACEHOLDER_EMOJI}</text>
  <text x="200" y="180" font-family="${THEME.font}" font-size="18" fill="${THEME.character}" text-anchor="middle">${name}</text>
  <text x="200" y="204" font-family="${THEME.font}" font-size="13" fill="${THEME.accent}" text-anchor="middle">${cls} · Level ${profile.level}</text>
</svg>`;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/svg/character.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add src/svg/theme.ts src/svg/theme.test.ts src/svg/character.ts src/svg/character.test.ts
git commit -m "feat: add SVG theme constants and placeholder-emoji Hero generator"
```

---

### Task 13: SVG world-map generator

**Files:**
- Create: `src/svg/worldMap.ts`
- Create: `src/svg/worldMap.test.ts`

**Interfaces:**
- Consumes: `DeveloperProfile`, `Project` from `../types` (Task 2); `THEME`, `escapeXml` from `./theme` (Task 12); `CHARACTER_PLACEHOLDER_EMOJI` from `./character` (Task 12).
- Produces: `generateWorldMapSvg(profile: DeveloperProfile): string` — Task 16 (pipeline) calls this by name.

- [ ] **Step 1: Write the failing test**

```ts
// src/svg/worldMap.test.ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/svg/worldMap.test.ts`
Expected: FAIL — `Cannot find module './worldMap'`.

- [ ] **Step 3: Write `src/svg/worldMap.ts`**

```ts
import type { DeveloperProfile, Project } from "../types";
import { THEME, escapeXml } from "./theme";
import { CHARACTER_PLACEHOLDER_EMOJI } from "./character";

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 500;

function renderRegion(project: Project): string {
  const { region } = project;
  const label = escapeXml(region.label);
  return `  <g>
    <text x="${region.x}" y="${region.y}" font-size="20" text-anchor="middle">${region.icon}</text>
    <text x="${region.x}" y="${region.y + 16}" font-family="${THEME.font}" font-size="9" fill="${THEME.accent}" text-anchor="middle">${label}</text>
  </g>`;
}

/** Prefers a curated in-progress quest; falls back to the first curated project (Bloco A simplification, spec §2.4). */
function findCurrentRegion(projects: Project[]): Project | undefined {
  return (
    projects.find((p) => p.curated && p.status === "in-progress") ??
    projects.find((p) => p.curated)
  );
}

export function generateWorldMapSvg(profile: DeveloperProfile): string {
  const regions = profile.projects.map(renderRegion).join("\n");
  const current = findCurrentRegion(profile.projects);
  const marker = current
    ? `  <circle cx="${current.region.x}" cy="${current.region.y - 24}" r="9" fill="none" stroke="${THEME.glow}" stroke-width="2">
    <animate attributeName="r" values="7;13;7" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite"/>
  </circle>
  <text x="${current.region.x}" y="${current.region.y - 34}" font-size="18" text-anchor="middle">${CHARACTER_PLACEHOLDER_EMOJI}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" width="${VIEWBOX_WIDTH}" height="${VIEWBOX_HEIGHT}" role="img">
  <title>${escapeXml(profile.identity.name)} — World Map</title>
  <desc>Map of real GitHub repositories grouped into RPG regions.</desc>
  <rect width="${VIEWBOX_WIDTH}" height="${VIEWBOX_HEIGHT}" fill="${THEME.background}"/>
${regions}
${marker}
</svg>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/svg/worldMap.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/svg/worldMap.ts src/svg/worldMap.test.ts
git commit -m "feat: add World Map SVG generator with real regions and a static marker"
```

---

### Task 14: SVG stats generator

**Files:**
- Create: `src/svg/stats.ts`
- Create: `src/svg/stats.test.ts`

**Interfaces:**
- Consumes: `DeveloperProfile`, `Attributes` from `../types` (Task 2); `THEME`, `escapeXml` from `./theme` (Task 12).
- Produces: `generateStatsSvg(profile: DeveloperProfile): string` — Task 16 (pipeline) calls this by name.

- [ ] **Step 1: Write the failing test**

```ts
// src/svg/stats.test.ts
import { describe, it, expect } from "vitest";
import { generateStatsSvg } from "./stats";
import type { DeveloperProfile } from "../types";

const profile: DeveloperProfile = {
  identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
  level: 7,
  xp: 850,
  attributes: { intelligence: 80, crafting: 60, exploration: 40, automation: 20, problemSolving: 100 },
  statistics: { repositories: 12, commits: 300, pullRequests: 8, issues: 3, releases: 2, contributions: 12 },
  projects: [],
  quests: [],
  achievements: [],
  bosses: [],
  currentQuest: { objective: "x", statusPercent: 0, nextObjective: "y" },
};

describe("generateStatsSvg", () => {
  it("renders level, xp, all five attribute labels, and repo/commit/PR counts", () => {
    const svg = generateStatsSvg(profile);
    expect(svg).toContain("Level 7");
    expect(svg).toContain("XP 850");
    expect(svg).toContain("INTELLIGENCE");
    expect(svg).toContain("CRAFTING");
    expect(svg).toContain("EXPLORATION");
    expect(svg).toContain("AUTOMATION");
    expect(svg).toContain("PROBLEM SOLVING");
    expect(svg).toContain("Repos 12");
    expect(svg).toContain("Commits 300");
  });

  it("stays well under the 50KB budget from spec §6", () => {
    expect(generateStatsSvg(profile).length).toBeLessThan(50_000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/svg/stats.test.ts`
Expected: FAIL — `Cannot find module './stats'`.

- [ ] **Step 3: Write `src/svg/stats.ts`**

```ts
import type { Attributes, DeveloperProfile } from "../types";
import { THEME, escapeXml } from "./theme";

const ATTRIBUTE_ORDER: (keyof Attributes)[] = [
  "intelligence",
  "crafting",
  "exploration",
  "automation",
  "problemSolving",
];

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  intelligence: "INTELLIGENCE",
  crafting: "CRAFTING",
  exploration: "EXPLORATION",
  automation: "AUTOMATION",
  problemSolving: "PROBLEM SOLVING",
};

function renderBar(label: string, value: number, y: number): string {
  const width = 200;
  const filled = Math.round((value / 100) * width);
  return `  <g>
    <text x="20" y="${y}" font-family="${THEME.font}" font-size="11" fill="${THEME.character}">${label}</text>
    <rect x="20" y="${y + 6}" width="${width}" height="8" fill="${THEME.pathBase}"/>
    <rect x="20" y="${y + 6}" width="${filled}" height="8" fill="${THEME.accent}"/>
  </g>`;
}

export function generateStatsSvg(profile: DeveloperProfile): string {
  const bars = ATTRIBUTE_ORDER.map((key, index) =>
    renderBar(ATTRIBUTE_LABELS[key], profile.attributes[key], 34 + index * 30)
  ).join("\n");
  const name = escapeXml(profile.identity.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 220" width="260" height="220" role="img">
  <title>${name} — Stats</title>
  <desc>Level, attributes and GitHub statistics HUD.</desc>
  <rect width="260" height="220" fill="${THEME.background}"/>
  <text x="20" y="18" font-family="${THEME.font}" font-size="13" fill="${THEME.character}">Level ${profile.level} · XP ${profile.xp}</text>
${bars}
  <text x="20" y="200" font-family="${THEME.font}" font-size="10" fill="${THEME.accent}">Repos ${profile.statistics.repositories} · Commits ${profile.statistics.commits} · PRs ${profile.statistics.pullRequests}</text>
</svg>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/svg/stats.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full SVG suite and type-check**

Run: `npm run build && npx vitest run src/svg`
Expected: build exits 0; all `src/svg` tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/svg/stats.ts src/svg/stats.test.ts
git commit -m "feat: add Stats HUD SVG generator"
```

---

### Task 15: README marker application and section builder

**Files:**
- Create: `src/readme/applyMarkers.ts`
- Create: `src/readme/applyMarkers.test.ts`
- Create: `src/readme/sections.ts`
- Create: `src/readme/sections.test.ts`

**Interfaces:**
- Consumes: `DeveloperProfile` from `../types` (Task 2).
- Produces: `applyMarkers(readme: string, sections: Record<string, string>): string` from `./applyMarkers`; `ImageUrls`, `buildImageUrls(baseUrl: string, cacheBust: string): ImageUrls`, `buildSections(profile: DeveloperProfile, images: ImageUrls): Record<string, string>` from `./sections` — Task 16 (pipeline) calls all three by name.

- [ ] **Step 1: Write the failing test for `applyMarkers`**

```ts
// src/readme/applyMarkers.test.ts
import { describe, it, expect } from "vitest";
import { applyMarkers } from "./applyMarkers";

describe("applyMarkers", () => {
  it("replaces content between a marker pair, leaving the rest untouched", () => {
    const readme = [
      "# Ktsu0",
      "",
      "About me, written by hand.",
      "",
      "<!-- RPG:START:STATS -->",
      "old stats",
      "<!-- RPG:END:STATS -->",
      "",
      "More manual text.",
    ].join("\n");

    const result = applyMarkers(readme, { STATS: "new stats" });

    expect(result).toContain("new stats");
    expect(result).not.toContain("old stats");
    expect(result).toContain("About me, written by hand.");
    expect(result).toContain("More manual text.");
  });

  it("updates multiple sections independently", () => {
    const readme = [
      "<!-- RPG:START:A -->x<!-- RPG:END:A -->",
      "<!-- RPG:START:B -->y<!-- RPG:END:B -->",
    ].join("\n");
    const result = applyMarkers(readme, { A: "new-a", B: "new-b" });
    expect(result).toContain("new-a");
    expect(result).toContain("new-b");
  });

  it("throws when a marker pair is missing", () => {
    expect(() => applyMarkers("no markers here", { STATS: "x" })).toThrow(
      /Marker pair not found for section "STATS"/
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/readme/applyMarkers.test.ts`
Expected: FAIL — `Cannot find module './applyMarkers'`.

- [ ] **Step 3: Write `src/readme/applyMarkers.ts`**

```ts
export function applyMarkers(readme: string, sections: Record<string, string>): string {
  let output = readme;
  for (const [key, content] of Object.entries(sections)) {
    const start = `<!-- RPG:START:${key} -->`;
    const end = `<!-- RPG:END:${key} -->`;
    const startIndex = output.indexOf(start);
    const endIndex = output.indexOf(end);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error(`Marker pair not found for section "${key}"`);
    }
    const before = output.slice(0, startIndex + start.length);
    const after = output.slice(endIndex);
    output = `${before}\n${content}\n${after}`;
  }
  return output;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/readme/applyMarkers.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for `sections`**

```ts
// src/readme/sections.test.ts
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
      source: { language: "JavaScript", topics: [], createdAt: "2026-01-21", pushedAt: "2026-01-21" },
    },
  ],
  quests: [],
  achievements: [{ id: "first-quest", name: "First Quest", icon: "🏆", description: "desc", auto: true }],
  bosses: [],
  currentQuest: { objective: "Ship it", statusPercent: 40, nextObjective: "Ship more" },
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
    for (const key of ["HERO", "PROFILE", "INVENTORY", "WORLDMAP", "QUESTS", "BOSSES", "ACHIEVEMENTS", "STATS", "CURRENTQUEST"]) {
      expect(sections).toHaveProperty(key);
    }
  });

  it("embeds the cache-busted image URLs in HERO/WORLDMAP/STATS", () => {
    expect(sections.HERO).toContain("character.svg?v=v1");
    expect(sections.WORLDMAP).toContain("world-map.svg?v=v1");
    expect(sections.STATS).toContain("stats.svg?v=v1");
  });

  it("lists curated projects as quests and achievements", () => {
    expect(sections.QUESTS).toContain("Financeiro");
    expect(sections.ACHIEVEMENTS).toContain("First Quest");
  });

  it("falls back to a placeholder message when bosses are empty", () => {
    expect(sections.BOSSES).toContain("No bosses recorded yet");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/readme/sections.test.ts`
Expected: FAIL — `Cannot find module './sections'`.

- [ ] **Step 7: Write `src/readme/sections.ts`**

```ts
import type { DeveloperProfile } from "../types";

export interface ImageUrls {
  character: string;
  worldMap: string;
  stats: string;
}

export function buildImageUrls(baseUrl: string, cacheBust: string): ImageUrls {
  return {
    character: `${baseUrl}/character.svg?v=${cacheBust}`,
    worldMap: `${baseUrl}/world-map.svg?v=${cacheBust}`,
    stats: `${baseUrl}/stats.svg?v=${cacheBust}`,
  };
}

const STATUS_MARK: Record<string, string> = {
  completed: "✓",
  "in-progress": "→",
  planned: "?",
  blocked: "!",
};

export function buildSections(profile: DeveloperProfile, images: ImageUrls): Record<string, string> {
  const inventory = Array.from(
    new Set(
      profile.projects
        .map((p) => p.source.language)
        .filter((lang): lang is string => Boolean(lang))
    )
  )
    .sort()
    .map((lang) => `\`${lang}\``)
    .join(" ");

  const questLines = profile.quests
    .map((q) => `- [${STATUS_MARK[q.status] ?? "?"}] **${q.name}** — ${q.description}`)
    .join("\n");

  const achievementLines = profile.achievements
    .map((a) => `- ${a.icon} **${a.name}** — ${a.description}`)
    .join("\n");

  const bossLines = profile.bosses
    .map((b) => `- ${b.icon} **${b.name}** — ${b.description}`)
    .join("\n");

  return {
    HERO: `<img src="${images.character}" alt="${profile.identity.name} character" width="400" />`,
    PROFILE: [
      `**${profile.identity.name}**`,
      "",
      `Class: ${profile.identity.class}`,
      `Level: ${profile.level}`,
      `XP: ${profile.xp}`,
    ].join("\n"),
    INVENTORY: inventory.length > 0 ? inventory : "_No technologies detected yet._",
    WORLDMAP: `<img src="${images.worldMap}" alt="World map" width="800" />`,
    QUESTS: questLines.length > 0 ? questLines : "_No quests yet._",
    BOSSES: bossLines.length > 0 ? bossLines : "_No bosses recorded yet._",
    ACHIEVEMENTS: achievementLines.length > 0 ? achievementLines : "_No achievements unlocked yet._",
    STATS: `<img src="${images.stats}" alt="Stats" width="260" />`,
    CURRENTQUEST: [
      `Objective: ${profile.currentQuest.objective}`,
      `Status: ${profile.currentQuest.statusPercent}%`,
      `Next: ${profile.currentQuest.nextObjective}`,
    ].join("\n"),
  };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/readme/sections.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 9: Type-check and run the full readme suite**

Run: `npm run build && npx vitest run src/readme`
Expected: build exits 0; all `src/readme` tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/readme/applyMarkers.ts src/readme/applyMarkers.test.ts src/readme/sections.ts src/readme/sections.test.ts
git commit -m "feat: apply README markers and build per-section content"
```

---

### Task 16: Pipeline orchestrator (`generate()`) with integration test

**Files:**
- Create: `src/pipeline/generate.ts`
- Create: `src/pipeline/generate.test.ts`

**Interfaces:**
- Consumes: `GithubClient` from `../github/types` (Task 3); `collectGithubData` from `../github/collector` (Task 4); `buildProfile` from `../rpg/buildProfile` (Task 11); `generateCharacterSvg` from `../svg/character` (Task 12); `generateWorldMapSvg` from `../svg/worldMap` (Task 13); `generateStatsSvg` from `../svg/stats` (Task 14); `buildSections`, `buildImageUrls` from `../readme/sections` (Task 15); `applyMarkers` from `../readme/applyMarkers` (Task 15); `developer`, `curatedProjects`, `bosses`, `currentQuest` from `../../config/*` (Task 5, Task 7).
- Produces: `GenerateOptions`, `GenerateResult`, `generate(options: GenerateOptions): Promise<GenerateResult>` — Task 17 (`scripts/generate.ts`) calls this by name.

- [ ] **Step 1: Write the failing integration test**

```ts
// src/pipeline/generate.test.ts
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
  "<!-- RPG:START:PROFILE -->",
  "<!-- RPG:END:PROFILE -->",
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
    expect(result.profile.projects[0].category).toBe("starting-grounds");

    const characterSvg = await readFile(path.join(tempDir, "character.svg"), "utf-8");
    expect(characterSvg).toContain("<svg");

    const updatedReadme = await readFile(readmePath, "utf-8");
    expect(updatedReadme).toContain("character.svg?v=test");
    expect(updatedReadme).toContain("Level");
    expect(updatedReadme).toContain("Portfólio Wagner");
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pipeline/generate.test.ts`
Expected: FAIL — `Cannot find module './generate'`.

- [ ] **Step 3: Write `src/pipeline/generate.ts`**

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import type { GithubClient } from "../github/types";
import { collectGithubData } from "../github/collector";
import { buildProfile, type BuildProfileConfig } from "../rpg/buildProfile";
import type { DeveloperProfile } from "../types";
import { generateCharacterSvg } from "../svg/character";
import { generateWorldMapSvg } from "../svg/worldMap";
import { generateStatsSvg } from "../svg/stats";
import { buildSections, buildImageUrls } from "../readme/sections";
import { applyMarkers } from "../readme/applyMarkers";
import { developer } from "../../config/developer";
import { curatedProjects } from "../../config/projects";
import { bosses } from "../../config/bosses";
import { currentQuest } from "../../config/currentQuest";

export interface GenerateOptions {
  client: GithubClient;
  username: string;
  readmePath: string;
  outputDir: string;
  imageBaseUrl: string;
  cacheBust: string;
}

export interface GenerateResult {
  changed: boolean;
  profile: DeveloperProfile;
}

const profileConfig: BuildProfileConfig = {
  developer,
  curatedProjects,
  bosses,
  currentQuest,
};

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const raw = await collectGithubData(options.client, options.username);
  const profile = buildProfile(raw, profileConfig);

  await fs.mkdir(options.outputDir, { recursive: true });
  const characterSvg = generateCharacterSvg(profile);
  const worldMapSvg = generateWorldMapSvg(profile);
  const statsSvg = generateStatsSvg(profile);
  await Promise.all([
    fs.writeFile(path.join(options.outputDir, "character.svg"), characterSvg, "utf-8"),
    fs.writeFile(path.join(options.outputDir, "world-map.svg"), worldMapSvg, "utf-8"),
    fs.writeFile(path.join(options.outputDir, "stats.svg"), statsSvg, "utf-8"),
  ]);

  const images = buildImageUrls(options.imageBaseUrl, options.cacheBust);
  const sections = buildSections(profile, images);
  const originalReadme = await fs.readFile(options.readmePath, "utf-8");
  const updatedReadme = applyMarkers(originalReadme, sections);
  const changed = updatedReadme !== originalReadme;
  if (changed) {
    await fs.writeFile(options.readmePath, updatedReadme, "utf-8");
  }
  return { changed, profile };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pipeline/generate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the entire test suite and type-check**

Run: `npm run build && npm test`
Expected: build exits 0; every test file across `src/` and `config/` passes.

- [ ] **Step 6: Commit**

```bash
git add src/pipeline/generate.ts src/pipeline/generate.test.ts
git commit -m "feat: wire the full pipeline together (collect -> profile -> SVGs -> README)"
```

---

### Task 17: CLI wrapper and local README template

**Files:**
- Create: `scripts/generate.ts`
- Create: `README.template.md`

**Interfaces:**
- Consumes: `generate`, `GenerateOptions` from `../src/pipeline/generate` (Task 16); `createOctokit` from `../src/github/collector` (Task 4); `developer` from `../config/developer` (Task 5).
- Produces: the `npm run generate` CLI entrypoint — Task 18 (GitHub Actions workflow) invokes this via `npm run generate`.

- [ ] **Step 1: Write `README.template.md`**

This is the local mirror of what `Ktsu0/Ktsu0`'s real `README.md` must contain (marker scaffold + example manual content) — used as the default local target for `npm run generate`, and as the starting point to paste into the real profile repo during activation (Task 20).

```md
# Hi, I'm Gabriel Wagner 👋

<!-- RPG:START:HERO -->
<!-- RPG:END:HERO -->

## Character Profile

<!-- RPG:START:PROFILE -->
<!-- RPG:END:PROFILE -->

## Inventory

<!-- RPG:START:INVENTORY -->
<!-- RPG:END:INVENTORY -->

## World Map

<!-- RPG:START:WORLDMAP -->
<!-- RPG:END:WORLDMAP -->

## Quest Log

<!-- RPG:START:QUESTS -->
<!-- RPG:END:QUESTS -->

## Bosses

<!-- RPG:START:BOSSES -->
<!-- RPG:END:BOSSES -->

## Achievements

<!-- RPG:START:ACHIEVEMENTS -->
<!-- RPG:END:ACHIEVEMENTS -->

## GitHub Stats

<!-- RPG:START:STATS -->
<!-- RPG:END:STATS -->

## Current Quest

<!-- RPG:START:CURRENTQUEST -->
<!-- RPG:END:CURRENTQUEST -->

---

_Every developer has a world to build._
```

- [ ] **Step 2: Write `scripts/generate.ts`**

```ts
import path from "node:path";
import { generate } from "../src/pipeline/generate";
import { createOctokit } from "../src/github/collector";
import { developer } from "../config/developer";

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  const readmePath = process.env.RPG_README_PATH ?? path.join(process.cwd(), "README.template.md");
  const outputDir = process.env.RPG_OUTPUT_DIR ?? path.join(process.cwd(), "generated");
  const imageBaseUrl =
    process.env.RPG_IMAGE_BASE_URL ??
    `https://raw.githubusercontent.com/${developer.username}/${developer.username}/main/generated`;
  const cacheBust = process.env.RPG_CACHE_BUST ?? String(Date.now());

  const client = createOctokit(token);
  const result = await generate({
    client,
    username: developer.username,
    readmePath,
    outputDir,
    imageBaseUrl,
    cacheBust,
  });

  console.log(`Profile generated for ${developer.username}. README changed: ${result.changed}`);
  console.log(`Level ${result.profile.level} · XP ${result.profile.xp} · ${result.profile.projects.length} projects`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
```

- [ ] **Step 3: Verify the CLI fails cleanly without a token (no real network call yet)**

Run: `npx tsx scripts/generate.ts`
Expected: exits with code 1 and prints `Error: GITHUB_TOKEN environment variable is required` — confirms the script loads, wires its imports correctly, and fails safely rather than silently.

- [ ] **Step 4: Type-check**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate.ts README.template.md
git commit -m "feat: add generate CLI wrapper and local README template"
```

---

### Task 18: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/update-profile.yml`
- Create: `scripts/workflow.test.ts`

**Interfaces:**
- Consumes: `npm run generate` (Task 17), the (to-be-created, see Task 20) `PROFILE_REPO_TOKEN` repository secret.
- Produces: the daily automation entrypoint — nothing later in this plan imports from it, but Task 20's manual activation steps depend on this file existing exactly as written.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/workflow.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

describe("update-profile workflow", () => {
  it("is valid YAML with a daily cron, workflow_dispatch, and the expected steps", () => {
    const content = readFileSync(".github/workflows/update-profile.yml", "utf-8");
    const doc = parse(content) as any;

    expect(doc.on.schedule[0].cron).toBe("0 6 * * *");
    expect(doc.on.workflow_dispatch).toBeDefined();

    const steps = doc.jobs.update.steps as Array<{ name: string; run?: string }>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Checkout engine repository");
    expect(stepNames).toContain("Checkout profile repository");
    expect(stepNames).toContain("Generate profile");
    expect(stepNames).toContain("Commit and push if changed");

    const generateStep = steps.find((s) => s.name === "Generate profile")!;
    expect(generateStep.run).toBe("npm run generate");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/workflow.test.ts`
Expected: FAIL — `ENOENT` reading `.github/workflows/update-profile.yml`.

- [ ] **Step 3: Write `.github/workflows/update-profile.yml`**

```yaml
name: Update Profile

on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch: {}

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout engine repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Checkout profile repository
        uses: actions/checkout@v4
        with:
          repository: Ktsu0/Ktsu0
          token: ${{ secrets.PROFILE_REPO_TOKEN }}
          path: profile-repo

      - name: Generate profile
        env:
          GITHUB_TOKEN: ${{ secrets.PROFILE_REPO_TOKEN }}
          RPG_README_PATH: ${{ github.workspace }}/profile-repo/README.md
          RPG_OUTPUT_DIR: ${{ github.workspace }}/profile-repo/generated
          RPG_IMAGE_BASE_URL: https://raw.githubusercontent.com/Ktsu0/Ktsu0/main/generated
          RPG_CACHE_BUST: ${{ github.run_id }}
        run: npm run generate

      - name: Commit and push if changed
        working-directory: profile-repo
        run: |
          git config user.name "github-developer-rpg-bot"
          git config user.email "actions@users.noreply.github.com"
          git add README.md generated
          if git diff --cached --quiet; then
            echo "No changes to commit."
          else
            git commit -m "chore: update RPG profile"
            git push
          fi
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/workflow.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/update-profile.yml scripts/workflow.test.ts
git commit -m "feat: add daily GitHub Actions workflow to publish the profile"
```

---

### Task 19: `CLAUDE.md`

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: the project-continuity file loaded automatically by Claude Code in any future session/machine (spec §12).

- [ ] **Step 1: Write `CLAUDE.md`**

```markdown
# GitHub Developer RPG

## O que é este projeto

O perfil GitHub de Gabriel Wagner (`Ktsu0`) é reimaginado como a interface
de um RPG: o usuário é um cavaleiro a cavalo que percorre um mundo onde
repositórios reais viram regiões e quests, commits/PRs/releases viram XP,
e o README do perfil (`Ktsu0/Ktsu0`) é gerado e atualizado automaticamente
a partir de dados reais do GitHub. Este repositório (`github-developer-rpg`)
é o motor: TypeScript + GitHub API + geração de SVG + GitHub Actions — sem
nenhuma lógica de jogo fictícia; tudo deriva de dados reais ou de curadoria
manual explícita em `config/`.

**Spec completo:** `docs/superpowers/specs/2026-08-27-github-developer-rpg-design.md`
— leia antes de propor mudanças de arquitetura ou de identidade visual.

**Plano de implementação do Bloco A:** `docs/superpowers/plans/2026-08-27-github-developer-rpg-bloco-a.md`.

## Decisões já travadas (não reabrir sem o usuário pedir)

- **Personagem final:** um cavaleiro a cavalo, silhueta branca monocromática
  sobre fundo `#0b0f14`, sem armas/armaduras. Ver spec §2.
- **Faseamento:** a fase atual (Bloco A) usa um **emoji** (🧑‍💻) como
  personagem provisório enquanto o pipeline de dados/automação é validado
  sem bugs. O cavaleiro (Bloco B) só entra depois — ver spec §13.
- **Arquitetura cross-repo:** este repositório é o motor; ele escreve no
  repositório de perfil `Ktsu0/Ktsu0` via GitHub Actions + token com escopo
  mínimo (secret `PROFILE_REPO_TOKEN`, nunca hardcoded). Ver spec §3.
- **Categorização de projetos:** híbrida — `config/projects.ts` cura
  projetos com narrativa própria; repositórios não curados viram
  "Uncharted Land" automaticamente. A região "Starting Grounds" (primeiros
  projetos de curso) é uma lista manual fixa, não heurística. Ver spec §5.

## Regras fáceis de esquecer

- **Sem sistema de equipamentos.** Nada de espadas/escudos/armaduras. O
  cavalo é montaria, não item.
- **Sem "%" de skill inventados.** Barras de atributo (0–100) sempre
  derivam de uma fórmula documentada a partir de dados reais
  (`src/rpg/attributes.ts`), nunca de um número chutado.
- **O README não executa JavaScript.** Qualquer interatividade/movimento é
  SVG nativo (SMIL), gerado com antecedência — nunca lógica client-side.
- **Segredos sempre via GitHub Actions Secrets.** Nunca hardcoded no
  código nem commitado em `.env`.
- **Cache-busting obrigatório** nas URLs de imagem do README
  (`?v=<algo que muda a cada execução>`), senão o perfil parece "travado".

## Convenção de pastas

```
config/         curadoria manual (developer, projects, bosses, currentQuest)
src/types.ts    modelo de domínio (DeveloperProfile e afins)
src/github/     coleta de dados reais via GitHub API (Octokit)
src/rpg/        XP, Level, atributos, categorização, achievements
src/svg/        geradores de character.svg / world-map.svg / stats.svg
src/readme/     aplica marcadores <!-- RPG:START:X --> no README
src/pipeline/   orquestra tudo acima (generate(), testável sem rede real)
scripts/        CLI fino que lê env vars e chama src/pipeline
generated/      saída local dos SVGs/README (não é o perfil real)
```

## Como continuar este projeto em outra sessão/máquina

1. Leia este arquivo e o spec (`docs/superpowers/specs/2026-08-27-github-developer-rpg-design.md`).
2. Confira o roadmap na spec §13 para saber em qual bloco/tarefa o projeto está.
3. Rode `npm test` para confirmar que o pipeline ainda passa antes de mudar algo.
4. Bloco B (cavaleiro SVG animado) só começa depois que o Bloco A estiver
   publicando de verdade em `Ktsu0/Ktsu0` sem bugs conhecidos.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add project CLAUDE.md for cross-session/cross-machine continuity"
```

---

### Task 20: Manual activation (not code — requires the user's GitHub account)

This task cannot be executed by an agent alone: it requires creating a credential tied to the user's real GitHub account and pushing to their live profile repository. Treat it as a checklist to hand to the user (or to execute together, with their explicit go-ahead at each credential/push step), not as something to run unattended.

**Files:** none (external GitHub configuration).

- [ ] **Step 1: Ensure `Ktsu0/Ktsu0` exists and has the marker scaffold**

If the repository `Ktsu0/Ktsu0` doesn't exist yet, create it (a GitHub "profile README" repo must have the exact same name as the username). Copy the contents of `README.template.md` (Task 17) into its `README.md` as the starting point, then commit it there directly (this is normal manual editing of the user's own profile repo, not something `github-developer-rpg` touches at this stage).

- [ ] **Step 2: Create a fine-grained Personal Access Token**

In GitHub → Settings → Developer settings → Fine-grained tokens: create a token scoped only to the `Ktsu0/Ktsu0` repository, with **Contents: Read and write** permission. Copy the token value once (it won't be shown again).

- [ ] **Step 3: Add the token as a secret on `github-developer-rpg`**

Push this repository to GitHub (`git remote add origin ...` / `git push -u origin main`) if not already pushed. Then in `github-developer-rpg` → Settings → Secrets and variables → Actions → New repository secret: name it `PROFILE_REPO_TOKEN`, paste the token from Step 2.

- [ ] **Step 4: Trigger the workflow manually and verify**

In `github-developer-rpg` → Actions → "Update Profile" → Run workflow (uses the `workflow_dispatch` trigger from Task 18). Watch the run logs for the "Generate profile" and "Commit and push if changed" steps. Confirm a new commit appears on `Ktsu0/Ktsu0` and that `README.md` there now shows real Level/XP/Quest Log/Stats content between the markers, with the 🧑‍💻 emoji as the character.

- [ ] **Step 5: Confirm the daily cron is live**

No action needed beyond Steps 1–4 — the `schedule: cron: "0 6 * * *"` trigger from Task 18 takes over from here. Optionally note the date of this first successful run in a personal note (not in the repo) so it's easy to confirm a day later that the cron itself fired unattended.

**This completes the Bloco A exit criterion from spec §13:** `Ktsu0/Ktsu0` is live, updating itself daily from real data, with the emoji placeholder character. Bloco B (the horse-rider SVG and its animations) is a separate, later plan.
