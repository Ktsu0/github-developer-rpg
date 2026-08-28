import { describe, it, expect } from "vitest";
import { developer } from "./developer";
import { bosses } from "./bosses";
import { currentQuest } from "./currentQuest";

describe("config layer", () => {
  it("defines the developer identity", () => {
    expect(developer.username).toBe("Ktsu0");
    expect(developer.name).toBe("Gabriel Wagner");
    expect(developer.class).toBe("Full Stack Developer");
  });

  it("defines bosses as an array (possibly empty, curated manually)", () => {
    expect(Array.isArray(bosses)).toBe(true);
  });

  it("defines a current quest with a valid status percent", () => {
    expect(currentQuest.statusPercent).toBeGreaterThanOrEqual(0);
    expect(currentQuest.statusPercent).toBeLessThanOrEqual(100);
  });
});
