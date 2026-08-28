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
