import { describe, expect, it } from "vitest";
import { WEATHERIZATION_SEARCH_FIXTURE } from "./fixtures.js";
import { parseGrantSearch } from "./parse.js";

describe("parseGrantSearch (real Granted output)", () => {
  const { grants, reportedCount } = parseGrantSearch(WEATHERIZATION_SEARCH_FIXTURE);

  it("reads the reported count and parses each grant block", () => {
    expect(reportedCount).toBe(6);
    expect(grants).toHaveLength(3); // three blocks in the fixture
  });

  it("does not treat the Next Steps section as a grant", () => {
    expect(grants.every((g) => !g.name.includes("get_grant"))).toBe(true);
  });

  it("parses the top result's fields, slug, and fit score", () => {
    const top = grants[0]!;
    expect(top.name).toMatch(/^Rural Energy for America Program/);
    expect(top.funder).toBe("USDA Rural Development");
    expect(top.confidence).toBe("High Confidence");
    expect(top.fitScore).toBe(63);
    expect(top.deadline).toBe("No deadline");
    expect(top.applyUrl).toBe(
      "https://sustainableagriculture.net/publications/grassrootsguide/renewable-energy/renewable-energy-energy-efficiency/",
    );
    expect(top.slug).toBe(
      "rural-energy-for-america-program-reap-renewable-energy-systems-energy-ef-usda-rural-development-33d68005",
    );
    expect(top.why).toEqual([
      'Matches your focus: "energy efficiency"',
      "Matches your focus: insulation",
      "Open to Small Business organizations",
    ]);
  });

  it("handles missing/blank search output", () => {
    expect(parseGrantSearch("").grants).toEqual([]);
    expect(parseGrantSearch("No active grants found.").grants).toEqual([]);
  });
});
