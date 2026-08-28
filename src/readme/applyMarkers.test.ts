import { describe, it, expect } from "vitest";
import { applyMarkers } from "./applyMarkers";

describe("applyMarkers", () => {
  it("replaces content between a marker pair, leaving the rest untouched", () => {
    const readme = [
      "# Ktsu0",
      "",
      "About me, written by hand.",
      "",
      "<!-- RPG:START:STATS -->",
      "old stats",
      "<!-- RPG:END:STATS -->",
      "",
      "More manual text.",
    ].join("\n");

    const result = applyMarkers(readme, { STATS: "new stats" });

    expect(result).toContain("new stats");
    expect(result).not.toContain("old stats");
    expect(result).toContain("About me, written by hand.");
    expect(result).toContain("More manual text.");
  });

  it("updates multiple sections independently", () => {
    const readme = [
      "<!-- RPG:START:A -->x<!-- RPG:END:A -->",
      "<!-- RPG:START:B -->y<!-- RPG:END:B -->",
    ].join("\n");
    const result = applyMarkers(readme, { A: "new-a", B: "new-b" });
    expect(result).toContain("new-a");
    expect(result).toContain("new-b");
  });

  it("throws when a marker pair is missing", () => {
    expect(() => applyMarkers("no markers here", { STATS: "x" })).toThrow(
      /Marker pair not found for section "STATS"/
    );
  });
});
