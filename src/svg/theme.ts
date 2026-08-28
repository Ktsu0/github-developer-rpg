export const THEME = {
  background: "#0b0f14",
  character: "#FFFFFF",
  /** Borders, grid lines, unfilled bar segments — NOT for text (too low-contrast to read). */
  pathBase: "#22303a",
  /** Secondary/caption text — readable but de-emphasized against the background. */
  muted: "#5b6b73",
  glow: "#ffb454",
  accent: "#54e0c7",
  font: "monospace",
} as const;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
