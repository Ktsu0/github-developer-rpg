export const THEME = {
  background: "#0b0f14",
  character: "#FFFFFF",
  pathBase: "#22303a",
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
