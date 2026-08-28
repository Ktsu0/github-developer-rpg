import { promises as fs } from "node:fs";
import path from "node:path";
import type { GithubClient } from "../github/types";
import { collectGithubData } from "../github/collector";
import { buildProfile, type BuildProfileConfig } from "../rpg/buildProfile";
import type { DeveloperProfile } from "../types";
import { generateCharacterSvg } from "../svg/character";
import { generateWorldMapSvg } from "../svg/worldMap";
import { generateStatsSvg } from "../svg/stats";
import { buildSections, buildImageUrls } from "../readme/sections";
import { applyMarkers } from "../readme/applyMarkers";
import { developer } from "../../config/developer";
import { curatedProjects, manualQuests } from "../../config/projects";
import { bosses } from "../../config/bosses";
import { currentQuest } from "../../config/currentQuest";

export interface GenerateOptions {
  client: GithubClient;
  username: string;
  readmePath: string;
  outputDir: string;
  imageBaseUrl: string;
  cacheBust: string;
}

export interface GenerateResult {
  changed: boolean;
  profile: DeveloperProfile;
}

const profileConfig: BuildProfileConfig = {
  developer,
  curatedProjects,
  manualQuests,
  bosses,
  currentQuest,
};

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const raw = await collectGithubData(options.client, options.username);
  const profile = buildProfile(raw, profileConfig);

  await fs.mkdir(options.outputDir, { recursive: true });
  const characterSvg = generateCharacterSvg(profile);
  const worldMapSvg = generateWorldMapSvg(profile);
  const statsSvg = generateStatsSvg(profile);
  await Promise.all([
    fs.writeFile(path.join(options.outputDir, "character.svg"), characterSvg, "utf-8"),
    fs.writeFile(path.join(options.outputDir, "world-map.svg"), worldMapSvg, "utf-8"),
    fs.writeFile(path.join(options.outputDir, "stats.svg"), statsSvg, "utf-8"),
  ]);

  const images = buildImageUrls(options.imageBaseUrl, options.cacheBust);
  const sections = buildSections(profile, images);
  const originalReadme = await fs.readFile(options.readmePath, "utf-8");
  const updatedReadme = applyMarkers(originalReadme, sections);
  const changed = updatedReadme !== originalReadme;
  if (changed) {
    await fs.writeFile(options.readmePath, updatedReadme, "utf-8");
  }
  return { changed, profile };
}
