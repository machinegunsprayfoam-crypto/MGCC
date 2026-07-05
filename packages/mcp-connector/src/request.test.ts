import { describe, expect, it } from "vitest";
import { McpConfigError } from "./errors.js";
import {
  buildMcpMessagesRequest,
  validateMcpConfiguration,
} from "./request.js";
import { allowlist } from "./toolset.js";
import type { McpServerDefinition, McpToolset } from "./types.js";

const server = (name: string): McpServerDefinition => ({
  type: "url",
  url: `https://${name}.example.com/sse`,
  name,
});

const toolset = (name: string): McpToolset => ({
  type: "mcp_toolset",
  mcp_server_name: name,
});

describe("validateMcpConfiguration", () => {
  it("accepts a valid single-server config", () => {
    expect(() =>
      validateMcpConfiguration([server("a")], [toolset("a")]),
    ).not.toThrow();
  });

  it("rejects non-https urls", () => {
    const bad: McpServerDefinition = {
      type: "url",
      url: "http://insecure.example.com/sse",
      name: "a",
    };
    expect(() => validateMcpConfiguration([bad], [toolset("a")])).toThrow(
      McpConfigError,
    );
  });

  it("rejects duplicate server names", () => {
    expect(() =>
      validateMcpConfiguration([server("a"), server("a")], [toolset("a")]),
    ).toThrow(/Duplicate MCP server name/);
  });

  it("rejects toolsets referencing unknown servers", () => {
    expect(() =>
      validateMcpConfiguration([server("a")], [toolset("b")]),
    ).toThrow(/unknown MCP server/);
  });

  it("rejects servers with no toolset", () => {
    expect(() =>
      validateMcpConfiguration([server("a"), server("b")], [toolset("a")]),
    ).toThrow(/not referenced by any toolset/);
  });

  it("rejects a server referenced by two toolsets", () => {
    expect(() =>
      validateMcpConfiguration([server("a")], [toolset("a"), toolset("a")]),
    ).toThrow(/referenced by 2 toolsets/);
  });
});

describe("buildMcpMessagesRequest", () => {
  it("defaults to enabling all tools when no toolset is given", () => {
    const req = buildMcpMessagesRequest({
      model: "claude-opus-4-8",
      max_tokens: 512,
      messages: [{ role: "user", content: "hi" }],
      bindings: [{ server: server("cal") }],
    });

    expect(req.mcp_servers).toEqual([server("cal")]);
    expect(req.tools).toEqual([
      { type: "mcp_toolset", mcp_server_name: "cal" },
    ]);
  });

  it("threads through a custom toolset and appends extra tools", () => {
    const extraTool = { type: "tool_search_tool_20250917", name: "tool_search" };
    const req = buildMcpMessagesRequest({
      model: "claude-opus-4-8",
      max_tokens: 512,
      messages: [{ role: "user", content: "hi" }],
      bindings: [
        { server: server("cal"), toolset: allowlist("cal", ["search_events"]) },
      ],
      extraTools: [extraTool],
    });

    expect(req.tools).toHaveLength(2);
    expect(req.tools[0]).toMatchObject({
      mcp_server_name: "cal",
      default_config: { enabled: false },
      configs: { search_events: { enabled: true } },
    });
    expect(req.tools[1]).toEqual(extraTool);
  });

  it("passes through system and extra fields", () => {
    const req = buildMcpMessagesRequest({
      model: "claude-opus-4-8",
      max_tokens: 512,
      messages: [{ role: "user", content: "hi" }],
      bindings: [{ server: server("cal") }],
      system: "Be concise.",
      extra: { temperature: 0.2 },
    });

    expect(req.system).toBe("Be concise.");
    expect(req.temperature).toBe(0.2);
  });

  it("throws before returning when the config is invalid", () => {
    expect(() =>
      buildMcpMessagesRequest({
        model: "claude-opus-4-8",
        max_tokens: 512,
        messages: [],
        bindings: [
          {
            server: { type: "url", url: "http://x.example.com", name: "x" },
          },
        ],
      }),
    ).toThrow(McpConfigError);
  });
});
