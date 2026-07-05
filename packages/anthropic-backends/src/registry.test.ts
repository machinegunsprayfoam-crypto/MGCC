import { describe, expect, it } from "vitest";
import {
  BACKEND_IDS,
  backendsSupporting,
  getBackend,
  listBackends,
  supports,
} from "./registry.js";

describe("registry", () => {
  it("exposes all six backends", () => {
    expect(BACKEND_IDS).toEqual([
      "anthropic",
      "claude-platform-aws",
      "bedrock",
      "bedrock-legacy",
      "vertex",
      "foundry",
    ]);
    expect(listBackends()).toHaveLength(6);
  });

  it("getBackend throws on unknown id", () => {
    // @ts-expect-error testing runtime guard
    expect(() => getBackend("nope")).toThrow(/Unknown backend/);
  });

  it("records MCP connector support accurately", () => {
    expect(supports("anthropic", "mcpConnector")).toBe(true);
    expect(supports("claude-platform-aws", "mcpConnector")).toBe(true);
    expect(supports("bedrock", "mcpConnector")).toBe(false);
    expect(supports("vertex", "mcpConnector")).toBe(false);
    expect(supports("foundry", "mcpConnector")).toBe("conditional");
  });

  it("records Agent Skills support accurately", () => {
    expect(supports("anthropic", "agentSkills")).toBe(true);
    expect(supports("bedrock-legacy", "agentSkills")).toBe(false);
    expect(supports("foundry", "agentSkills")).toBe("conditional");
  });

  it("backendsSupporting excludes conditional and unsupported", () => {
    const codeExec = backendsSupporting("codeExecution");
    expect(codeExec).toContain("anthropic");
    expect(codeExec).toContain("claude-platform-aws");
    expect(codeExec).not.toContain("bedrock");
    expect(codeExec).not.toContain("vertex");
    expect(codeExec).not.toContain("foundry"); // conditional, not true
  });

  it("every backend carries an SDK client and env vars", () => {
    for (const b of listBackends()) {
      expect(b.sdkClient).toBeTruthy();
      expect(b.sdkPackages.length).toBeGreaterThan(0);
      expect(b.envVars.length).toBeGreaterThan(0);
    }
  });
});
