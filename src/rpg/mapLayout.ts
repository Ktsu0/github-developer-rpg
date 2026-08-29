import type { MapNode, Project, ProjectCategory } from "../types";
import type { CategorizedProject } from "./categorize";

/**
 * Positions live inside a ~640px-wide "world zone" (x < 680) — the World
 * Map SVG (900×600) reserves the strip to the right of that for a compact
 * sidebar list of not-yet-curated ("uncharted") repos instead of pinning
 * them individually, which used to crowd/overlap once there were more
 * than a couple of them (see src/svg/worldMap.ts).
 */
export const BASE_POSITIONS: Record<ProjectCategory, { x: number; y: number }> = {
  "starting-grounds": { x: 90, y: 420 },
  games: { x: 80, y: 80 },
  backend: { x: 500, y: 150 },
  finance: { x: 620, y: 480 },
  team: { x: 170, y: 420 },
  projects: { x: 360, y: 460 },
  uncharted: { x: 780, y: 70 },
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

/**
 * Scatters same-category projects around their anchor on a golden-angle
 * spiral instead of stacking them in a straight line — a straight vertical
 * list read as "a list", not "a map" (user feedback). The first project in
 * a category still sits right on the anchor; each following one lands
 * further out at a different angle, like separate settlements dotted
 * across the same territory.
 */
function scatterOffset(index: number): { dx: number; dy: number } {
  if (index === 0) return { dx: 0, dy: 0 };
  const GOLDEN_ANGLE_DEG = 137.5;
  const angle = (index * GOLDEN_ANGLE_DEG * Math.PI) / 180;
  const radius = 36 + index * 34;
  return { dx: Math.round(radius * Math.cos(angle)), dy: Math.round(radius * Math.sin(angle)) };
}

export function assignMapPositions(projects: CategorizedProject[]): Project[] {
  const counters: Partial<Record<ProjectCategory, number>> = {};
  return projects.map((project) => {
    const { icon: iconOverride, ...projectFields } = project;
    const base = BASE_POSITIONS[project.category];
    const index = counters[project.category] ?? 0;
    counters[project.category] = index + 1;
    const { dx, dy } = scatterOffset(index);
    const region: MapNode = {
      id: project.repository,
      label: project.name,
      icon: iconOverride ?? CATEGORY_ICONS[project.category],
      x: Math.min(650, Math.max(40, base.x + dx)),
      y: Math.min(560, Math.max(40, base.y + dy)),
      category: project.category,
    };
    return { ...projectFields, region };
  });
}
