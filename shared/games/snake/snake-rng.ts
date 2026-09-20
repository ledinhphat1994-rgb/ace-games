/**
 * Deterministic 32-bit XorShift Pseudo-Random Number Generator.
 *
 * Implements pure 32-bit arithmetic with zero external dependencies,
 * ensuring byte-for-byte identical sequence across all JavaScript runtimes
 * (V8, Cloudflare Workers, Node.js, WebKit, Gecko).
 */
export class SnakeRng {
  private state: number

  constructor(seed: number) {
    // Ensure seed is a non-zero 32-bit unsigned integer
    const s = (seed >>> 0) || 1
    this.state = s
  }

  /**
   * Advances the generator and returns a 32-bit unsigned integer in [1, 4294967295].
   */
  next(): number {
    let x = this.state
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.state = x >>> 0
    return this.state
  }

  /**
   * Returns a deterministic integer in the range [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    if (min >= max) return min
    const range = max - min + 1
    return min + (this.next() % range)
  }
}
