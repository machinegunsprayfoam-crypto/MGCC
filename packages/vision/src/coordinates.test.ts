import { describe, expect, it } from "vitest";
import {
  boxToOriginalCoordinates,
  toOriginalCoordinates,
  toRelativeCoordinates,
} from "./coordinates.js";
import { HIGH_RESOLUTION_TIER } from "./tiers.js";

describe("toRelativeCoordinates", () => {
  it("normalizes by the resized dimensions (A4 example)", () => {
    // 1075x1520 resizes to 924x1307; a point at the resized center → ~0.5.
    const rel = toRelativeCoordinates(462, 653.5, 1075, 1520);
    expect(rel.x).toBeCloseTo(0.5, 5);
    expect(rel.y).toBeCloseTo(0.5, 5);
  });

  it("is identity for an image that isn't resized", () => {
    const rel = toRelativeCoordinates(500, 250, 1000, 500);
    expect(rel).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe("toOriginalCoordinates", () => {
  it("maps a resized-space coord back onto the original image", () => {
    // Resized 924x1307 → original 1075x1520.
    const orig = toOriginalCoordinates(924, 1307, 1075, 1520);
    expect(orig.x).toBeCloseTo(1075, 4);
    expect(orig.y).toBeCloseTo(1520, 4);
  });

  it("respects the high-resolution tier (no resize → identity)", () => {
    const orig = toOriginalCoordinates(960, 540, 1920, 1080, HIGH_RESOLUTION_TIER);
    expect(orig).toEqual({ x: 960, y: 540 });
  });
});

describe("boxToOriginalCoordinates", () => {
  it("rescales both corners of a bounding box", () => {
    const box = boxToOriginalCoordinates(
      { x1: 0, y1: 0, x2: 924, y2: 1307 },
      1075,
      1520,
    );
    expect(box.x1).toBe(0);
    expect(box.y1).toBe(0);
    expect(box.x2).toBeCloseTo(1075, 4);
    expect(box.y2).toBeCloseTo(1520, 4);
  });
});
