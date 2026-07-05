import { describe, expect, it } from "vitest";
import { SkillsConfigError } from "./errors.js";
import { buildSkillsRequest, validateSkills } from "./request.js";
import { anthropicSkill, customSkill } from "./skills.js";
import {
  CODE_EXECUTION_BETA,
  FILES_BETA,
  PROMPT_CACHING_BETA,
  SKILLS_BETA,
} from "./types.js";

describe("validateSkills", () => {
  it("accepts up to 8 valid skills", () => {
    const skills = Array.from({ length: 8 }, (_, i) => customSkill(`skill_${i}`));
    expect(() => validateSkills(skills)).not.toThrow();
  });

  it("rejects more than 8 skills", () => {
    const skills = Array.from({ length: 9 }, (_, i) => customSkill(`skill_${i}`));
    expect(() => validateSkills(skills)).toThrow(/at most 8 Skills/);
  });

  it("rejects an empty skill_id", () => {
    expect(() => validateSkills([{ type: "custom", skill_id: " " }])).toThrow(
      SkillsConfigError,
    );
  });

  it("rejects an unknown type", () => {
    expect(() =>
      validateSkills([{ type: "weird" as "custom", skill_id: "x" }]),
    ).toThrow(/type must be/);
  });
});

describe("buildSkillsRequest", () => {
  it("builds container.skills, the code execution tool, and betas", () => {
    const req = buildSkillsRequest({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [{ role: "user", content: "Create a deck" }],
      skills: [anthropicSkill("pptx")],
    });

    expect(req.container).toEqual({
      skills: [{ type: "anthropic", skill_id: "pptx", version: "latest" }],
    });
    expect(req.tools).toEqual([
      { type: "code_execution_20250825", name: "code_execution" },
    ]);
    expect(req.betas).toEqual([CODE_EXECUTION_BETA, SKILLS_BETA, FILES_BETA]);
  });

  it("threads a container id for multi-turn reuse", () => {
    const req = buildSkillsRequest({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [],
      skills: [anthropicSkill("xlsx")],
      containerId: "container_123",
    });
    expect(req.container.id).toBe("container_123");
  });

  it("merges prompt-caching and extra betas, de-duplicated", () => {
    const req = buildSkillsRequest({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [],
      skills: [anthropicSkill("xlsx")],
      promptCaching: true,
      extraBetas: [SKILLS_BETA, "custom-beta"],
    });
    expect(req.betas).toEqual([
      CODE_EXECUTION_BETA,
      SKILLS_BETA,
      FILES_BETA,
      PROMPT_CACHING_BETA,
      "custom-beta",
    ]);
  });

  it("can drop the files beta and append extra tools", () => {
    const otherTool = { type: "custom_tool", name: "x" };
    const req = buildSkillsRequest({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [],
      skills: [customSkill("skill_1")],
      files: false,
      extraTools: [otherTool],
    });
    expect(req.betas).toEqual([CODE_EXECUTION_BETA, SKILLS_BETA]);
    expect(req.tools).toHaveLength(2);
    expect(req.tools[1]).toEqual(otherTool);
  });

  it("passes through system/extra fields and throws on >8 skills", () => {
    const req = buildSkillsRequest({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [],
      skills: [anthropicSkill("pdf")],
      extra: { system: "Be brief." },
    });
    expect(req.system).toBe("Be brief.");

    expect(() =>
      buildSkillsRequest({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        messages: [],
        skills: Array.from({ length: 9 }, (_, i) => customSkill(`s_${i}`)),
      }),
    ).toThrow(SkillsConfigError);
  });
});
