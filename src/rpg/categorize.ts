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
