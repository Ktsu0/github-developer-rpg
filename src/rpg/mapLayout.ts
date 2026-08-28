import type { MapNode, Project, ProjectCategory } from "../types";
import type { CategorizedProject } from "./categorize";

/**
 * Positions live inside a ~600px-wide "world zone" (x < 580) — the World
 * Map SVG reserves the strip to the right of that for a compact sidebar
 * list of not-yet-curated ("uncharted") repos instead of pinning them
 * individually, which used to crowd/overlap once there were more than a
 * couple of them (see src/svg/worldMap.ts).
 */
export const BASE_POSITIONS: Record<ProjectCategory, { x: number; y: number }> = {
  "starting-grounds": { x: 90, y: 420 },
  games: { x: 230, y: 110 },
  backend: { x: 420, y: 70 },
  finance: { x: 520, y: 260 },
  team: { x: 170, y: 260 },
  projects: { x: 380, y: 420 },
  uncharted: { x: 700, y: 70 },
};

export const CATEGORY_ICONS: Record<ProjectCategory, string> = {
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
