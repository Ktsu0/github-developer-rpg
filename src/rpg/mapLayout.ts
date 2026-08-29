import type { MapNode, Project, ProjectCategory } from "../types";
import type { CategorizedProject } from "./categorize";

/** The World Map SVG's canvas (src/svg/worldMap.ts) — the source of truth here since kingdom geometry below has to match the rendered viewBox exactly. */
export const VIEWBOX_WIDTH = 900;
export const VIEWBOX_HEIGHT = 600;
/** World zone is everything left of this x — the strip to the right is the World Map's "uncharted" sidebar, never claimed by a kingdom. */
export const SIDEBAR_DIVIDER_X = 680;

/**
 * One anchor ("capital") per category — also the site each kingdom's
 * Voronoi cell (see computeKingdoms below) grows outward from.
 */
export const BASE_POSITIONS: Record<ProjectCategory, { x: number; y: number }> = {
  "starting-grounds": { x: 90, y: 420 },
  games: { x: 150, y: 190 },
  backend: { x: 500, y: 150 },
  finance: { x: 600, y: 460 },
  team: { x: 150, y: 460 },
  projects: { x: 380, y: 420 },
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
 * "starting-grounds" and "uncharted" are deliberately excluded from map
 * pins: the first few course projects were cluttering the map for little
 * payoff (they're already visible in the Quest Log), and uncharted repos
 * get the compact sidebar instead (src/svg/worldMap.ts).
 */
export const PINNED_CATEGORIES: ProjectCategory[] = ["games", "backend", "finance", "team", "projects"];

/**
 * Relative "claim strength" per kingdom (radius-squared units — see
 * bisectorLine) — a plain Voronoi diagram only lets territory size follow
 * anchor spacing, with no direct way to say "Projetos should be bigger" or
 * "Finanças should be smaller" (user feedback). Higher weight pushes a
 * kingdom's shared borders outward into its neighbors' space.
 */
const CATEGORY_WEIGHTS: Partial<Record<ProjectCategory, number>> = {
  games: 18000,
  backend: 22500,
  finance: 16000,
  team: 24000,
  projects: 42000,
};

export interface Point {
  x: number;
  y: number;
}

interface WeightedSite extends Point {
  weight: number;
}

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The full world zone, tiled edge to edge — kingdoms border each other directly, no unclaimed gap between them (user feedback: don't be stingy with space). */
const WORLD_RECT: Rect = { x0: 0, y0: 0, x1: SIDEBAR_DIVIDER_X, y1: VIEWBOX_HEIGHT };

/**
 * The (weighted) perpendicular-bisector line between two sites, as a point
 * on the line plus its normal direction. Still perpendicular to the line
 * joining the sites (so it's a straight cut) — a higher site weight just
 * shifts the line's position along that segment toward the rival, which is
 * what makes per-kingdom size directly controllable via CATEGORY_WEIGHTS
 * instead of only via anchor spacing (additively-weighted Voronoi / power
 * diagram).
 */
function bisectorLine(site: WeightedSite, other: WeightedSite): { midX: number; midY: number; normalX: number; normalY: number } {
  const dx = other.x - site.x;
  const dy = other.y - site.y;
  const dist2 = dx * dx + dy * dy;
  const t = dist2 === 0 ? 0.5 : 0.5 + (site.weight - other.weight) / (2 * dist2);
  return { midX: site.x + t * dx, midY: site.y + t * dy, normalX: site.x - other.x, normalY: site.y - other.y };
}

/**
 * Sutherland-Hodgman polygon clipping against the half-plane closer to
 * `site` than to `other`. Applying this once per rival site turns a
 * bounding rectangle into a proper cell — the standard small-N way to
 * build a Voronoi diagram without a full Fortune's-algorithm
 * implementation.
 */
function clipToHalfPlane(polygon: Point[], site: WeightedSite, other: WeightedSite): Point[] {
  const { midX, midY, normalX, normalY } = bisectorLine(site, other);
  const side = (p: Point) => (p.x - midX) * normalX + (p.y - midY) * normalY;

  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const curr = polygon[i]!;
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]!;
    const currSide = side(curr);
    const prevSide = side(prev);
    if (Math.sign(currSide) !== Math.sign(prevSide) && currSide !== 0 && prevSide !== 0) {
      const s = prevSide / (prevSide - currSide);
      output.push({ x: prev.x + s * (curr.x - prev.x), y: prev.y + s * (curr.y - prev.y) });
    }
    if (currSide >= 0) output.push(curr);
  }
  return output;
}

/** The weighted-Voronoi cell for `site` among `others`, clipped to `rect` — the region of the rectangle claimed by `site` under CATEGORY_WEIGHTS. */
function voronoiCell(site: WeightedSite, others: WeightedSite[], rect: Rect): Point[] {
  let polygon: Point[] = [
    { x: rect.x0, y: rect.y0 },
    { x: rect.x1, y: rect.y0 },
    { x: rect.x1, y: rect.y1 },
    { x: rect.x0, y: rect.y1 },
  ];
  for (const other of others) {
    if (polygon.length === 0) break;
    polygon = clipToHalfPlane(polygon, site, other);
  }
  return polygon;
}

function weightedSites(): (WeightedSite & { category: ProjectCategory })[] {
  return PINNED_CATEGORIES.map((category) => ({
    category,
    ...BASE_POSITIONS[category],
    weight: CATEGORY_WEIGHTS[category] ?? 22500,
  }));
}

/** One weighted-Voronoi cell per pinned category, keyed by category — computed once per render and reused for both the World Map's fill/border pass and the marker-placement safety check below. */
export function computeKingdoms(): Map<ProjectCategory, Point[]> {
  const sites = weightedSites();
  const cells = new Map<ProjectCategory, Point[]>();
  for (const site of sites) {
    const rivals = sites.filter((s) => s.category !== site.category);
    cells.set(site.category, voronoiCell(site, rivals, WORLD_RECT));
  }
  return cells;
}

/**
 * The radius of the largest disk centered on a category's anchor that is
 * guaranteed to stay entirely inside its own (convex) kingdom cell — the
 * minimum distance from the anchor to the world-rect edges and to every
 * rival's bisector line. Any scattered marker placed within this radius
 * of the anchor is mathematically guaranteed to render on its own
 * kingdom's color, never a neighbor's — this is what actually fixes
 * "PlantaGamer sitting on the border between two colors" rather than
 * hand-tuning coordinates and hoping.
 */
function safeScatterRadius(category: ProjectCategory): number {
  const sites = weightedSites();
  const site = sites.find((s) => s.category === category);
  if (!site) return 0;
  const rivals = sites.filter((s) => s.category !== category);
  let radius = Math.min(
    site.x - WORLD_RECT.x0,
    WORLD_RECT.x1 - site.x,
    site.y - WORLD_RECT.y0,
    WORLD_RECT.y1 - site.y
  );
  for (const other of rivals) {
    const { midX, midY, normalX, normalY } = bisectorLine(site, other);
    const normalLength = Math.hypot(normalX, normalY);
    if (normalLength === 0) continue;
    const distanceToLine = ((site.x - midX) * normalX + (site.y - midY) * normalY) / normalLength;
    radius = Math.min(radius, distanceToLine);
  }
  return Math.max(0, radius);
}

/** Half-width of a rendered marker (ground ellipse + the longest project labels) — kept clear of a kingdom's edge so the whole marker renders on its own color, not just its center point. */
const MARKER_MARGIN = 55;

/**
 * Scatters same-category projects around their anchor on a golden-angle
 * spiral instead of stacking them in a straight line — a straight vertical
 * list read as "a list", not "a map" (user feedback). The first project in
 * a category still sits right on the anchor; each following one lands
 * further out at a different angle, capped at this kingdom's own safe
 * scatter radius so it can never cross into a neighboring kingdom's color.
 */
function scatterOffset(index: number, maxRadius: number): { dx: number; dy: number } {
  if (index === 0) return { dx: 0, dy: 0 };
  const GOLDEN_ANGLE_DEG = 137.5;
  const angle = (index * GOLDEN_ANGLE_DEG * Math.PI) / 180;
  const radius = Math.min(36 + index * 34, maxRadius);
  return { dx: Math.round(radius * Math.cos(angle)), dy: Math.round(radius * Math.sin(angle)) };
}

export function assignMapPositions(projects: CategorizedProject[]): Project[] {
  const counters: Partial<Record<ProjectCategory, number>> = {};
  const safeRadiusCache = new Map<ProjectCategory, number>();
  return projects.map((project) => {
    const { icon: iconOverride, ...projectFields } = project;
    const base = BASE_POSITIONS[project.category];
    const index = counters[project.category] ?? 0;
    counters[project.category] = index + 1;

    let maxRadius = Infinity;
    if (PINNED_CATEGORIES.includes(project.category)) {
      if (!safeRadiusCache.has(project.category)) {
        safeRadiusCache.set(project.category, Math.max(0, safeScatterRadius(project.category) - MARKER_MARGIN));
      }
      maxRadius = safeRadiusCache.get(project.category)!;
    }
    const { dx, dy } = scatterOffset(index, maxRadius);
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
