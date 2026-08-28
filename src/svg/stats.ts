import type { Attributes, DeveloperProfile } from "../types";
import { THEME, escapeXml } from "./theme";

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

function renderBar(label: string, value: number, y: number): string {
  const width = 200;
  const filled = Math.round((value / 100) * width);
  return `  <g>
    <text x="20" y="${y}" font-family="${THEME.font}" font-size="11" fill="${THEME.character}">${label}</text>
    <rect x="20" y="${y + 6}" width="${width}" height="8" fill="${THEME.pathBase}"/>
    <rect x="20" y="${y + 6}" width="${filled}" height="8" fill="${THEME.accent}"/>
  </g>`;
}

export function generateStatsSvg(profile: DeveloperProfile): string {
  const bars = ATTRIBUTE_ORDER.map((key, index) =>
    renderBar(ATTRIBUTE_LABELS[key], profile.attributes[key], 34 + index * 30)
  ).join("\n");
  const name = escapeXml(profile.identity.name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 220" width="260" height="220" role="img">
  <title>${name} — Stats</title>
  <desc>Level, attributes and GitHub statistics HUD.</desc>
  <rect width="260" height="220" fill="${THEME.background}"/>
  <text x="20" y="18" font-family="${THEME.font}" font-size="13" fill="${THEME.character}">Level ${profile.level} · XP ${profile.xp}</text>
${bars}
  <text x="20" y="200" font-family="${THEME.font}" font-size="10" fill="${THEME.accent}">Repos ${profile.statistics.repositories} · Commits ${profile.statistics.commits} · PRs ${profile.statistics.pullRequests}</text>
</svg>`;
}
