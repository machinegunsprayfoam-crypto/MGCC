/**
 * Types for Anthropic programmatic tool calling: tools Claude invokes from code
 * inside the code execution container, rather than one model round-trip per call.
 *
 * See https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/programmatic-tool-calling
 */

/** The code execution tool version that enables programmatic calling. */
export const CODE_EXECUTION_TOOL_TYPE = "code_execution_20260120" as const;

/**
 * Code-execution caller identifiers accepted in `allowed_callers`. Both are
 * interchangeable; responses always tag the caller as `code_execution_20260120`.
 */
export const CODE_EXECUTION_CALLERS = [
  "code_execution_20260120",
  "code_execution_20260521",
] as const;

/** A value allowed in a tool's `allowed_callers` array. */
export type AllowedCaller =
  | "direct"
  | "code_execution_20260120"
  | "code_execution_20260521";

/** The code execution tool entry for the `tools` array. */
export interface CodeExecutionTool {
  type: typeof CODE_EXECUTION_TOOL_TYPE;
  name: "code_execution";
}

/** A custom tool definition, optionally callable from code execution. */
export interface ToolDef {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
  /**
   * Which contexts may invoke this tool. Omitted → `["direct"]`. Include a
   * code-execution caller to allow programmatic invocation.
   */
  allowed_callers?: AllowedCaller[];
  [key: string]: unknown;
}

/** How a `tool_use` block was invoked. */
export type ToolCaller =
  | { type: "direct" }
  | { type: "code_execution_20260120" | "code_execution_20260521"; tool_id: string };

/** A `tool_use` content block, carrying its `caller`. */
export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
  /** Absent on older responses; treated as direct. */
  caller?: ToolCaller;
}

/** A `tool_result` block sent back to answer a tool call. */
export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<{ type: "text"; text: string }>;
}

/** A single message in the conversation. */
export interface MessageParam {
  role: "user" | "assistant";
  content: unknown;
}

/** Minimal shape of a Messages response we read here. */
export interface MessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: string; [key: string]: unknown }>;
  stop_reason: string | null;
  container?: { id: string; expires_at?: string; [key: string]: unknown } | null;
  [key: string]: unknown;
}
