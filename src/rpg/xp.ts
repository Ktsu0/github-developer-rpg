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
