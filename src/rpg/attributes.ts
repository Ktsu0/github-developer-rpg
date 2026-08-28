import type { Attributes } from "../types";

export interface AttributeInputs {
  languageCount: number;
  /** Repos with a formal GitHub release OR a live deployed site (homepage set) — either counts as "crafted", not just releases alone. */
  craftedRepos: number;
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
    crafting: scale(inputs.craftedRepos, ATTRIBUTE_CAPS.crafting),
    exploration: scale(inputs.recentLanguageCount, ATTRIBUTE_CAPS.exploration),
    automation: scale(inputs.reposWithWorkflows, ATTRIBUTE_CAPS.automation),
    problemSolving: scale(
      inputs.closedIssues + inputs.mergedPullRequests,
      ATTRIBUTE_CAPS.problemSolving
    ),
  };
}
