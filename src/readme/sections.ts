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

export function buildSections(profile: DeveloperProfile, images: ImageUrls): Record<string, string> {
  const inventory = Array.from(
    new Set(
      profile.projects
        .map((p) => p.source.language)
        .filter((lang): lang is string => Boolean(lang))
    )
  )
    .sort()
    .map((lang) => `\`${lang}\``)
    .join(" ");

  const questLines = profile.quests
    .map((q) => `- [${STATUS_MARK[q.status] ?? "?"}] **${q.name}** — ${q.description}`)
    .join("\n");

  const achievementLines = profile.achievements
    .map((a) => `- ${a.icon} **${a.name}** — ${a.description}`)
    .join("\n");

  const bossLines = profile.bosses
    .map((b) => `- ${b.icon} **${b.name}** — ${b.description}`)
    .join("\n");

  return {
    HERO: `<img src="${images.character}" alt="${profile.identity.name} character" width="400" />`,
    PROFILE: [
      `**${profile.identity.name}**`,
      "",
      `Class: ${profile.identity.class}`,
      `Level: ${profile.level}`,
      `XP: ${profile.xp}`,
    ].join("\n"),
    INVENTORY: inventory.length > 0 ? inventory : "_No technologies detected yet._",
    WORLDMAP: `<img src="${images.worldMap}" alt="World map" width="800" />`,
    QUESTS: questLines.length > 0 ? questLines : "_No quests yet._",
    BOSSES: bossLines.length > 0 ? bossLines : "_No bosses recorded yet._",
    ACHIEVEMENTS: achievementLines.length > 0 ? achievementLines : "_No achievements unlocked yet._",
    STATS: `<img src="${images.stats}" alt="Stats" width="260" />`,
    CURRENTQUEST: [
      `Objective: ${profile.currentQuest.objective}`,
      `Status: ${profile.currentQuest.statusPercent}%`,
      `Next: ${profile.currentQuest.nextObjective}`,
    ].join("\n"),
  };
}
