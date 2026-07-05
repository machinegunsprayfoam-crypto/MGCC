/**
 * `@mgcc/vision`
 *
 * Image sizing math for Claude vision: visual-token cost, the resize Claude
 * applies before processing an image, and coordinate rescaling so bounding
 * boxes and points line up with your original image. Pure, dependency-free.
 */

export {
  HIGH_RESOLUTION_MODELS,
  HIGH_RESOLUTION_TIER,
  PATCH_SIZE,
  STANDARD_TIER,
  tierForModel,
  type ResolutionTier,
} from "./tiers.js";

export {
  countImageTokens,
  fitsWithinTier,
  resizedSize,
  type Size,
} from "./resize.js";

export {
  boxToOriginalCoordinates,
  toOriginalCoordinates,
  toRelativeCoordinates,
  type BoundingBox,
  type Point,
} from "./coordinates.js";

export {
  scaleCoordinateToScreen,
  scaledScreenshotSize,
  screenshotScaleFactor,
  type ScreenshotLimits,
} from "./screenshot.js";
