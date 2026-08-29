import type { DeveloperProfile, Project, ProjectCategory } from "../types";
import { BASE_POSITIONS, CATEGORY_ICONS } from "../rpg/mapLayout";
import { THEME, escapeXml } from "./theme";
import { panelBackground, panelChrome, panelGrid, titleBar } from "./frame";
import { CHARACTER_PLACEHOLDER_EMOJI } from "./character";

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 600;
const SIDEBAR_DIVIDER_X = 680;
const SIDEBAR_X = 700;
const SIDEBAR_MAX_ROWS = 10;
const UNCHARTED_PREFIX = "Uncharted Land — ";

/** Large, low-opacity watermark behind each region cluster — cheap but effective terrain flavor. */
const TERRAIN_MOTIFS: Partial<Record<ProjectCategory, string>> = {
  games: "⛰️",
  backend: "🏰",
  finance: "🏛️",
  team: "🏕️",
  projects: "🏘️",
};

const CATEGORY_LABELS: Partial<Record<ProjectCategory, string>> = {
  games: "Games",
  backend: "Backend",
  finance: "Finanças",
  team: "Time",
  projects: "Projetos",
};

/** One accent color per region — the old design tinted every territory the same teal, which read as one undifferentiated smear rather than distinct places. */
const CATEGORY_COLORS: Partial<Record<ProjectCategory, string>> = {
  games: "#b98cf2",
  backend: "#5b9dd9",
  finance: "#e0b954",
  team: "#6fcf97",
  projects: "#f2994a",
};

/**
 * "starting-grounds" and "uncharted" are deliberately excluded from map
 * pins: the first few course projects were cluttering the map for little
 * payoff (they're already visible in the Quest Log), and uncharted repos
 * get the compact sidebar instead (renderUnchartedSidebar).
 */
const PINNED_CATEGORIES: ProjectCategory[] = ["games", "backend", "finance", "team", "projects"];

/** Roads no longer radiate from "starting-grounds" now that it isn't pinned — a fixed central hub instead. */
const ROAD_HUB = { x: 400, y: 330 };

function categoryColor(category: ProjectCategory): string {
  return CATEGORY_COLORS[category] ?? THEME.accent;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Sutherland-Hodgman polygon clipping against the half-plane closer to
 * `site` than to `other` (i.e. one side of their perpendicular bisector).
 * Applying this once per rival site turns a bounding rectangle into a
 * proper Voronoi cell — the standard small-N way to build one without a
 * full Fortune's-algorithm implementation.
 */
function clipToHalfPlane(polygon: Point[], site: Point, other: Point): Point[] {
  const midX = (site.x + other.x) / 2;
  const midY = (site.y + other.y) / 2;
  const normalX = site.x - other.x;
  const normalY = site.y - other.y;
  const side = (p: Point) => (p.x - midX) * normalX + (p.y - midY) * normalY;

  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const curr = polygon[i]!;
    const prev = polygon[(i - 1 + polygon.length) % polygon.length]!;
    const currSide = side(curr);
    const prevSide = side(prev);
    if (Math.sign(currSide) !== Math.sign(prevSide) && currSide !== 0 && prevSide !== 0) {
      const t = prevSide / (prevSide - currSide);
      output.push({ x: prev.x + t * (curr.x - prev.x), y: prev.y + t * (curr.y - prev.y) });
    }
    if (currSide >= 0) output.push(curr);
  }
  return output;
}

/** The Voronoi cell for `site` among `others`, clipped to `rect` — the region of the rectangle strictly closer to `site` than to any rival. */
function voronoiCell(site: Point, others: Point[], rect: { x0: number; y0: number; x1: number; y1: number }): Point[] {
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

function polygonPoints(polygon: Point[]): string {
  return polygon.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** The full world zone, tiled edge to edge — kingdoms border each other directly, no unclaimed gap between them (user feedback: don't be stingy with space). */
const WORLD_RECT = { x0: 0, y0: 0, x1: SIDEBAR_DIVIDER_X, y1: VIEWBOX_HEIGHT };

/** One Voronoi cell per pinned category, keyed by category — computed once per render and reused for both the fill and the shared border pass. Exported for the tiling-correctness test in worldMap.test.ts. */
export function computeKingdoms(): Map<ProjectCategory, Point[]> {
  const sites = PINNED_CATEGORIES.map((category) => ({ category, point: BASE_POSITIONS[category] }));
  const cells = new Map<ProjectCategory, Point[]>();
  for (const { category, point } of sites) {
    const rivals = sites.filter((s) => s.category !== category).map((s) => s.point);
    cells.set(category, voronoiCell(point, rivals, WORLD_RECT));
  }
  return cells;
}

function renderTerrainMotif(category: ProjectCategory, cx: number, cy: number): string {
  const motif = TERRAIN_MOTIFS[category];
  if (!motif) return "";
  const color = categoryColor(category);
  return `<circle cx="${cx}" cy="${cy}" r="50" fill="${color}" opacity="0.1"/>
  <text x="${cx + 8}" y="${cy + 6}" font-size="82" text-anchor="middle" opacity="0.18">${motif}</text>`;
}

/**
 * Renders the kingdoms as a proper jigsaw: each cell filled solid in its
 * category color with no gap or overlap between neighbors (they share an
 * exact edge by construction), then every border re-stroked once in a
 * neutral tone so two adjacent colors don't fight along the same line.
 */
function renderKingdoms(cells: Map<ProjectCategory, Point[]>): string {
  const fills = PINNED_CATEGORIES.map((category) => {
    const cell = cells.get(category);
    if (!cell || cell.length === 0) return "";
    return `<polygon points="${polygonPoints(cell)}" fill="${categoryColor(category)}" opacity="0.16"/>`;
  }).join("\n  ");
  const borders = PINNED_CATEGORIES.map((category) => {
    const cell = cells.get(category);
    if (!cell || cell.length === 0) return "";
    return `<polygon points="${polygonPoints(cell)}" fill="none" stroke="${THEME.pathBase}" stroke-width="1.5" opacity="0.75"/>`;
  }).join("\n  ");
  const motifs = PINNED_CATEGORIES.map((category) => {
    const base = BASE_POSITIONS[category];
    return renderTerrainMotif(category, base.x, base.y);
  }).join("\n  ");
  return `${fills}\n  ${borders}\n  ${motifs}`;
}

/**
 * Deterministic scatter of faint "unexplored territory" specks — confined
 * to the sidebar strip now that the world zone itself is fully claimed by
 * a kingdom: the fog belongs where the Uncharted Land list already says
 * "not yet on the map", not scattered over land that has an owner.
 */
const AMBIENT_DOTS: { x: number; y: number; r: number }[] = [
  { x: 700, y: 40, r: 1.2 }, { x: 760, y: 50, r: 1 }, { x: 830, y: 45, r: 1.3 },
  { x: 880, y: 90, r: 1 }, { x: 700, y: 470, r: 1.2 }, { x: 760, y: 500, r: 1 },
  { x: 820, y: 480, r: 1.3 }, { x: 870, y: 520, r: 1 }, { x: 700, y: 550, r: 1.1 },
  { x: 850, y: 200, r: 1 }, { x: 810, y: 150, r: 1.2 }, { x: 890, y: 300, r: 1 },
  { x: 720, y: 210, r: 1.1 }, { x: 780, y: 430, r: 1 },
];

function renderAmbientDots(): string {
  return AMBIENT_DOTS.map(
    (d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${THEME.accent}" opacity="0.3"/>`
  ).join("");
}

function renderRoads(): string {
  return PINNED_CATEGORIES.map((category) => {
    const dest = BASE_POSITIONS[category];
    const color = categoryColor(category);
    const midX = (ROAD_HUB.x + dest.x) / 2;
    const midY = Math.min(ROAD_HUB.y, dest.y) - 34;
    return `<path d="M${ROAD_HUB.x} ${ROAD_HUB.y} Q${midX} ${midY} ${dest.x} ${dest.y}" fill="none" stroke="${THEME.pathBase}" stroke-width="1.5" stroke-dasharray="3 6" opacity="0.55"/>
  <circle cx="${midX}" cy="${midY}" r="2.5" fill="${color}" opacity="0.6"/>`;
  }).join("\n");
}

/** Thin connector between markers in the same region — turns a lone dot into a visible settlement chain once a category has more than one project. */
function renderRegionConnectors(pinned: Project[]): string {
  const byCategory = new Map<ProjectCategory, Project[]>();
  for (const project of pinned) {
    const group = byCategory.get(project.category) ?? [];
    group.push(project);
    byCategory.set(project.category, group);
  }
  const lines: string[] = [];
  for (const [category, group] of byCategory) {
    if (group.length < 2) continue;
    const color = categoryColor(category);
    for (let i = 1; i < group.length; i += 1) {
      const a = group[i - 1]!.region;
      const b = group[i]!.region;
      lines.push(
        `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="1" stroke-dasharray="2 3" opacity="0.35"/>`
      );
    }
  }
  return lines.join("\n");
}

function renderCompassRose(): string {
  const cx = SIDEBAR_X + 40;
  const cy = 56;
  return `<g opacity="0.7">
    <circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${THEME.pathBase}" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy - 18}" x2="${cx}" y2="${cy + 18}" stroke="${THEME.pathBase}" stroke-width="1"/>
    <line x1="${cx - 18}" y1="${cy}" x2="${cx + 18}" y2="${cy}" stroke="${THEME.pathBase}" stroke-width="1"/>
    <path d="M${cx} ${cy - 18} L${cx - 5} ${cy - 6} L${cx + 5} ${cy - 6} Z" fill="${THEME.accent}"/>
    <text x="${cx}" y="${cy - 26}" font-family="${THEME.font}" font-size="9" fill="${THEME.accent}" text-anchor="middle">N</text>
  </g>`;
}

/** Color-key mapping each region swatch to its category — decodes the per-region tinting introduced in renderTerritory/renderRegion. */
function renderLegend(): string {
  const x = SIDEBAR_X;
  const top = 100;
  const header = `<text x="${x}" y="${top}" font-family="${THEME.font}" font-size="10" fill="${THEME.muted}" letter-spacing="0.5">REGIONS</text>`;
  const rows = PINNED_CATEGORIES.map((category, index) => {
    const rowY = top + 24 + index * 20;
    const color = categoryColor(category);
    const icon = CATEGORY_ICONS[category];
    const label = CATEGORY_LABELS[category] ?? category;
    return `<rect x="${x}" y="${rowY - 9}" width="10" height="10" rx="2" fill="${color}" opacity="0.75"/>
  <text x="${x + 16}" y="${rowY}" font-family="${THEME.font}" font-size="9" fill="${THEME.character}">${icon} ${label}</text>`;
  }).join("\n  ");
  return `${header}\n  ${rows}`;
}

/** Strips the "Uncharted Land — " framing wherever it's rendered on the map — the fog icon and sidebar header already say "uncharted". */
function shortDisplayName(project: Project): string {
  return project.name.startsWith(UNCHARTED_PREFIX)
    ? project.name.slice(UNCHARTED_PREFIX.length)
    : project.name;
}

function renderRegion(project: Project): string {
  const { region } = project;
  const label = escapeXml(shortDisplayName(project));
  const color = categoryColor(project.category);
  return `  <g>
    <ellipse cx="${region.x}" cy="${region.y + 4}" rx="32" ry="15" fill="${color}" opacity="0.18"/>
    <text x="${region.x}" y="${region.y}" font-size="20" text-anchor="middle">${region.icon}</text>
    <text x="${region.x}" y="${region.y + 16}" font-family="${THEME.font}" font-size="9" fill="${color}" text-anchor="middle">${label}</text>
  </g>`;
}

function renderUnchartedSidebar(uncharted: Project[]): string {
  const top = 240;
  const bottom = VIEWBOX_HEIGHT - 40;
  const divider = `<line x1="${SIDEBAR_DIVIDER_X}" y1="40" x2="${SIDEBAR_DIVIDER_X}" y2="${bottom}" stroke="${THEME.pathBase}" stroke-width="1.5"/>`;
  if (uncharted.length === 0) {
    return divider;
  }

  const header = `<text x="${SIDEBAR_X}" y="${top}" font-family="${THEME.font}" font-size="11" fill="${THEME.accent}">🌫️ UNCHARTED LAND</text>
  <text x="${SIDEBAR_X}" y="${top + 16}" font-family="${THEME.font}" font-size="9" fill="${THEME.muted}">${uncharted.length} repositories not yet on the map</text>`;

  const visible = uncharted.slice(0, SIDEBAR_MAX_ROWS);
  const overflow = uncharted.length - visible.length;
  const rowHeight = 22;
  const rows = visible
    .map(
      (project, index) =>
        `<text x="${SIDEBAR_X}" y="${top + 42 + index * rowHeight}" font-family="${THEME.font}" font-size="9" fill="${THEME.character}">· ${escapeXml(shortDisplayName(project))}</text>`
    )
    .join("\n  ");
  const more =
    overflow > 0
      ? `<text x="${SIDEBAR_X}" y="${top + 42 + visible.length * rowHeight}" font-family="${THEME.font}" font-size="9" fill="${THEME.muted}">+${overflow} more</text>`
      : "";

  return `${divider}
  ${header}
  ${rows}
  ${more}`;
}

/**
 * Prefers a curated in-progress quest; falls back to the first curated
 * project (Bloco A simplification, spec §2.4). Restricted to pinned
 * categories — a marker with no pin under it (starting-grounds, uncharted)
 * would float with no context.
 */
function findCurrentRegion(projects: Project[]): Project | undefined {
  const pinnable = projects.filter((p) => PINNED_CATEGORIES.includes(p.category));
  return (
    pinnable.find((p) => p.curated && p.status === "in-progress") ??
    pinnable.find((p) => p.curated)
  );
}

export function generateWorldMapSvg(profile: DeveloperProfile): string {
  const pinned = profile.projects.filter((p) => PINNED_CATEGORIES.includes(p.category));
  const uncharted = profile.projects.filter((p) => p.category === "uncharted");
  const regions = pinned.map(renderRegion).join("\n");
  const connectors = renderRegionConnectors(pinned);
  const kingdoms = computeKingdoms();
  const current = findCurrentRegion(profile.projects);
  const marker = current
    ? `  <circle cx="${current.region.x}" cy="${current.region.y - 24}" r="9" fill="none" stroke="${THEME.glow}" stroke-width="2">
    <animate attributeName="r" values="7;13;7" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite"/>
  </circle>
  <text x="${current.region.x}" y="${current.region.y - 34}" font-size="18" text-anchor="middle">${CHARACTER_PLACEHOLDER_EMOJI}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" width="${VIEWBOX_WIDTH}" height="${VIEWBOX_HEIGHT}" role="img">
  <title>${escapeXml(profile.identity.name)} — World Map</title>
  <desc>Map of real GitHub repositories grouped into RPG regions.</desc>
  ${panelBackground(VIEWBOX_WIDTH, VIEWBOX_HEIGHT)}
  ${panelGrid(VIEWBOX_WIDTH, VIEWBOX_HEIGHT)}
  ${renderAmbientDots()}
  ${renderKingdoms(kingdoms)}
  ${renderRoads()}
  ${connectors}
  ${titleBar("🗺️", "WORLD MAP")}
  ${renderCompassRose()}
  ${renderLegend()}
${regions}
${marker}
  ${renderUnchartedSidebar(uncharted)}
  ${panelChrome(VIEWBOX_WIDTH, VIEWBOX_HEIGHT)}
</svg>`;
}
