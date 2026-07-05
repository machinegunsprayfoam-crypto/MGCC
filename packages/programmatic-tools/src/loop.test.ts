import { describe, expect, it, vi } from "vitest";
import { ProgrammaticToolError } from "./errors.js";
import {
  isProgrammaticPause,
  runToolLoop,
  toolResult,
  type ToolRequest,
} from "./loop.js";
import { codeExecutionTool, programmaticTool } from "./tools.js";
import type { MessagesResponse, ToolUseBlock } from "./types.js";

function pauseResponse(ids: string[], container = "c1"): MessagesResponse {
  return {
    id: "msg",
    type: "message",
    role: "assistant",
    stop_reason: "tool_use",
    container: { id: container },
    content: ids.map((id) => ({
      type: "tool_use",
      id,
      name: "query_database",
      input: { sql: id },
      caller: { type: "code_execution_20260120", tool_id: "srv" },
    })),
  };
}

function done(): MessagesResponse {
  return {
    id: "msg",
    type: "message",
    role: "assistant",
    stop_reason: "end_turn",
    container: { id: "c1" },
    content: [{ type: "text", text: "done" }],
  };
}

const request: ToolRequest = {
  model: "claude-opus-4-8",
  max_tokens: 4096,
  messages: [{ role: "user", content: "Query the regions" }],
  tools: [
    codeExecutionTool(),
    programmaticTool({ name: "query_database", input_schema: { type: "object" } }),
  ],
};

describe("toolResult / isProgrammaticPause", () => {
  it("builds a tool_result block", () => {
    expect(toolResult("toolu_1", "[]")).toEqual({
      type: "tool_result",
      tool_use_id: "toolu_1",
      content: "[]",
    });
  });

  it("detects a programmatic pause", () => {
    expect(isProgrammaticPause(pauseResponse(["toolu_1"]))).toBe(true);
    expect(isProgrammaticPause(done())).toBe(false);
  });
});

describe("runToolLoop", () => {
  it("answers pending calls and continues until completion", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(pauseResponse(["toolu_1", "toolu_2"]))
      .mockResolvedValueOnce(done());
    const executeTool = vi.fn(async (tu: ToolUseBlock) => `result:${tu.id}`);

    const result = await runToolLoop({ create, request, executeTool });

    expect(executeTool).toHaveBeenCalledTimes(2);
    expect(result.response.stop_reason).toBe("end_turn");
    expect(result.exhausted).toBe(false);

    // Continuation reuses the container and sends only tool_result blocks back.
    const secondReq = create.mock.calls[1]![0];
    expect(secondReq.container).toBe("c1");
    const lastUserMsg = secondReq.messages[secondReq.messages.length - 1];
    expect(lastUserMsg.role).toBe("user");
    expect(lastUserMsg.content).toEqual([
      { type: "tool_result", tool_use_id: "toolu_1", content: "result:toolu_1" },
      { type: "tool_result", tool_use_id: "toolu_2", content: "result:toolu_2" },
    ]);
  });

  it("stops at maxTurns while still paused", async () => {
    const create = vi.fn().mockResolvedValue(pauseResponse(["toolu_1"]));
    const executeTool = vi.fn(async () => "[]");

    const result = await runToolLoop({
      create,
      request,
      executeTool,
      maxTurns: 2,
    });

    expect(result.exhausted).toBe(true);
    expect(create).toHaveBeenCalledTimes(3); // initial + 2 continuations
  });

  it("flags a direct tool use for the caller to handle", async () => {
    const directResp: MessagesResponse = {
      id: "msg",
      type: "message",
      role: "assistant",
      stop_reason: "tool_use",
      container: { id: "c1" },
      content: [
        { type: "tool_use", id: "toolu_d", name: "lookup", input: {}, caller: { type: "direct" } },
      ],
    };
    const create = vi.fn().mockResolvedValue(directResp);
    const result = await runToolLoop({ create, request, executeTool: async () => "" });
    expect(result.directToolUse).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("throws if a pending pause has no container id", async () => {
    const noContainer: MessagesResponse = {
      ...pauseResponse(["toolu_1"]),
      container: null,
    };
    const create = vi.fn().mockResolvedValue(noContainer);
    await expect(
      runToolLoop({ create, request, executeTool: async () => "[]" }),
    ).rejects.toBeInstanceOf(ProgrammaticToolError);
  });
});
