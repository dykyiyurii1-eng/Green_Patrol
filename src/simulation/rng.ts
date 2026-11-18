/**
 * Mulberry32 is a fast, 32-bit pseudorandom number generator with excellent distribution.
 * Used to ensure all simulation runs and baseline comparisons are 100% reproducible and testable.
 */
export function createMulberry32(seed: number): () => number {
  let a = seed >>> 0 || 1; // Ensure non-zero unsigned 32-bit integer
  return function (): number {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
