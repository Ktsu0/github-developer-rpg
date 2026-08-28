import type { DeveloperProfile, Project, ProjectCategory } from "../types";
import { BASE_POSITIONS } from "../rpg/mapLayout";
import { THEME, escapeXml } from "./theme";
import { panelBackground, panelChrome, panelGrid, titleBar } from "./frame";
import { CHARACTER_PLACEHOLDER_EMOJI } from "./character";

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 520;
const SIDEBAR_X = 610;
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

/**
 * "starting-grounds" and "uncharted" are deliberately excluded from map
 * pins: the first few course projects were cluttering the map for little
 * payoff (they're already visible in the Quest Log), and uncharted repos
 * get the compact sidebar instead (renderUnchartedSidebar).
 */
const PINNED_CATEGORIES: ProjectCategory[] = ["games", "backend", "finance", "team", "projects"];

/** Roads no longer radiate from "starting-grounds" now that it isn't pinned — a fixed central hub instead. */
const ROAD_HUB = { x: 300, y: 250 };

function renderTerrain(): string {
  return PINNED_CATEGORIES.map((category) => {
    const motif = TERRAIN_MOTIFS[category];
    if (!motif) return "";
    const base = BASE_POSITIONS[category];
    return `<text x="${base.x + 10}" y="${base.y + 6}" font-size="76" text-anchor="middle" opacity="0.06">${motif}</text>`;
  }).join("\n");
}

function renderRoads(): string {
  return PINNED_CATEGORIES.map((category) => {
    const dest = BASE_POSITIONS[category];
    const midX = (ROAD_HUB.x + dest.x) / 2;
    const midY = Math.min(ROAD_HUB.y, dest.y) - 30;
    return `<path d="M${ROAD_HUB.x} ${ROAD_HUB.y} Q${midX} ${midY} ${dest.x} ${dest.y}" fill="none" stroke="${THEME.pathBase}" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.6"/>`;
  }).join("\n");
}

function renderCompassRose(): string {
  const cx = SIDEBAR_X - 40;
  const cy = 56;
  return `<g opacity="0.7">
    <circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${THEME.pathBase}" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy - 18}" x2="${cx}" y2="${cy + 18}" stroke="${THEME.pathBase}" stroke-width="1"/>
    <line x1="${cx - 18}" y1="${cy}" x2="${cx + 18}" y2="${cy}" stroke="${THEME.pathBase}" stroke-width="1"/>
    <path d="M${cx} ${cy - 18} L${cx - 5} ${cy - 6} L${cx + 5} ${cy - 6} Z" fill="${THEME.accent}"/>
    <text x="${cx}" y="${cy - 26}" font-family="${THEME.font}" font-size="9" fill="${THEME.accent}" text-anchor="middle">N</text>
  </g>`;
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
  return `  <g>
    <text x="${region.x}" y="${region.y}" font-size="20" text-anchor="middle">${region.icon}</text>
    <text x="${region.x}" y="${region.y + 16}" font-family="${THEME.font}" font-size="9" fill="${THEME.accent}" text-anchor="middle">${label}</text>
  </g>`;
}

function renderUnchartedSidebar(uncharted: Project[]): string {
  const top = 40;
  const bottom = VIEWBOX_HEIGHT - 40;
  const divider = `<line x1="${SIDEBAR_X - 20}" y1="${top}" x2="${SIDEBAR_X - 20}" y2="${bottom}" stroke="${THEME.pathBase}" stroke-width="1.5"/>`;
  if (uncharted.length === 0) {
    return divider;
  }

  const header = `<text x="${SIDEBAR_X}" y="${top + 20}" font-family="${THEME.font}" font-size="11" fill="${THEME.accent}">🌫️ UNCHARTED LAND</text>
  <text x="${SIDEBAR_X}" y="${top + 36}" font-family="${THEME.font}" font-size="9" fill="${THEME.muted}">${uncharted.length} repositories not yet on the map</text>`;

  const visible = uncharted.slice(0, SIDEBAR_MAX_ROWS);
  const overflow = uncharted.length - visible.length;
  const rowHeight = 22;
  const rows = visible
    .map(
      (project, index) =>
        `<text x="${SIDEBAR_X}" y="${top + 62 + index * rowHeight}" font-family="${THEME.font}" font-size="9" fill="${THEME.character}">· ${escapeXml(shortDisplayName(project))}</text>`
    )
    .join("\n  ");
  const more =
    overflow > 0
      ? `<text x="${SIDEBAR_X}" y="${top + 62 + visible.length * rowHeight}" font-family="${THEME.font}" font-size="9" fill="${THEME.muted}">+${overflow} more</text>`
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
  ${renderTerrain()}
  ${renderRoads()}
  ${titleBar("🗺️", "WORLD MAP")}
  ${renderCompassRose()}
${regions}
${marker}
  ${renderUnchartedSidebar(uncharted)}
  ${panelChrome(VIEWBOX_WIDTH, VIEWBOX_HEIGHT)}
</svg>`;
}
