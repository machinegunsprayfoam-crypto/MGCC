import { describe, expect, it, vi } from "vitest";
import { McpConnectorClient } from "./client.js";
import { McpConnectorApiError } from "./errors.js";
import { MCP_CONNECTOR_BETA } from "./types.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const sampleResponse = {
  id: "msg_1",
  type: "message",
  role: "assistant",
  model: "claude-opus-4-8",
  stop_reason: "end_turn",
  content: [{ type: "text", text: "hi" }],
};

describe("McpConnectorClient", () => {
  it("sets the MCP connector beta and auth headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleResponse));
    const client = new McpConnectorClient({
      apiKey: "sk-test",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.createMessage({
      model: "claude-opus-4-8",
      max_tokens: 256,
      messages: [{ role: "user", content: "hi" }],
      bindings: [
        {
          server: { type: "url", url: "https://s.example.com/sse", name: "s" },
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["anthropic-beta"]).toBe(MCP_CONNECTOR_BETA);
    expect(headers["x-api-key"]).toBe("sk-test");
    expect(headers["anthropic-version"]).toBe("2023-06-01");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.mcp_servers).toHaveLength(1);
    expect(body.tools[0]).toEqual({ type: "mcp_toolset", mcp_server_name: "s" });
  });

  it("merges extra betas and de-duplicates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(sampleResponse));
    const client = new McpConnectorClient({
      apiKey: "sk-test",
      betas: ["extended-cache-ttl-2025-04-11", MCP_CONNECTOR_BETA],
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.send({ model: "x", max_tokens: 1, messages: [] });
    const headers = (fetchMock.mock.calls[0]![1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["anthropic-beta"]).toBe(
      `${MCP_CONNECTOR_BETA},extended-cache-ttl-2025-04-11`,
    );
  });

  it("throws McpConnectorApiError on non-2xx", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: "boom" }, 400));
    const client = new McpConnectorClient({
      apiKey: "sk-test",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(
      client.send({ model: "x", max_tokens: 1, messages: [] }),
    ).rejects.toBeInstanceOf(McpConnectorApiError);
  });

  it("requires an api key", () => {
    expect(
      () =>
        new McpConnectorClient({
          apiKey: "",
          fetch: (() => {}) as unknown as typeof fetch,
        }),
    ).toThrow(/API key is required/);
  });
});
