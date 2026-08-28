export function calculateLevel(xp: number): number {
  const safeXp = Math.max(0, xp);
  return Math.floor(1 + Math.sqrt(safeXp / 40));
}
