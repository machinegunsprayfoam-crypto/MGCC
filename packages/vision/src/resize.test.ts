import { describe, expect, it } from "vitest";
import { countImageTokens, fitsWithinTier, resizedSize } from "./resize.js";
import { HIGH_RESOLUTION_TIER, STANDARD_TIER } from "./tiers.js";

describe("countImageTokens", () => {
  // Values from the Vision doc's resolution/token-cost table.
  it("matches the documented token costs", () => {
    expect(countImageTokens(200, 200)).toBe(64);
    expect(countImageTokens(1000, 1000)).toBe(1296);
    expect(countImageTokens(1092, 1092)).toBe(1521);
  });
});

describe("resizedSize", () => {
  it("returns small images unchanged", () => {
    expect(resizedSize(200, 200)).toEqual({ width: 200, height: 200 });
    expect(resizedSize(1000, 1000)).toEqual({ width: 1000, height: 1000 });
  });

  it("resizes the documented A4 example (1075x1520 -> 924x1307)", () => {
    // Both sides < 1568 px but 39*55 = 2145 tokens > 1568, so it downsizes.
    expect(resizedSize(1075, 1520)).toEqual({ width: 924, height: 1307 });
  });

  it("is symmetric under transpose", () => {
    const portrait = resizedSize(1075, 1520);
    const landscape = resizedSize(1520, 1075);
    expect(landscape).toEqual({ width: portrait.height, height: portrait.width });
  });

  it("keeps results within the tier limits", () => {
    for (const [w, h] of [
      [1920, 1080],
      [2000, 1500],
      [3840, 2160],
    ] as const) {
      const r = resizedSize(w, h);
      expect(fitsWithinTier(r.width, r.height, STANDARD_TIER)).toBe(true);
      expect(countImageTokens(r.width, r.height)).toBeLessThanOrEqual(
        STANDARD_TIER.maxTokens,
      );
    }
  });

  it("allows larger images on the high-resolution tier", () => {
    // 1920x1080 fits high-res without downscaling (2691 <= 4784, edges < 2576).
    expect(resizedSize(1920, 1080, HIGH_RESOLUTION_TIER)).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(countImageTokens(1920, 1080)).toBe(2691);
  });
});
