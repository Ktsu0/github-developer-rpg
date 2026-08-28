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
