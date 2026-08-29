import type { DeveloperProfile } from "../types";

export interface ImageUrls {
  character: string;
  worldMap: string;
  stats: string;
}

export function buildImageUrls(baseUrl: string, cacheBust: string): ImageUrls {
  return {
    character: `${baseUrl}/character.svg?v=${cacheBust}`,
    worldMap: `${baseUrl}/world-map.svg?v=${cacheBust}`,
    stats: `${baseUrl}/stats.svg?v=${cacheBust}`,
  };
}

const STATUS_MARK: Record<string, string> = {
  completed: "✓",
  "in-progress": "→",
  planned: "?",
  blocked: "!",
};

/**
 * shields.io "for-the-badge" static badges — colored pills with logos, no
 * JS, just <img> (spec §8/§42). Covers both GitHub-detected languages and
 * the tech-stack labels from src/rpg/techStack.ts (frameworks/platforms a
 * language alone can't show, detected from real topics/dependencies).
 */
const BADGE_STYLES: Record<string, { color: string; logo?: string }> = {
  TypeScript: { color: "3178C6", logo: "typescript" },
  JavaScript: { color: "F7DF1E", logo: "javascript" },
  HTML: { color: "E34F26", logo: "html5" },
  CSS: { color: "1572B6", logo: "css3" },
  SCSS: { color: "CC6699", logo: "sass" },
  GDScript: { color: "478CBF", logo: "godotengine" },
  Python: { color: "3776AB", logo: "python" },
  React: { color: "61DAFB", logo: "react" },
  Expo: { color: "000020", logo: "expo" },
  Firebase: { color: "FFCA28", logo: "firebase" },
  Supabase: { color: "3ECF8E", logo: "supabase" },
  ActivePieces: { color: "6E41E2" },
  AI: { color: "8A2BE2" },
  API: { color: "555555" },
  Database: { color: "336791" },
};

function badge(label: string): string {
  const meta = BADGE_STYLES[label];
  const color = meta?.color ?? "555555";
  const logo = meta?.logo ? `&logo=${meta.logo}&logoColor=white` : "";
  const encoded = encodeURIComponent(label);
  const url = `https://img.shields.io/badge/-${encoded}-${color}?style=for-the-badge${logo}`;
  return `![${label}](${url})`;
}

export function buildSections(profile: DeveloperProfile, images: ImageUrls): Record<string, string> {
  const languages = profile.projects
    .map((p) => p.source.language)
    .filter((lang): lang is string => Boolean(lang));
  const inventory = Array.from(new Set([...languages, ...profile.techStack]))
    .sort()
    .map(badge)
    .join(" ");

  const projectQuestLines = profile.quests.map(
    (q) => `- [${STATUS_MARK[q.status] ?? "?"}] [**${q.name}**](${q.url}) — ${q.description}`
  );
  const manualQuestLines = profile.manualQuests.map(
    (q) => `- [${STATUS_MARK[q.status] ?? "?"}] [**${q.name}**](${q.url}) — ${q.description}`
  );
  const questLines = [...projectQuestLines, ...manualQuestLines].join("\n");

  const achievementLines = profile.achievements
    .map((a) => `- ${a.icon} **${a.name}** — ${a.description}`)
    .join("\n");

  // Bosses (config/bosses.ts, DeveloperProfile.bosses) stays in the data
  // model but isn't rendered — removed from the README on user request
  // until there are real war-stories to curate; re-add a BOSSES key here
  // (and the matching marker in README.template.md) whenever that's ready.

  return {
    HERO: `<img src="${images.character}" alt="${profile.identity.name} — ${profile.identity.class}" width="900" />`,
    INVENTORY: inventory.length > 0 ? inventory : "_No technologies detected yet._",
    WORLDMAP: `<img src="${images.worldMap}" alt="World map" width="800" />`,
    QUESTS: questLines.length > 0 ? questLines : "_No quests yet._",
    ACHIEVEMENTS: achievementLines.length > 0 ? achievementLines : "_No achievements unlocked yet._",
    STATS: `<img src="${images.stats}" alt="Stats" width="320" />`,
    CURRENTQUEST: [
      `Objective: ${profile.currentQuest.objective}`,
      `Status: ${profile.currentQuest.statusPercent}%`,
      `Next: ${profile.currentQuest.nextObjective}`,
    ].join("\n"),
  };
}
