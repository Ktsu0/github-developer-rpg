import type { Attributes, DeveloperProfile } from "../types";
import { xpProgress } from "../rpg/level";
import { THEME, escapeXml } from "./theme";
import { panelBackground, panelChrome, panelGrid, segmentedBar, titleBar } from "./frame";

const WIDTH = 320;
const HEIGHT = 320;
const MEDALLION_CX = 44;
const MEDALLION_CY = 68;
const ATTRIBUTES_TOP = 124;
const ATTRIBUTE_ROW_HEIGHT = 30;

const ATTRIBUTE_ORDER: (keyof Attributes)[] = [
  "intelligence",
  "crafting",
  "exploration",
  "automation",
  "problemSolving",
];

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  intelligence: "INTELLIGENCE",
  crafting: "CRAFTING",
  exploration: "EXPLORATION",
  automation: "AUTOMATION",
  problemSolving: "PROBLEM SOLVING",
};

const ATTRIBUTE_ICONS: Record<keyof Attributes, string> = {
  intelligence: "🧠",
  crafting: "🛠️",
  exploration: "🧭",
  automation: "⚙️",
  problemSolving: "🐞",
};

function renderLevelMedallion(level: number): string {
  return `<circle cx="${MEDALLION_CX}" cy="${MEDALLION_CY}" r="30" fill="none" stroke="${THEME.glow}" stroke-width="1.5" opacity="0.6"/>
  <circle cx="${MEDALLION_CX}" cy="${MEDALLION_CY}" r="24" fill="${THEME.background}" stroke="${THEME.character}" stroke-width="1.5"/>
  <text x="${MEDALLION_CX}" y="${MEDALLION_CY - 3}" font-family="${THEME.font}" font-size="9" fill="${THEME.glow}" text-anchor="middle">LEVEL</text>
  <text x="${MEDALLION_CX}" y="${MEDALLION_CY + 15}" font-family="${THEME.font}" font-size="18" font-weight="700" fill="${THEME.character}" text-anchor="middle">${level}</text>`;
}

function renderXpLine(profile: DeveloperProfile): string {
  const progress = xpProgress(profile.xp);
  const x = 90;
  return `<text x="${x}" y="${MEDALLION_CY - 12}" font-family="${THEME.font}" font-size="11" fill="${THEME.character}">XP ${profile.xp}</text>
  <text x="${x}" y="${MEDALLION_CY + 4}" font-family="${THEME.font}" font-size="9" fill="${THEME.accent}">${progress.current}/${progress.needed} to next level (${progress.percent}%)</text>`;
}

function renderAttributeRow(key: keyof Attributes, value: number, y: number): string {
  return `  <g>
    <text x="20" y="${y}" font-family="${THEME.font}" font-size="10" fill="${THEME.character}">${ATTRIBUTE_ICONS[key]} ${ATTRIBUTE_LABELS[key]}</text>
    ${segmentedBar(20, y + 6, value, 10, 14, 3)}
  </g>`;
}

export function generateStatsSvg(profile: DeveloperProfile): string {
  const bars = ATTRIBUTE_ORDER.map((key, index) =>
    renderAttributeRow(key, profile.attributes[key], ATTRIBUTES_TOP + index * ATTRIBUTE_ROW_HEIGHT)
  ).join("\n");
  const dividerY = ATTRIBUTES_TOP + ATTRIBUTE_ORDER.length * ATTRIBUTE_ROW_HEIGHT;
  const name = escapeXml(profile.identity.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img">
  <title>${name} — Stats</title>
  <desc>Level, attributes and GitHub statistics HUD.</desc>
  ${panelBackground(WIDTH, HEIGHT)}
  ${panelGrid(WIDTH, HEIGHT, 30)}
  ${titleBar("📊", "STATS")}
  ${renderLevelMedallion(profile.level)}
  ${renderXpLine(profile)}
${bars}
  <line x1="20" y1="${dividerY}" x2="${WIDTH - 20}" y2="${dividerY}" stroke="${THEME.pathBase}" stroke-width="1"/>
  <text x="20" y="${dividerY + 22}" font-family="${THEME.font}" font-size="10" fill="${THEME.accent}">📦 ${profile.statistics.repositories}  💾 ${profile.statistics.commits}  🔀 ${profile.statistics.pullRequests}  🚀 ${profile.statistics.releases}</text>
  ${panelChrome(WIDTH, HEIGHT)}
</svg>`;
}
