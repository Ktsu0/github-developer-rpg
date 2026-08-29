import { describe, it, expect } from "vitest";
import { detectTechStack } from "./techStack";
import type { RawRepo } from "../github/types";

function repo(overrides: Partial<RawRepo>): RawRepo {
  return {
    name: "some-repo",
    description: null,
    fork: false,
    language: "TypeScript",
    topics: [],
    created_at: "2025-01-01T00:00:00Z",
    pushed_at: "2025-01-01T00:00:00Z",
    html_url: "https://github.com/Ktsu0/some-repo",
    homepage: null,
    languages: {},
    releaseCount: 0,
    hasWorkflows: false,
    dependencies: [],
    ...overrides,
  };
}

describe("detectTechStack", () => {
  it("detects a framework from an actual package.json dependency", () => {
    expect(detectTechStack([repo({ dependencies: ["react", "react-dom"] })])).toEqual(["React"]);
  });

  it("detects a platform from a GitHub topic when there's no matching dependency", () => {
    expect(detectTechStack([repo({ topics: ["activepieces"] })])).toEqual(["ActivePieces"]);
  });

  it("aggregates distinct labels across multiple repos without duplicates", () => {
    const repos = [
      repo({ name: "a", dependencies: ["react"] }),
      repo({ name: "b", dependencies: ["firebase"] }),
      repo({ name: "c", topics: ["supabase"] }),
      repo({ name: "d", dependencies: ["react-dom"] }),
    ];
    expect(detectTechStack(repos)).toEqual(["Firebase", "React", "Supabase"]);
  });

  it("returns nothing when no repo has a matching topic or dependency", () => {
    expect(detectTechStack([repo({ dependencies: ["lodash"], topics: ["utility"] })])).toEqual([]);
  });

  it("detects AI and API/Database framework signals from dependencies", () => {
    const repos = [
      repo({ name: "a", dependencies: ["openai"] }),
      repo({ name: "b", dependencies: ["express", "@prisma/client"] }),
    ];
    expect(detectTechStack(repos)).toEqual(["AI", "API", "Database"]);
  });
});
