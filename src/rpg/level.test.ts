import { describe, it, expect } from "vitest";
import { calculateLevel, xpProgress } from "./level";

describe("calculateLevel", () => {
  it("is level 1 at zero XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("follows the floor(1 + sqrt(xp/40)) curve from spec §7", () => {
    expect(calculateLevel(40)).toBe(2);
    expect(calculateLevel(360)).toBe(4);
    expect(calculateLevel(1000)).toBe(6);
  });

  it("never returns a level below 1", () => {
    expect(calculateLevel(-100)).toBeGreaterThanOrEqual(1);
  });
});

describe("xpProgress", () => {
  it("is 0% right at the start of a level", () => {
    expect(xpProgress(40)).toEqual({ current: 0, needed: 120, percent: 0 });
  });

  it("is 50% halfway through a level", () => {
    expect(xpProgress(100)).toEqual({ current: 60, needed: 120, percent: 50 });
  });

  it("never exceeds 100%", () => {
    expect(xpProgress(0).percent).toBeLessThanOrEqual(100);
    expect(xpProgress(999999).percent).toBeLessThanOrEqual(100);
  });
});
