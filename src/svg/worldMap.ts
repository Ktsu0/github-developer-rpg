import type { DeveloperProfile, Project } from "../types";
import { THEME, escapeXml } from "./theme";
import { CHARACTER_PLACEHOLDER_EMOJI } from "./character";

const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 500;

function renderRegion(project: Project): string {
  const { region } = project;
  const label = escapeXml(region.label);
  return `  <g>
    <text x="${region.x}" y="${region.y}" font-size="20" text-anchor="middle">${region.icon}</text>
    <text x="${region.x}" y="${region.y + 16}" font-family="${THEME.font}" font-size="9" fill="${THEME.accent}" text-anchor="middle">${label}</text>
  </g>`;
}

/** Prefers a curated in-progress quest; falls back to the first curated project (Bloco A simplification, spec §2.4). */
function findCurrentRegion(projects: Project[]): Project | undefined {
  return (
    projects.find((p) => p.curated && p.status === "in-progress") ??
    projects.find((p) => p.curated)
  );
}

export function generateWorldMapSvg(profile: DeveloperProfile): string {
  const regions = profile.projects.map(renderRegion).join("\n");
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
  <rect width="${VIEWBOX_WIDTH}" height="${VIEWBOX_HEIGHT}" fill="${THEME.background}"/>
${regions}
${marker}
</svg>`;
}
