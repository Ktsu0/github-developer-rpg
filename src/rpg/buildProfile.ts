import type { RawGithubData } from "../github/types";
import type {
  Boss,
  CurrentQuest,
  DeveloperConfig,
  DeveloperProfile,
  ManualQuest,
  Statistics,
} from "../types";
import { categorizeRepo, type CuratedProject } from "./categorize";
import { assignMapPositions } from "./mapLayout";
import { calculateXp } from "./xp";
import { calculateLevel } from "./level";
import { calculateAttributes } from "./attributes";
import { calculateAchievements } from "./achievements";
import { detectTechStack } from "./techStack";

export interface BuildProfileConfig {
  developer: DeveloperConfig;
  curatedProjects: CuratedProject[];
  manualQuests: ManualQuest[];
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

  const manualCompletedQuests = config.manualQuests.filter((q) => q.status === "completed").length;
  const completedQuests = quests.filter((q) => q.status === "completed").length + manualCompletedQuests;
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
  let craftedRepos = 0;
  let reposWithWorkflows = 0;
  for (const repo of raw.repos) {
    for (const lang of Object.keys(repo.languages)) {
      allLanguages.add(lang);
      if (new Date(repo.pushed_at) >= sixMonthsAgo) recentLanguages.add(lang);
    }
    // "Crafted" = shipped somehow: a formal release, or a live deployed
    // site — a repo can earn credit either way, not releases alone.
    if (repo.releaseCount > 0 || repo.homepage) craftedRepos += 1;
    if (repo.hasWorkflows) reposWithWorkflows += 1;
  }

  const attributes = calculateAttributes({
    languageCount: allLanguages.size,
    craftedRepos,
    totalRepos: raw.repos.length,
    recentLanguageCount: recentLanguages.size,
    reposWithWorkflows,
    closedIssues: raw.closedIssues,
    mergedPullRequests: raw.mergedPullRequests,
  });

  const achievements = calculateAchievements(statistics, quests.length + config.manualQuests.length);
  const techStack = detectTechStack(raw.repos);

  return {
    identity: config.developer,
    level,
    xp,
    attributes,
    statistics,
    projects,
    quests,
    manualQuests: config.manualQuests,
    achievements,
    bosses: config.bosses,
    currentQuest: config.currentQuest,
    techStack,
  };
}
