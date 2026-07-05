import { SkillsConfigError } from "./errors.js";
import { codeExecutionTool, skillsBetas } from "./skills.js";
import {
  MAX_SKILLS_PER_REQUEST,
  type ContainerParam,
  type MessageParam,
  type SkillRef,
  type SkillsRequest,
} from "./types.js";

/**
 * Validate a Skills list against the connector's rules: at most
 * {@link MAX_SKILLS_PER_REQUEST}, each with a known `type` and a non-empty
 * `skill_id`. Throws {@link SkillsConfigError} on the first violation.
 */
export function validateSkills(skills: SkillRef[]): void {
  if (skills.length > MAX_SKILLS_PER_REQUEST) {
    throw new SkillsConfigError(
      `A request may include at most ${MAX_SKILLS_PER_REQUEST} Skills (got ${skills.length})`,
    );
  }
  for (const skill of skills) {
    if (skill.type !== "anthropic" && skill.type !== "custom") {
      throw new SkillsConfigError(
        `Skill type must be "anthropic" or "custom" (got "${String(skill.type)}")`,
      );
    }
    if (!skill.skill_id || skill.skill_id.trim() === "") {
      throw new SkillsConfigError("Skill skill_id must not be empty");
    }
  }
}

export interface BuildSkillsRequestParams {
  model: string;
  max_tokens: number;
  messages: MessageParam[];
  /** Skills to load into the container. */
  skills: SkillRef[];
  /** Reuse an existing container by id (for multi-turn conversations). */
  containerId?: string;
  /** Additional tools to append alongside the code execution tool. */
  extraTools?: unknown[];
  /** Include the Files API beta. Default true. */
  files?: boolean;
  /** Include the prompt caching beta. Default false. */
  promptCaching?: boolean;
  /** Extra beta flags to merge in (de-duplicated). */
  extraBetas?: string[];
  /** Any other Messages API fields (system, temperature, …). */
  extra?: Record<string, unknown>;
}

/**
 * Assemble a validated beta Messages request wired for Agent Skills: builds the
 * `container.skills` block, appends the code execution tool, and sets the
 * required beta headers. The result is a plain payload ready to send with the
 * beta Messages API.
 */
export function buildSkillsRequest(
  params: BuildSkillsRequestParams,
): SkillsRequest {
  const {
    model,
    max_tokens,
    messages,
    skills,
    containerId,
    extraTools,
    files,
    promptCaching,
    extraBetas,
    extra,
  } = params;

  validateSkills(skills);

  const container: ContainerParam = {
    ...(containerId !== undefined ? { id: containerId } : {}),
    skills,
  };

  const tools = [codeExecutionTool(), ...(extraTools ?? [])];

  const betas = Array.from(
    new Set([...skillsBetas({ files, promptCaching }), ...(extraBetas ?? [])]),
  );

  return {
    model,
    max_tokens,
    messages,
    container,
    tools,
    betas,
    ...extra,
  };
}
