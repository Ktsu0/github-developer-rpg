import type { DeveloperProfile } from "../types";
import { xpProgress } from "../rpg/level";
import { THEME, escapeXml } from "./theme";
import { panelBackground, panelChrome, panelGrid, pillBadge } from "./frame";

/**
 * Bloco A placeholder (spec §2.4) — the horse-rider replaces this in Bloco B
 * without changing any consumer of generateCharacterSvg.
 */
export const CHARACTER_PLACEHOLDER_EMOJI = "🧑‍💻";

const WIDTH = 960;
const HEIGHT = 240;

const CODE_FRAGMENTS: { x: number; y: number; text: string; size: number }[] = [
  { x: 760, y: 46, text: "</>", size: 20 },
  { x: 850, y: 72, text: "{ }", size: 18 },
  { x: 900, y: 118, text: "git", size: 14 },
  { x: 790, y: 160, text: "TS", size: 16 },
  { x: 870, y: 196, text: "=>", size: 16 },
  { x: 720, y: 200, text: "01", size: 14 },
];

function renderCodeFragments(): string {
  return CODE_FRAGMENTS.map(
    (f) =>
      `<text x="${f.x}" y="${f.y}" font-family="${THEME.font}" font-size="${f.size}" fill="${THEME.character}" opacity="0.1">${escapeXml(f.text)}</text>`
  ).join("\n  ");
}

function renderBadge(): string {
  const cx = 108;
  const cy = 120;
  return `<circle cx="${cx}" cy="${cy}" r="64" fill="none" stroke="${THEME.accent}" stroke-width="1.5" opacity="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="54" fill="${THEME.background}" stroke="${THEME.character}" stroke-width="2"/>
  <text x="${cx}" y="${cy + 4}" font-size="52" text-anchor="middle" dominant-baseline="middle">${CHARACTER_PLACEHOLDER_EMOJI}</text>`;
}

function renderXpBar(x: number, y: number, width: number, profile: DeveloperProfile): string {
  const progress = xpProgress(profile.xp);
  const filled = Math.round((progress.percent / 100) * width);
  return `<g>
    <text x="${x}" y="${y - 6}" font-family="${THEME.font}" font-size="10" fill="${THEME.accent}">XP ${progress.current} / ${progress.needed} · ${progress.percent}% to next level</text>
    <rect x="${x}" y="${y}" width="${width}" height="10" rx="5" fill="${THEME.pathBase}"/>
    <rect x="${x}" y="${y}" width="${filled}" height="10" rx="5" fill="${THEME.accent}"/>
  </g>`;
}

export function generateCharacterSvg(profile: DeveloperProfile): string {
  const name = escapeXml(profile.identity.name);
  const cls = escapeXml(profile.identity.class);
  const textX = 200;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img">
  <title>${name} — Developer RPG</title>
  <desc>Character portrait placeholder for ${name}, ${cls}, level ${profile.level}.</desc>
  ${panelBackground(WIDTH, HEIGHT)}
  ${panelGrid(WIDTH, HEIGHT)}
  ${renderCodeFragments()}
  ${renderBadge()}
  <text x="${textX}" y="86" font-family="${THEME.font}" font-size="30" font-weight="700" fill="${THEME.character}">${name}</text>
  ${pillBadge(textX, 100, 190, 26, cls.toUpperCase(), THEME.accent, THEME.accent)}
  ${pillBadge(textX + 200, 100, 110, 26, `LEVEL ${profile.level}`, THEME.glow, THEME.glow)}
  ${renderXpBar(textX, 158, 560, profile)}
  <text x="${textX}" y="196" font-family="${THEME.font}" font-size="12" font-style="italic" fill="${THEME.accent}" opacity="0.85">"Every developer has a world to build."</text>
  ${panelChrome(WIDTH, HEIGHT)}
</svg>`;
}
