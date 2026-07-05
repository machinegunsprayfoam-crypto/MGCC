import { describe, expect, it } from "vitest";
import { GrantsError } from "./errors.js";
import { buildGrantApplicationRequest } from "./writer.js";
import type { CompanyProfile } from "./writer.js";
import type { Grant } from "./types.js";

const company: CompanyProfile = {
  legalName: "Machine Gun Spray Foam & Concrete Lifting LLC",
  description: "Spray foam insulation, weatherization, and concrete lifting/leveling.",
  services: ["spray foam insulation", "weatherization", "concrete lifting"],
  orgType: "Small Business",
  state: "MO",
};

const grant: Grant = {
  name: "Rural Energy for America Program (REAP)",
  funder: "USDA Rural Development",
  amount: "Grants up to 50% of eligible project costs",
  deadline: "No deadline",
  summary: "Funds energy efficiency improvements including insulation.",
  detailsUrl: "https://grantedai.com/grants/reap-usda-33d68005",
  slug: "reap-usda-33d68005",
  why: [],
};

describe("buildGrantApplicationRequest", () => {
  it("builds a grounded Messages request with default sections", () => {
    const body = buildGrantApplicationRequest({ grant, company });

    expect(body.model).toBe("claude-opus-4-8");
    expect(body.max_tokens).toBe(4096);
    expect(body.messages).toHaveLength(1);

    const prompt = body.messages[0]!.content;
    expect(prompt).toContain("Machine Gun Spray Foam");
    expect(prompt).toContain("USDA Rural Development");
    expect(prompt).toContain("Executive Summary");
    expect(prompt).toContain("Budget Narrative");

    // Anti-fabrication guardrail is present.
    expect(body.system).toMatch(/do not invent facts/i);
    expect(prompt).toMatch(/\[TODO/); // instructs placeholders for missing info
  });

  it("includes project summary, requested amount, and grant details when given", () => {
    const body = buildGrantApplicationRequest({
      grant,
      grantDetails: "Eligibility: rural small businesses…",
      company,
      projectSummary: "Insulate 40 rural homes with closed-cell spray foam.",
      requestedAmount: "$250,000",
      sections: ["executive_summary", "budget_narrative"],
      maxTokens: 2048,
    });

    const prompt = body.messages[0]!.content;
    expect(body.max_tokens).toBe(2048);
    expect(prompt).toContain("Insulate 40 rural homes");
    expect(prompt).toContain("$250,000");
    expect(prompt).toContain("Eligibility: rural small businesses");
    // Only the two requested sections are listed.
    expect(prompt).toContain("1. Executive Summary");
    expect(prompt).toContain("2. Budget Narrative");
    expect(prompt).not.toContain("Statement of Need");
  });

  it("validates required inputs", () => {
    expect(() =>
      buildGrantApplicationRequest({ grant, company: { ...company, legalName: " " } }),
    ).toThrow(GrantsError);
    expect(() =>
      buildGrantApplicationRequest({ grant, company, sections: [] }),
    ).toThrow(/at least one/);
  });
});
