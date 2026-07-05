import { describe, expect, it } from "vitest";
import {
  getMcpToolResults,
  getMcpToolUses,
  getResponseText,
  getToolResultText,
} from "./content.js";
import type { MessagesResponse } from "./types.js";

const response: MessagesResponse = {
  id: "msg_1",
  type: "message",
  role: "assistant",
  model: "claude-opus-4-8",
  stop_reason: "end_turn",
  content: [
    { type: "text", text: "Here is the result: " },
    {
      type: "mcp_tool_use",
      id: "mcptoolu_1",
      name: "echo",
      server_name: "example-mcp",
      input: { param1: "value1" },
    },
    {
      type: "mcp_tool_result",
      tool_use_id: "mcptoolu_1",
      is_error: false,
      content: [{ type: "text", text: "Hello" }],
    },
    { type: "text", text: "done." },
  ],
};

describe("content helpers", () => {
  it("extracts mcp_tool_use blocks", () => {
    const uses = getMcpToolUses(response);
    expect(uses).toHaveLength(1);
    expect(uses[0]?.name).toBe("echo");
    expect(uses[0]?.server_name).toBe("example-mcp");
  });

  it("extracts mcp_tool_result blocks", () => {
    const results = getMcpToolResults(response);
    expect(results).toHaveLength(1);
    expect(results[0]?.is_error).toBe(false);
    expect(getToolResultText(results[0]!)).toBe("Hello");
  });

  it("concatenates assistant text", () => {
    expect(getResponseText(response)).toBe("Here is the result: done.");
  });

  it("is safe on malformed responses", () => {
    const empty = { content: undefined } as unknown as MessagesResponse;
    expect(getMcpToolUses(empty)).toEqual([]);
    expect(getResponseText(empty)).toBe("");
  });
});
