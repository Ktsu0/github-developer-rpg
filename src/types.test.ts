import { describe, it, expect } from "vitest";
import type { DeveloperProfile, ProjectCategory } from "./types";

describe("domain types", () => {
  it("accepts a fully-formed DeveloperProfile shape", () => {
    const category: ProjectCategory = "starting-grounds";
    const profile: DeveloperProfile = {
      identity: { username: "Ktsu0", name: "Gabriel Wagner", class: "Full Stack Developer" },
      level: 1,
      xp: 0,
      attributes: {
        intelligence: 0,
        crafting: 0,
        exploration: 0,
        automation: 0,
        problemSolving: 0,
      },
      statistics: {
        repositories: 0,
        commits: 0,
        pullRequests: 0,
        issues: 0,
        releases: 0,
        contributions: 0,
      },
      projects: [],
      quests: [],
      achievements: [],
      bosses: [],
      currentQuest: {
        objective: "Build useful software from ideas.",
        statusPercent: 0,
        nextObjective: "Create something worth remembering.",
      },
    };
    expect(profile.identity.username).toBe("Ktsu0");
    expect(category).toBe("starting-grounds");
  });
});
