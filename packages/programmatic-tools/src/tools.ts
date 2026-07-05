import {
  CODE_EXECUTION_TOOL_TYPE,
  type AllowedCaller,
  type CodeExecutionTool,
  type ToolDef,
} from "./types.js";

/** The code execution tool entry required for programmatic calling. */
export function codeExecutionTool(): CodeExecutionTool {
  return { type: CODE_EXECUTION_TOOL_TYPE, name: "code_execution" };
}

export interface ToolSpec {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

/**
 * Define a tool Claude invokes **from code execution**
 * (`allowed_callers: ["code_execution_20260120"]`). Document the output format
 * in `description` so Claude can deserialize the result in code.
 */
export function programmaticTool(spec: ToolSpec): ToolDef {
  return { ...spec, allowed_callers: ["code_execution_20260120"] };
}

/** Define a tool Claude calls **directly** (`allowed_callers: ["direct"]`). */
export function directTool(spec: ToolSpec): ToolDef {
  return { ...spec, allowed_callers: ["direct"] };
}

/**
 * Define a tool callable either way. The docs recommend picking one mode per
 * tool for clearer guidance, so prefer {@link programmaticTool}/{@link directTool}.
 */
export function dualTool(spec: ToolSpec): ToolDef {
  return { ...spec, allowed_callers: ["direct", "code_execution_20260120"] };
}

/** Whether an `allowed_callers` list permits code-execution invocation. */
export function allowsCodeExecution(callers: AllowedCaller[] | undefined): boolean {
  return (callers ?? ["direct"]).some((c) => c !== "direct");
}
