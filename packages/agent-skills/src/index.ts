/**
 * `@mgcc/agent-skills`
 *
 * Typed helpers for using Anthropic Agent Skills through the beta Messages API:
 * build the `container.skills` payload with the required betas and code
 * execution tool, extract generated file ids from responses, and drive the
 * `pause_turn` continuation loop. Transport-agnostic and dependency-free.
 */

export {
  CODE_EXECUTION_BETA,
  CODE_EXECUTION_TOOL_TYPE,
  FILES_BETA,
  MAX_SKILLS_PER_REQUEST,
  PROMPT_CACHING_BETA,
  SKILLS_BETA,
  type CodeExecutionTool,
  type ContainerParam,
  type MessageParam,
  type MessagesResponse,
  type SkillRef,
  type SkillSource,
  type SkillsRequest,
} from "./types.js";

export { SkillsConfigError } from "./errors.js";

export {
  ANTHROPIC_SKILLS,
  anthropicSkill,
  codeExecutionTool,
  customSkill,
  skillsBetas,
  type SkillsBetasOptions,
} from "./skills.js";

export {
  buildSkillsRequest,
  validateSkills,
  type BuildSkillsRequestParams,
} from "./request.js";

export {
  extractFileIds,
  getContainerId,
  getResponseText,
} from "./content.js";

export {
  isPauseTurn,
  runToCompletion,
  type RunToCompletionParams,
  type RunToCompletionResult,
} from "./pause.js";
