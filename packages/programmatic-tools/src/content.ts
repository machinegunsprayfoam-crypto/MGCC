import type { MessagesResponse, ToolCaller, ToolUseBlock } from "./types.js";

function contentBlocks(
  response: MessagesResponse,
): Array<{ type: string; [key: string]: unknown }> {
  return Array.isArray(response.content) ? response.content : [];
}

/** Whether a caller is a code-execution (programmatic) caller. */
export function isProgrammaticCaller(caller: ToolCaller | undefined): boolean {
  return caller?.type === "code_execution_20260120" || caller?.type === "code_execution_20260521";
}

function toolUseBlocks(response: MessagesResponse): ToolUseBlock[] {
  return contentBlocks(response)
    .filter((b) => b.type === "tool_use")
    .map((b) => b as unknown as ToolUseBlock);
}

/** All `tool_use` blocks invoked programmatically (from code execution). */
export function getProgrammaticToolUses(
  response: MessagesResponse,
): ToolUseBlock[] {
  return toolUseBlocks(response).filter((b) => isProgrammaticCaller(b.caller));
}

/** All `tool_use` blocks invoked directly (caller `direct` or absent). */
export function getDirectToolUses(response: MessagesResponse): ToolUseBlock[] {
  return toolUseBlocks(response).filter((b) => !isProgrammaticCaller(b.caller));
}

/**
 * Group programmatic tool uses by the `server_tool_use` (`tool_id`) that made
 * them, so you can match each call to its code execution run.
 */
export function groupByCodeExecution(
  response: MessagesResponse,
): Map<string, ToolUseBlock[]> {
  const groups = new Map<string, ToolUseBlock[]>();
  for (const block of getProgrammaticToolUses(response)) {
    const toolId =
      block.caller && "tool_id" in block.caller ? block.caller.tool_id : "";
    const list = groups.get(toolId) ?? [];
    list.push(block);
    groups.set(toolId, list);
  }
  return groups;
}

/** The container id assigned to (or reused by) a response, if any. */
export function getContainerId(response: MessagesResponse): string | undefined {
  return response.container?.id;
}

/** Concatenate the assistant's plain-text content blocks. */
export function getResponseText(response: MessagesResponse): string {
  return contentBlocks(response)
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
}
