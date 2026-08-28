import { describe, it, expect } from "vitest";
import { THEME, escapeXml } from "./theme";

describe("theme", () => {
  it("exposes the palette locked in spec §2.2", () => {
    expect(THEME.background).toBe("#0b0f14");
    expect(THEME.character).toBe("#FFFFFF");
    expect(THEME.glow).toBe("#ffb454");
    expect(THEME.accent).toBe("#54e0c7");
  });
});

describe("escapeXml", () => {
  it("escapes XML-significant characters", () => {
    expect(escapeXml(`R&D <Team> "quotes" 'apos'`)).toBe(
      "R&amp;D &lt;Team&gt; &quot;quotes&quot; &apos;apos&apos;"
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeXml("Gabriel Wagner")).toBe("Gabriel Wagner");
  });
});
