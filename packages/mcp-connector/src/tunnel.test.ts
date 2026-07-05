import { describe, expect, it } from "vitest";
import { McpConfigError } from "./errors.js";
import { tunnelServer, tunnelUrl } from "./tunnel.js";
import { buildMcpMessagesRequest } from "./request.js";

describe("tunnelUrl", () => {
  it("builds host + default /mcp path", () => {
    expect(
      tunnelUrl({ subdomain: "echo", tunnelDomain: "team.tunnel.anthropic.com" }),
    ).toBe("https://echo.team.tunnel.anthropic.com/mcp");
  });

  it("respects a custom path and adds a leading slash", () => {
    expect(
      tunnelUrl({ subdomain: "docs", tunnelDomain: "team.tunnel.anthropic.com", path: "custom" }),
    ).toBe("https://docs.team.tunnel.anthropic.com/custom");
    expect(
      tunnelUrl({ subdomain: "docs", tunnelDomain: "team.tunnel.anthropic.com", path: "/" }),
    ).toBe("https://docs.team.tunnel.anthropic.com/");
  });

  it("strips a scheme and trailing slash from the tunnel domain", () => {
    expect(
      tunnelUrl({ subdomain: "echo", tunnelDomain: "https://team.tunnel.anthropic.com/" }),
    ).toBe("https://echo.team.tunnel.anthropic.com/mcp");
  });

  it("rejects an empty subdomain", () => {
    expect(() => tunnelUrl({ subdomain: " ", tunnelDomain: "team.example.com" })).toThrow(
      McpConfigError,
    );
  });

  it("rejects a subdomain that is not a single label", () => {
    expect(() =>
      tunnelUrl({ subdomain: "a.b", tunnelDomain: "team.example.com" }),
    ).toThrow(/single DNS label/);
  });

  it("rejects a tunnel domain that carries a path", () => {
    expect(() =>
      tunnelUrl({ subdomain: "echo", tunnelDomain: "team.example.com/nope" }),
    ).toThrow(/must not contain a path/);
  });

  it("rejects an empty tunnel domain", () => {
    expect(() => tunnelUrl({ subdomain: "echo", tunnelDomain: "" })).toThrow(
      /tunnel domain must not be empty/,
    );
  });
});

describe("tunnelServer", () => {
  it("defaults name to the subdomain", () => {
    expect(
      tunnelServer({ subdomain: "echo", tunnelDomain: "team.tunnel.anthropic.com" }),
    ).toEqual({
      type: "url",
      url: "https://echo.team.tunnel.anthropic.com/mcp",
      name: "echo",
    });
  });

  it("accepts a custom name and auth token", () => {
    expect(
      tunnelServer({
        subdomain: "echo",
        tunnelDomain: "team.tunnel.anthropic.com",
        name: "echo-prod",
        authorization_token: "tok",
      }),
    ).toEqual({
      type: "url",
      url: "https://echo.team.tunnel.anthropic.com/mcp",
      name: "echo-prod",
      authorization_token: "tok",
    });
  });

  it("produces a definition that passes request validation", () => {
    const req = buildMcpMessagesRequest({
      model: "claude-opus-4-8",
      max_tokens: 1000,
      messages: [{ role: "user", content: "Use the hello tool to greet tunnel." }],
      bindings: [
        {
          server: tunnelServer({
            subdomain: "echo",
            tunnelDomain: "team.tunnel.anthropic.com",
          }),
        },
      ],
    });

    expect(req.mcp_servers[0]?.url).toBe(
      "https://echo.team.tunnel.anthropic.com/mcp",
    );
    expect(req.tools[0]).toEqual({ type: "mcp_toolset", mcp_server_name: "echo" });
  });
});
