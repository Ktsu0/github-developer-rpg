import type { Boss } from "../src/types";

/**
 * 100% manual/narrative (spec §4). Empty until curated — the SVG/README
 * generators must render gracefully with zero bosses (see src/readme
 * §"BOSSES" section, which falls back to a placeholder message).
 *
 * Example shape once curated:
 * { id: "async-kraken", name: "Async Kraken", icon: "🌊",
 *   description: "A gnarly race condition that took three days to track down." }
 */
export const bosses: Boss[] = [];
