import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_SKILLS,
  anthropicSkill,
  codeExecutionTool,
  customSkill,
  skillsBetas,
} from "./skills.js";
import {
  CODE_EXECUTION_BETA,
  FILES_BETA,
  PROMPT_CACHING_BETA,
  SKILLS_BETA,
} from "./types.js";

describe("skill builders", () => {
  it("anthropicSkill defaults to latest", () => {
    expect(anthropicSkill("pptx")).toEqual({
      type: "anthropic",
      skill_id: "pptx",
      version: "latest",
    });
    expect(anthropicSkill("pptx", "20251013").version).toBe("20251013");
  });

  it("customSkill defaults to latest", () => {
    expect(customSkill("skill_1")).toEqual({
      type: "custom",
      skill_id: "skill_1",
      version: "latest",
    });
  });

  it("exposes the four pre-built skill ids", () => {
    expect(ANTHROPIC_SKILLS).toEqual({
      pptx: "pptx",
      xlsx: "xlsx",
      docx: "docx",
      pdf: "pdf",
    });
  });

  it("codeExecutionTool returns the tool entry", () => {
    expect(codeExecutionTool()).toEqual({
      type: "code_execution_20250825",
      name: "code_execution",
    });
  });
});

describe("skillsBetas", () => {
  it("includes code-execution, skills, and files by default", () => {
    expect(skillsBetas()).toEqual([
      CODE_EXECUTION_BETA,
      SKILLS_BETA,
      FILES_BETA,
    ]);
  });

  it("can drop files and add prompt caching", () => {
    expect(skillsBetas({ files: false })).toEqual([
      CODE_EXECUTION_BETA,
      SKILLS_BETA,
    ]);
    expect(skillsBetas({ promptCaching: true })).toEqual([
      CODE_EXECUTION_BETA,
      SKILLS_BETA,
      FILES_BETA,
      PROMPT_CACHING_BETA,
    ]);
  });
});
