import { describe, expect, it } from "vitest";
import {
  scaleCoordinateToScreen,
  scaledScreenshotSize,
  screenshotScaleFactor,
} from "./screenshot.js";

describe("screenshotScaleFactor", () => {
  it("is 1 for a screenshot already within limits", () => {
    expect(screenshotScaleFactor(1280, 720)).toBe(1);
  });

  it("scales down a 4K screen by the binding constraint", () => {
    // 3840x2160: long-edge scale 1568/3840=0.408; pixel scale sqrt(1.15M/8.29M)=0.372.
    // The smaller (pixel) constraint binds.
    const scale = screenshotScaleFactor(3840, 2160);
    expect(scale).toBeCloseTo(Math.sqrt(1_150_000 / (3840 * 2160)), 6);
    expect(scale).toBeLessThan(1568 / 3840);
  });

  it("respects custom limits (newer-model long edge)", () => {
    const scale = screenshotScaleFactor(2560, 1440, {
      maxLongEdge: 2576,
      maxPixels: 4_784 * 28 * 28,
    });
    expect(scale).toBe(1); // fits the higher limits
  });
});

describe("scaledScreenshotSize", () => {
  it("floors dimensions and returns the scale", () => {
    const r = scaledScreenshotSize(3840, 2160);
    expect(r.scale).toBeLessThan(1);
    expect(r.width).toBe(Math.floor(3840 * r.scale));
    expect(r.height).toBe(Math.floor(2160 * r.scale));
  });
});

describe("scaleCoordinateToScreen", () => {
  it("maps a scaled coordinate back to screen space", () => {
    const { scale } = scaledScreenshotSize(3840, 2160);
    const screen = scaleCoordinateToScreen(500, 400, scale);
    expect(screen.x).toBeCloseTo(500 / scale, 6);
    expect(screen.y).toBeCloseTo(400 / scale, 6);
  });
});
