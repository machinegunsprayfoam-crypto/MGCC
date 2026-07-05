import { resizedSize } from "./resize.js";
import { STANDARD_TIER, type ResolutionTier } from "./tiers.js";

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Map a pixel coordinate Claude returned (in the resized image space) to a
 * relative coordinate in [0, 1]. Pass the dimensions of the image you uploaded.
 *
 * Padding is applied only to the bottom/right, so a per-axis linear rescale by
 * the resized (not padded) dimensions is exact.
 */
export function toRelativeCoordinates(
  x: number,
  y: number,
  originalWidth: number,
  originalHeight: number,
  tier: ResolutionTier = STANDARD_TIER,
): Point {
  const resized = resizedSize(originalWidth, originalHeight, tier);
  return { x: x / resized.width, y: y / resized.height };
}

/**
 * Map a pixel coordinate Claude returned back onto your original image's pixel
 * space (undoing Claude's resize). Use when you sent the un-resized image.
 */
export function toOriginalCoordinates(
  x: number,
  y: number,
  originalWidth: number,
  originalHeight: number,
  tier: ResolutionTier = STANDARD_TIER,
): Point {
  const rel = toRelativeCoordinates(x, y, originalWidth, originalHeight, tier);
  return { x: rel.x * originalWidth, y: rel.y * originalHeight };
}

/**
 * Rescale a `[x1, y1, x2, y2]` bounding box Claude returned onto your original
 * image's pixel space.
 */
export function boxToOriginalCoordinates(
  box: BoundingBox,
  originalWidth: number,
  originalHeight: number,
  tier: ResolutionTier = STANDARD_TIER,
): BoundingBox {
  const topLeft = toOriginalCoordinates(box.x1, box.y1, originalWidth, originalHeight, tier);
  const bottomRight = toOriginalCoordinates(box.x2, box.y2, originalWidth, originalHeight, tier);
  return { x1: topLeft.x, y1: topLeft.y, x2: bottomRight.x, y2: bottomRight.y };
}
