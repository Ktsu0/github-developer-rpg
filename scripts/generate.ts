import path from "node:path";
import { generate } from "../src/pipeline/generate";
import { createOctokit } from "../src/github/collector";
import { developer } from "../config/developer";

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  const readmePath = process.env.RPG_README_PATH ?? path.join(process.cwd(), "README.template.md");
  const outputDir = process.env.RPG_OUTPUT_DIR ?? path.join(process.cwd(), "generated");
  const imageBaseUrl =
    process.env.RPG_IMAGE_BASE_URL ??
    `https://raw.githubusercontent.com/${developer.username}/${developer.username}/main/generated`;
  const cacheBust = process.env.RPG_CACHE_BUST ?? String(Date.now());

  const client = createOctokit(token);
  const result = await generate({
    client,
    username: developer.username,
    readmePath,
    outputDir,
    imageBaseUrl,
    cacheBust,
  });

  console.log(`Profile generated for ${developer.username}. README changed: ${result.changed}`);
  console.log(`Level ${result.profile.level} · XP ${result.profile.xp} · ${result.profile.projects.length} projects`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
