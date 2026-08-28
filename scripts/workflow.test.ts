import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

describe("update-profile workflow", () => {
  it("is valid YAML with a daily cron, workflow_dispatch, and the expected steps", () => {
    const content = readFileSync(".github/workflows/update-profile.yml", "utf-8");
    const doc = parse(content) as any;

    expect(doc.on.schedule[0].cron).toBe("0 6 * * *");
    expect(doc.on.workflow_dispatch).toBeDefined();

    const steps = doc.jobs.update.steps as Array<{ name: string; run?: string }>;
    const stepNames = steps.map((s) => s.name);
    expect(stepNames).toContain("Checkout engine repository");
    expect(stepNames).toContain("Checkout profile repository");
    expect(stepNames).toContain("Generate profile");
    expect(stepNames).toContain("Commit and push if changed");

    const generateStep = steps.find((s) => s.name === "Generate profile")!;
    expect(generateStep.run).toBe("npm run generate");
  });
});
