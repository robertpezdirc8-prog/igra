/**
 * Deterministic pseudo-random number in [0, 1) derived from an integer seed.
 *
 * Pure function - safe to call during React render. Using this instead of
 * Math.random() keeps decorative layouts (particles, glitch offsets) stable
 * across re-renders and satisfies the React purity rules.
 */
export function pseudoRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
