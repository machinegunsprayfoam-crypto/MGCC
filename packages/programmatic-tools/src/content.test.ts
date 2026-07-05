import { describe, expect, it } from "vitest";
import {
  getContainerId,
  getDirectToolUses,
  getProgrammaticToolUses,
  getResponseText,
  groupByCodeExecution,
  isProgrammaticCaller,
} from "./content.js";
import type { MessagesResponse } from "./types.js";

const response: MessagesResponse = {
  id: "msg_1",
  type: "message",
  role: "assistant",
  stop_reason: "tool_use",
  container: { id: "container_xyz789", expires_at: "2026-01-20T14:30:00Z" },
  content: [
    { type: "text", text: "Querying…" },
    { type: "server_tool_use", id: "srvtoolu_abc", name: "code_execution", input: {} },
    {
      type: "tool_use",
      id: "toolu_1",
      name: "query_database",
      input: { sql: "A" },
      caller: { type: "code_execution_20260120", tool_id: "srvtoolu_abc" },
    },
    {
      type: "tool_use",
      id: "toolu_2",
      name: "query_database",
      input: { sql: "B" },
      caller: { type: "code_execution_20260120", tool_id: "srvtoolu_abc" },
    },
    {
      type: "tool_use",
      id: "toolu_3",
      name: "lookup",
      input: {},
      caller: { type: "direct" },
    },
  ],
};

describe("content helpers", () => {
  it("classifies programmatic vs direct callers", () => {
    expect(isProgrammaticCaller({ type: "code_execution_20260120", tool_id: "x" })).toBe(true);
    expect(isProgrammaticCaller({ type: "direct" })).toBe(false);
    expect(isProgrammaticCaller(undefined)).toBe(false);
  });

  it("extracts programmatic tool uses", () => {
    expect(getProgrammaticToolUses(response).map((b) => b.id)).toEqual([
      "toolu_1",
      "toolu_2",
    ]);
  });

  it("extracts direct tool uses", () => {
    expect(getDirectToolUses(response).map((b) => b.id)).toEqual(["toolu_3"]);
  });

  it("groups programmatic calls by code execution tool_id", () => {
    const groups = groupByCodeExecution(response);
    expect(groups.get("srvtoolu_abc")?.map((b) => b.id)).toEqual([
      "toolu_1",
      "toolu_2",
    ]);
  });

  it("reads container id and text", () => {
    expect(getContainerId(response)).toBe("container_xyz789");
    expect(getResponseText(response)).toBe("Querying…");
  });
});
