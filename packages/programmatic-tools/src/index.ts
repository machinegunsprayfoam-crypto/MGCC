/**
 * `@mgcc/programmatic-tools`
 *
 * Typed helpers for Anthropic programmatic tool calling: define tools with
 * `allowed_callers`, pull programmatic `tool_use` blocks out of responses by
 * caller, and drive the `tool_result` continuation loop. Transport-agnostic and
 * dependency-free.
 */

export {
  CODE_EXECUTION_CALLERS,
  CODE_EXECUTION_TOOL_TYPE,
  type AllowedCaller,
  type CodeExecutionTool,
  type MessageParam,
  type MessagesResponse,
  type ToolCaller,
  type ToolDef,
  type ToolResultBlock,
  type ToolUseBlock,
} from "./types.js";

export { ProgrammaticToolError } from "./errors.js";

export {
  allowsCodeExecution,
  codeExecutionTool,
  directTool,
  dualTool,
  programmaticTool,
  type ToolSpec,
} from "./tools.js";

export {
  getContainerId,
  getDirectToolUses,
  getProgrammaticToolUses,
  getResponseText,
  groupByCodeExecution,
  isProgrammaticCaller,
} from "./content.js";

export {
  isProgrammaticPause,
  runToolLoop,
  toolResult,
  type RunToolLoopParams,
  type RunToolLoopResult,
  type ToolRequest,
} from "./loop.js";
