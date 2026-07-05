import { PATCH_SIZE, STANDARD_TIER, type ResolutionTier } from "./tiers.js";

/** Round half to even (banker's rounding) to match the Python reference. */
function roundHalfEven(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Visual tokens an image consumes: one token per 28x28-pixel patch,
 * `ceil(width / 28) * ceil(height / 28)`.
 */
export function countImageTokens(width: number, height: number): number {
  return Math.ceil(width / PATCH_SIZE) * Math.ceil(height / PATCH_SIZE);
}

function fits(w: number, h: number, tier: ResolutionTier): boolean {
  return (
    Math.ceil(w / PATCH_SIZE) * PATCH_SIZE <= tier.maxEdge &&
    Math.ceil(h / PATCH_SIZE) * PATCH_SIZE <= tier.maxEdge &&
    countImageTokens(w, h) <= tier.maxTokens
  );
}

/**
 * The size Claude resizes an image to before padding — the largest
 * aspect-preserving size that satisfies both the tier's edge and visual-token
 * limits. Images already within limits are returned unchanged.
 *
 * Coordinates Claude returns are in this resized space, so use these dimensions
 * (never the original or the padded dimensions) to normalize or rescale.
 */
export function resizedSize(
  width: number,
  height: number,
  tier: ResolutionTier = STANDARD_TIER,
): Size {
  if (fits(width, height, tier)) {
    return { width, height };
  }
  if (height > width) {
    const swapped = resizedSize(height, width, tier);
    return { width: swapped.height, height: swapped.width };
  }

  // Binary search the long edge for the largest aspect-preserving fit.
  const aspectRatio = width / height;
  let lo = 1; // always fits
  let hi = width; // never fits
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid, Math.max(roundHalfEven(mid / aspectRatio), 1), tier)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { width: lo, height: Math.max(roundHalfEven(lo / aspectRatio), 1) };
}

/** Whether an image is within a tier's limits (needs no resize). */
export function fitsWithinTier(
  width: number,
  height: number,
  tier: ResolutionTier = STANDARD_TIER,
): boolean {
  return fits(width, height, tier);
}
