import { describe, expect, it } from "vitest";
import {
  allowsCodeExecution,
  codeExecutionTool,
  directTool,
  dualTool,
  programmaticTool,
} from "./tools.js";

const spec = {
  name: "query_database",
  description: "Execute a SQL query. Returns JSON rows.",
  input_schema: {
    type: "object",
    properties: { sql: { type: "string" } },
    required: ["sql"],
  },
};

describe("tool builders", () => {
  it("codeExecutionTool returns the 20260120 tool", () => {
    expect(codeExecutionTool()).toEqual({
      type: "code_execution_20260120",
      name: "code_execution",
    });
  });

  it("programmaticTool sets the code-execution caller", () => {
    expect(programmaticTool(spec).allowed_callers).toEqual([
      "code_execution_20260120",
    ]);
  });

  it("directTool sets direct only", () => {
    expect(directTool(spec).allowed_callers).toEqual(["direct"]);
  });

  it("dualTool allows both", () => {
    expect(dualTool(spec).allowed_callers).toEqual([
      "direct",
      "code_execution_20260120",
    ]);
  });
});

describe("allowsCodeExecution", () => {
  it("is false for direct-only or default", () => {
    expect(allowsCodeExecution(["direct"])).toBe(false);
    expect(allowsCodeExecution(undefined)).toBe(false);
  });
  it("is true when a code-execution caller is present", () => {
    expect(allowsCodeExecution(["code_execution_20260120"])).toBe(true);
    expect(allowsCodeExecution(["direct", "code_execution_20260521"])).toBe(true);
  });
});
