import type { RawRepo } from "../github/types";

/**
 * Frameworks/platforms the language list alone can't show (GitHub's
 * "language" is source-code language, not framework — a React app still
 * reports as "JavaScript"). Each rule fires from real signals only: a
 * GitHub topic the user tagged the repo with, or an actual npm dependency
 * from package.json — never guessed.
 */
interface TechRule {
  label: string;
  topics?: string[];
  dependencies?: string[];
}

const RULES: TechRule[] = [
  { label: "React", topics: ["react", "reactjs"], dependencies: ["react"] },
  { label: "Expo", topics: ["expo"], dependencies: ["expo"] },
  { label: "Firebase", topics: ["firebase"], dependencies: ["firebase", "firebase-admin"] },
  { label: "Supabase", topics: ["supabase"], dependencies: ["@supabase/supabase-js"] },
  { label: "ActivePieces", topics: ["activepieces", "activepiece"] },
  {
    label: "AI",
    topics: ["ai", "ia", "artificial-intelligence", "machine-learning", "llm"],
    dependencies: ["openai", "@anthropic-ai/sdk", "@google/generative-ai", "langchain"],
  },
  {
    label: "API",
    topics: ["api", "rest-api", "graphql"],
    dependencies: ["express", "fastify", "@nestjs/core", "koa", "graphql"],
  },
  {
    label: "Database",
    topics: ["database", "sql", "postgresql", "mongodb"],
    dependencies: ["pg", "mongoose", "mysql2", "@prisma/client", "sequelize", "typeorm"],
  },
];

/** Real, detected tech-stack labels — sorted, deduped, one entry per matching rule. */
export function detectTechStack(repos: RawRepo[]): string[] {
  const found = new Set<string>();
  for (const repo of repos) {
    const topics = new Set(repo.topics.map((t) => t.toLowerCase()));
    const deps = new Set(repo.dependencies.map((d) => d.toLowerCase()));
    for (const rule of RULES) {
      if (found.has(rule.label)) continue;
      const topicHit = rule.topics?.some((t) => topics.has(t)) ?? false;
      const depHit = rule.dependencies?.some((d) => deps.has(d.toLowerCase())) ?? false;
      if (topicHit || depHit) found.add(rule.label);
    }
  }
  return Array.from(found).sort();
}
