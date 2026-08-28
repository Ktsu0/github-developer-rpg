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
