/**
 * Screenshot scaling for the computer use tool. Unlike {@link resizedSize}
 * (token-budget based), the computer use limits are a long-edge cap and a
 * total-pixel cap, and you resize client-side so you keep the scale factor
 * needed to map Claude's returned coordinates back to your real screen.
 *
 * See https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool
 */

export interface ScreenshotLimits {
  /** Max long-edge pixels. Default 1568 (older models; newer accept 2576). */
  maxLongEdge?: number;
  /** Max total pixels. Default 1,150,000 (~1.15 MP; older-model limit). */
  maxPixels?: number;
}

const DEFAULT_MAX_LONG_EDGE = 1568;
const DEFAULT_MAX_PIXELS = 1_150_000;

/**
 * Scale factor (≤ 1) to bring a screenshot within the computer-use image
 * limits, preserving aspect ratio. Multiply your screen dimensions by this for
 * `display_width_px`/`display_height_px`, and divide Claude's returned
 * coordinates by it to map back to screen space.
 */
export function screenshotScaleFactor(
  width: number,
  height: number,
  limits: ScreenshotLimits = {},
): number {
  const maxLongEdge = limits.maxLongEdge ?? DEFAULT_MAX_LONG_EDGE;
  const maxPixels = limits.maxPixels ?? DEFAULT_MAX_PIXELS;
  const longEdge = Math.max(width, height);
  const totalPixels = width * height;
  return Math.min(
    1,
    maxLongEdge / longEdge,
    Math.sqrt(maxPixels / totalPixels),
  );
}

/** The scaled screenshot dimensions to send, given a scale factor. */
export function scaledScreenshotSize(
  width: number,
  height: number,
  limits: ScreenshotLimits = {},
): { width: number; height: number; scale: number } {
  const scale = screenshotScaleFactor(width, height, limits);
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
    scale,
  };
}

/** Map a coordinate Claude returned back to real screen space. */
export function scaleCoordinateToScreen(
  x: number,
  y: number,
  scale: number,
): { x: number; y: number } {
  return { x: x / scale, y: y / scale };
}
