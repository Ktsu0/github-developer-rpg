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
  /** github.com/<owner>/<repo> by default, or a curated override (e.g. a live site for a private repo). */
  url: string;
  source: ProjectSource;
}

/** A Quest is the curated subset of Project shown in the Quest Log (spec §4). */
export type Quest = Project;

/**
 * A curated quest with no backing GitHub repo at all (e.g. a private
 * project the collector's token can't see) — hand-authored end to end,
 * including its link. Appears in the Quest Log only, never on the World
 * Map (it has no ProjectSource/region to place there).
 */
export interface ManualQuest {
  name: string;
  description: string;
  status: QuestStatus;
  url: string;
  icon: string;
}

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
  manualQuests: ManualQuest[];
  achievements: Achievement[];
  bosses: Boss[];
  currentQuest: CurrentQuest;
}
