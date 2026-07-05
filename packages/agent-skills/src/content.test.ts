import { describe, expect, it } from "vitest";
import { extractFileIds, getContainerId, getResponseText } from "./content.js";
import type { MessagesResponse } from "./types.js";

const response: MessagesResponse = {
  id: "msg_1",
  type: "message",
  role: "assistant",
  stop_reason: "end_turn",
  container: { id: "container_abc" },
  content: [
    { type: "text", text: "Created the file. " },
    {
      type: "bash_code_execution_tool_result",
      content: {
        type: "bash_code_execution_result",
        content: [
          { file_id: "file_1" },
          { type: "text", text: "no id here" },
          { file_id: "file_2" },
        ],
      },
    },
    { type: "text", text: "Done." },
  ],
};

describe("content helpers", () => {
  it("extracts generated file ids from bash execution results", () => {
    expect(extractFileIds(response)).toEqual(["file_1", "file_2"]);
  });

  it("reads the container id", () => {
    expect(getContainerId(response)).toBe("container_abc");
  });

  it("concatenates assistant text", () => {
    expect(getResponseText(response)).toBe("Created the file. Done.");
  });

  it("is safe on malformed or empty responses", () => {
    const empty = { content: undefined } as unknown as MessagesResponse;
    expect(extractFileIds(empty)).toEqual([]);
    expect(getContainerId(empty)).toBeUndefined();

    const noFiles: MessagesResponse = {
      ...response,
      content: [
        {
          type: "bash_code_execution_tool_result",
          content: { type: "something_else", content: [{ file_id: "x" }] },
        },
      ],
    };
    expect(extractFileIds(noFiles)).toEqual([]);
  });
});
