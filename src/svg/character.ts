import type { DeveloperProfile } from "../types";
import { THEME, escapeXml } from "./theme";

/**
 * Bloco A placeholder (spec §2.4) — the horse-rider replaces this in Bloco B
 * without changing any consumer of generateCharacterSvg.
 */
export const CHARACTER_PLACEHOLDER_EMOJI = "🧑‍💻";

export function generateCharacterSvg(profile: DeveloperProfile): string {
  const name = escapeXml(profile.identity.name);
  const cls = escapeXml(profile.identity.class);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" width="400" height="260" role="img">
  <title>${name} — Developer RPG</title>
  <desc>Character portrait placeholder for ${name}, ${cls}.</desc>
  <rect width="400" height="260" fill="${THEME.background}"/>
  <text x="200" y="110" font-size="72" text-anchor="middle" dominant-baseline="middle">${CHARACTER_PLACEHOLDER_EMOJI}</text>
  <text x="200" y="180" font-family="${THEME.font}" font-size="18" fill="${THEME.character}" text-anchor="middle">${name}</text>
  <text x="200" y="204" font-family="${THEME.font}" font-size="13" fill="${THEME.accent}" text-anchor="middle">${cls} · Level ${profile.level}</text>
</svg>`;
}
