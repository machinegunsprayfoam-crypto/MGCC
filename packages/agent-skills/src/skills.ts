import {
  CODE_EXECUTION_BETA,
  CODE_EXECUTION_TOOL_TYPE,
  FILES_BETA,
  PROMPT_CACHING_BETA,
  SKILLS_BETA,
  type CodeExecutionTool,
  type SkillRef,
} from "./types.js";

/** The four pre-built Anthropic Skill ids. */
export const ANTHROPIC_SKILLS = {
  pptx: "pptx",
  xlsx: "xlsx",
  docx: "docx",
  pdf: "pdf",
} as const;

/** Reference a pre-built Anthropic Skill (defaults to the latest version). */
export function anthropicSkill(
  skillId: string,
  version = "latest",
): SkillRef {
  return { type: "anthropic", skill_id: skillId, version };
}

/** Reference a custom workspace Skill (defaults to the latest version). */
export function customSkill(skillId: string, version = "latest"): SkillRef {
  return { type: "custom", skill_id: skillId, version };
}

/** The code execution tool entry Skills require in the `tools` array. */
export function codeExecutionTool(): CodeExecutionTool {
  return { type: CODE_EXECUTION_TOOL_TYPE, name: "code_execution" };
}

export interface SkillsBetasOptions {
  /** Include the Files API beta (for downloading generated files). Default true. */
  files?: boolean;
  /** Include the prompt caching beta. Default false. */
  promptCaching?: boolean;
}

/**
 * The beta header values required to use Skills: code execution + Skills, plus
 * (by default) the Files API beta so generated files can be downloaded.
 */
export function skillsBetas(options: SkillsBetasOptions = {}): string[] {
  const { files = true, promptCaching = false } = options;
  const betas: string[] = [CODE_EXECUTION_BETA, SKILLS_BETA];
  if (files) betas.push(FILES_BETA);
  if (promptCaching) betas.push(PROMPT_CACHING_BETA);
  return betas;
}
