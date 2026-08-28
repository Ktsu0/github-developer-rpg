import { describe, it, expect } from "vitest";
import { RawRepoSchema, RawUserSchema } from "./types";

describe("GitHub raw schemas", () => {
  it("parses a valid repo payload", () => {
    const parsed = RawRepoSchema.parse({
      name: "portifolio_wagner",
      description: null,
      fork: false,
      language: "CSS",
      topics: [],
      created_at: "2025-04-10T00:00:00Z",
      pushed_at: "2025-04-10T00:00:00Z",
      html_url: "https://github.com/Ktsu0/portifolio_wagner",
    });
    expect(parsed.name).toBe("portifolio_wagner");
    expect(parsed.topics).toEqual([]);
  });

  it("defaults topics to an empty array when missing", () => {
    const parsed = RawRepoSchema.parse({
      name: "x",
      description: null,
      fork: true,
      language: null,
      created_at: "2025-01-01T00:00:00Z",
      pushed_at: "2025-01-01T00:00:00Z",
      html_url: "https://github.com/Ktsu0/x",
    });
    expect(parsed.topics).toEqual([]);
  });

  it("rejects a payload missing required fields", () => {
    expect(() => RawUserSchema.parse({ login: "Ktsu0" })).toThrow();
  });
});
