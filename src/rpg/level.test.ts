import { describe, it, expect } from "vitest";
import { calculateLevel } from "./level";

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
