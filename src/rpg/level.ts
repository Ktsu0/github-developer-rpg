export function calculateLevel(xp: number): number {
  const safeXp = Math.max(0, xp);
  return Math.floor(1 + Math.sqrt(safeXp / 40));
}

export interface XpProgress {
  current: number;
  needed: number;
  percent: number;
}

/**
 * How far into the current level the profile is, derived from the same
 * curve as calculateLevel (never an invented percentage — spec §19).
 * level = floor(1 + sqrt(xp/40))  =>  xp at the start of level L is
 * 40*(L-1)^2, and 40*L^2 at the start of the next level.
 */
export function xpProgress(xp: number): XpProgress {
  const safeXp = Math.max(0, xp);
  const level = calculateLevel(safeXp);
  const levelStart = 40 * (level - 1) ** 2;
  const nextLevelStart = 40 * level ** 2;
  const needed = nextLevelStart - levelStart;
  const current = safeXp - levelStart;
  const percent = needed > 0 ? Math.max(0, Math.min(100, Math.round((current / needed) * 100))) : 100;
  return { current, needed, percent };
}
