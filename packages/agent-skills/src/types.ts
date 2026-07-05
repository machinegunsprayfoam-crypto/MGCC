/**
 * Types for using Anthropic Agent Skills through the Messages API.
 *
 * Skills integrate via the `container.skills` parameter and the code execution
 * tool. See https://docs.anthropic.com/en/docs/build-with-claude/skills-guide
 */

/** Beta header enabling code execution (required for Skills). */
export const CODE_EXECUTION_BETA = "code-execution-2025-08-25" as const;
/** Beta header enabling the Skills API. */
export const SKILLS_BETA = "skills-2025-10-02" as const;
/** Beta header for uploading/downloading files to/from the container. */
export const FILES_BETA = "files-api-2025-04-14" as const;
/** Beta header for prompt caching. */
export const PROMPT_CACHING_BETA = "prompt-caching-2024-07-31" as const;

/** The code execution tool type Skills run in. */
export const CODE_EXECUTION_TOOL_TYPE = "code_execution_20250825" as const;

/** Maximum number of Skills allowed in a single request. */
export const MAX_SKILLS_PER_REQUEST = 8;

/** Where a Skill comes from: Anthropic-managed or a custom workspace upload. */
export type SkillSource = "anthropic" | "custom";

/** A reference to a Skill included in a request's container. */
export interface SkillRef {
  /** `anthropic` for pre-built Skills, `custom` for workspace uploads. */
  type: SkillSource;
  /**
   * Short name for Anthropic Skills (`pptx`, `xlsx`, `docx`, `pdf`) or a
   * generated id (`skill_…`) for custom Skills.
   */
  skill_id: string;
  /**
   * Version to pin. Anthropic Skills use a date (`20251013`); custom Skills use
   * an epoch timestamp. `latest` (the default here) always uses the newest.
   */
  version?: string;
}

/** The `container` request parameter. */
export interface ContainerParam {
  /** Reuse an existing container across turns by id. */
  id?: string;
  /** Skills to load into the container. */
  skills?: SkillRef[];
}

/** The code execution tool entry for the `tools` array. */
export interface CodeExecutionTool {
  type: typeof CODE_EXECUTION_TOOL_TYPE;
  name: "code_execution";
}

/** A single message in the conversation. */
export interface MessageParam {
  role: "user" | "assistant";
  content: unknown;
}

/** The portion of a beta Messages request that this package assembles. */
export interface SkillsRequest {
  model: string;
  max_tokens: number;
  messages: MessageParam[];
  container: ContainerParam;
  tools: unknown[];
  betas: string[];
  [key: string]: unknown;
}

/** Minimal shape of a beta Messages response we read here. */
export interface MessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: string; [key: string]: unknown }>;
  stop_reason: string | null;
  container?: { id: string; [key: string]: unknown } | null;
  [key: string]: unknown;
}
