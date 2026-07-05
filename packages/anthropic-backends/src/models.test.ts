import { describe, expect, it } from "vitest";
import { formatModelId } from "./models.js";

describe("formatModelId", () => {
  it("leaves plain and deployment-name backends unchanged", () => {
    expect(formatModelId("anthropic", "claude-opus-4-8")).toBe("claude-opus-4-8");
    expect(formatModelId("claude-platform-aws", "claude-sonnet-4-6")).toBe(
      "claude-sonnet-4-6",
    );
    expect(formatModelId("vertex", "claude-opus-4-8")).toBe("claude-opus-4-8");
    expect(formatModelId("foundry", "my-deployment")).toBe("my-deployment");
  });

  it("adds the anthropic. prefix for Bedrock Messages API", () => {
    expect(formatModelId("bedrock", "claude-opus-4-8")).toBe("anthropic.claude-opus-4-8");
    // idempotent
    expect(formatModelId("bedrock", "anthropic.claude-opus-4-8")).toBe(
      "anthropic.claude-opus-4-8",
    );
  });

  it("adds anthropic. and optional region scope for legacy Bedrock", () => {
    expect(formatModelId("bedrock-legacy", "claude-opus-4-6-v1")).toBe(
      "anthropic.claude-opus-4-6-v1",
    );
    expect(
      formatModelId("bedrock-legacy", "claude-opus-4-6-v1", { regionScope: "global" }),
    ).toBe("global.anthropic.claude-opus-4-6-v1");
    expect(
      formatModelId("bedrock-legacy", "claude-opus-4-6-v1", { regionScope: "us" }),
    ).toBe("us.anthropic.claude-opus-4-6-v1");
  });
});
