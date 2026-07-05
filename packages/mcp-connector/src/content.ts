import type {
  McpToolResultBlock,
  McpToolUseBlock,
  MessagesResponse,
} from "./types.js";

function contentBlocks(
  response: MessagesResponse,
): Array<{ type: string; [key: string]: unknown }> {
  return Array.isArray(response.content) ? response.content : [];
}

/** Extract every `mcp_tool_use` block from a Messages response. */
export function getMcpToolUses(response: MessagesResponse): McpToolUseBlock[] {
  return contentBlocks(response)
    .filter((block) => block.type === "mcp_tool_use")
    .map((block) => block as unknown as McpToolUseBlock);
}

/** Extract every `mcp_tool_result` block from a Messages response. */
export function getMcpToolResults(
  response: MessagesResponse,
): McpToolResultBlock[] {
  return contentBlocks(response)
    .filter((block) => block.type === "mcp_tool_result")
    .map((block) => block as unknown as McpToolResultBlock);
}

/** Concatenate the assistant's plain-text content blocks. */
export function getResponseText(response: MessagesResponse): string {
  return contentBlocks(response)
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");
}

/** Flatten the text of a single `mcp_tool_result` block. */
export function getToolResultText(result: McpToolResultBlock): string {
  if (!Array.isArray(result.content)) return "";
  return result.content
    .filter((part) => typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
}
