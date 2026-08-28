import { describe, it, expect } from "vitest";
import { panelChrome, pillBadge, segmentedBar, titleBar } from "./frame";

describe("panelChrome", () => {
  it("draws four corner brackets sized to the panel", () => {
    const chrome = panelChrome(300, 200);
    expect(chrome).toContain("M16 1 L1 1 L1 16");
    expect((chrome.match(/<path/g) ?? []).length).toBe(4);
  });
});

describe("titleBar", () => {
  it("renders the icon and label together", () => {
    expect(titleBar("📊", "STATS")).toContain("📊 STATS");
  });
});

describe("pillBadge", () => {
  it("centers the label text within the pill", () => {
    const pill = pillBadge(10, 10, 100, 24, "LEVEL 5", "#ffb454", "#ffb454");
    expect(pill).toContain("LEVEL 5");
    expect(pill).toContain('text-anchor="middle"');
  });
});

describe("segmentedBar", () => {
  it("fills roughly value% of the segments", () => {
    const bar = segmentedBar(0, 0, 50, 10);
    const segments = bar.match(/<rect/g) ?? [];
    expect(segments).toHaveLength(10);
  });

  it("fills zero segments at 0", () => {
    const bar = segmentedBar(0, 0, 0, 10);
    expect(bar).not.toContain("#54e0c7");
  });

  it("fills all segments at 100", () => {
    const bar = segmentedBar(0, 0, 100, 4);
    expect((bar.match(/#54e0c7/g) ?? []).length).toBe(4);
  });
});
