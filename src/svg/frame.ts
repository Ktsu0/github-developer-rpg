import { THEME } from "./theme";

/**
 * Shared "HUD panel" chrome reused by every generated SVG: a rounded
 * border, four corner accent brackets, and a faint background grid — the
 * visual signature tying character/world-map/stats together (spec §63:
 * terminal/sci-fi, minimalist, no neon overload).
 */
export function panelBackground(width: number, height: number): string {
  return `<rect width="${width}" height="${height}" fill="${THEME.background}"/>`;
}

export function panelGrid(width: number, height: number, step = 40): string {
  let lines = "";
  for (let x = step; x < width; x += step) {
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="${THEME.pathBase}" stroke-width="1" opacity="0.25"/>`;
  }
  for (let y = step; y < height; y += step) {
    lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${THEME.pathBase}" stroke-width="1" opacity="0.18"/>`;
  }
  return `<g>${lines}</g>`;
}

export function panelChrome(width: number, height: number, corner = 16): string {
  const r = 14;
  return `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${r}" fill="none" stroke="${THEME.pathBase}" stroke-width="1.5"/>
  <path d="M${corner} 1 L1 1 L1 ${corner}" fill="none" stroke="${THEME.accent}" stroke-width="2"/>
  <path d="M${width - corner} 1 L${width - 1} 1 L${width - 1} ${corner}" fill="none" stroke="${THEME.accent}" stroke-width="2"/>
  <path d="M${corner} ${height - 1} L1 ${height - 1} L1 ${height - corner}" fill="none" stroke="${THEME.accent}" stroke-width="2"/>
  <path d="M${width - corner} ${height - 1} L${width - 1} ${height - 1} L${width - 1} ${height - corner}" fill="none" stroke="${THEME.accent}" stroke-width="2"/>`;
}

export function titleBar(icon: string, label: string, x = 20, y = 26): string {
  return `<text x="${x}" y="${y}" font-family="${THEME.font}" font-size="13" fill="${THEME.accent}" letter-spacing="1">${icon} ${label}</text>`;
}

/** A rounded-pill badge with centered text — used for class/level/status chips. */
export function pillBadge(
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  strokeColor: string,
  textColor: string,
  fillColor = "none"
): string {
  const r = height / 2;
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5"/>
    <text x="${x + width / 2}" y="${y + height / 2 + 4}" font-family="${THEME.font}" font-size="11" fill="${textColor}" text-anchor="middle" letter-spacing="0.5">${text}</text>
  </g>`;
}

/** Segmented "game HUD" bar (health/mana style) instead of a plain gradient fill. */
export function segmentedBar(
  x: number,
  y: number,
  value: number,
  segments = 10,
  segWidth = 15,
  gap = 3
): string {
  const filledCount = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);
  let out = "";
  for (let i = 0; i < segments; i += 1) {
    const sx = x + i * (segWidth + gap);
    const fill = i < filledCount ? THEME.accent : THEME.pathBase;
    out += `<rect x="${sx}" y="${y}" width="${segWidth}" height="10" rx="2" fill="${fill}"/>`;
  }
  return out;
}
