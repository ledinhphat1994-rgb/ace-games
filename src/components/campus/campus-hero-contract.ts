// src/components/campus/campus-hero-contract.ts
// Digital Campus v2: Milestone U2 — Campus Hero Banner Contract (Data-Truth)

/**
 * Hero Interaction Truth Contract.
 * Invariant:
 * - NO inert Previous / Next buttons without functional carousel behavior.
 * - NO fake multi-slide indicator dots pretending carousel exists.
 */
export const CAMPUS_HERO_BANNER_CONTRACT = {
  supportsCarousel: false,
  hasPreviousNextControls: false,
  hasMultiSlideIndicators: false,
} as const
