# @mgcc/mcp-connector

Typed helpers for Anthropic's [MCP connector](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector)
(beta `mcp-client-2025-11-20`). This package lets the MGCC platform — the AI
Command Center in particular — connect Claude to remote MCP servers directly
through the Messages API, without running a separate MCP client.

It handles the mechanical parts:

- building the `mcp_servers` + `mcp_toolset` request payload,
- validating that payload against the connector's rules,
- calling the Messages API with the required beta header,
- reading MCP tool blocks out of the response.

The package has **no runtime dependencies** — it uses the platform `fetch`
(Node 20+ / edge runtimes).

## Install

Within the monorepo it is a workspace package:

```jsonc
// package.json
{
  "dependencies": {
    "@mgcc/mcp-connector": "workspace:*"
  }
}
```

## Usage

### One-shot message with a connected server

```ts
import { McpConnectorClient } from "@mgcc/mcp-connector";

const client = new McpConnectorClient(); // reads ANTHROPIC_API_KEY

const response = await client.createMessage({
  model: "claude-opus-4-8",
  max_tokens: 1000,
  messages: [{ role: "user", content: "What tools do you have available?" }],
  bindings: [
    {
      server: {
        type: "url",
        url: "https://example-server.modelcontextprotocol.io/sse",
        name: "example-mcp",
        authorization_token: process.env.EXAMPLE_MCP_TOKEN,
      },
    },
  ],
});
```

The client always sends `anthropic-beta: mcp-client-2025-11-20`. Pass more beta
flags via the `betas` option if you need them; the MCP flag is added and
de-duplicated automatically.

### Controlling which tools are exposed

`bindings[].toolset` accepts a fully-formed `mcp_toolset`, but the common
patterns have builders:

```ts
import {
  allowlist,
  denylist,
  deferAll,
  enableAllTools,
} from "@mgcc/mcp-connector";

// Only these two tools are callable:
allowlist("google-calendar-mcp", ["search_events", "create_event"]);

// Everything except the destructive ones (good for read-only assistants):
denylist("google-calendar-mcp", ["delete_all_events", "share_calendar_publicly"]);

// Defer every tool for use with the tool search tool, eager-load a few:
deferAll("google-calendar-mcp", ["search_events"]);

// Default: all tools, default config:
enableAllTools("google-calendar-mcp");
```

### Connecting a tunneled (private-network) MCP server

[MCP tunnels](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/overview)
let Claude reach an MCP server inside your private network. Traffic uses the
exact connector format above — the only tunnel-specific value is the `url`
(`https://<subdomain>.<tunnel-domain><path>`). `tunnelServer` builds that
`McpServerDefinition` for you:

```ts
import { tunnelServer } from "@mgcc/mcp-connector";

const server = tunnelServer({
  subdomain: "echo", // the proxy routes this subdomain to one upstream MCP server
  tunnelDomain: "my-team.tunnel.anthropic.com",
  // path defaults to "/mcp" (FastMCP streamable-http); override per your server
  // authorization_token: "…", // the tunnel does NOT auth to the upstream server
});
// { type: "url", url: "https://echo.my-team.tunnel.anthropic.com/mcp", name: "echo" }

await client.createMessage({
  model: "claude-opus-4-8",
  max_tokens: 1000,
  messages: [{ role: "user", content: "Use the hello tool to greet tunnel." }],
  bindings: [{ server }],
});
```

Use `tunnelUrl(...)` if you only need the URL string. Both throw
`McpConfigError` for an empty/multi-label subdomain or a tunnel domain that
carries a scheme-less path. The tunnel carries encrypted traffic but does not
authenticate to the upstream server — pass `authorization_token` if the server
requires its own OAuth/bearer auth, exactly as for any other remote server.

### Reading the response

```ts
import {
  getMcpToolUses,
  getMcpToolResults,
  getResponseText,
  getToolResultText,
} from "@mgcc/mcp-connector";

getResponseText(response); // assistant's plain text
getMcpToolUses(response); // mcp_tool_use blocks Claude emitted
getMcpToolResults(response).map(getToolResultText); // tool outputs
```

### Building a payload without sending it

If you drive the Messages API yourself (custom transport, batching, the
Anthropic SDK), build and validate the payload standalone:

```ts
import { buildMcpMessagesRequest } from "@mgcc/mcp-connector";

const body = buildMcpMessagesRequest({
  model: "claude-opus-4-8",
  max_tokens: 1000,
  messages: [{ role: "user", content: "…" }],
  bindings: [{ server: { type: "url", url: "https://…/sse", name: "srv" } }],
});
// -> { model, max_tokens, messages, mcp_servers, tools, … }
```

`buildMcpMessagesRequest` and `validateMcpConfiguration` enforce the connector's
rules and throw `McpConfigError` on a violation:

- every server `url` starts with `https://`,
- server names are unique,
- every toolset references a defined server,
- every server is referenced by exactly one toolset.

## Scripts

```bash
pnpm --filter @mgcc/mcp-connector build      # emit dist/ (js + d.ts)
pnpm --filter @mgcc/mcp-connector typecheck  # tsc --noEmit
pnpm --filter @mgcc/mcp-connector test       # vitest run
```

## Notes

- Only remote HTTPS MCP servers (Streamable HTTP / SSE) are supported; local
  STDIO servers cannot be connected through the API.
- The connector currently supports MCP **tool calls** only — not prompts or
  resources.
- This feature is not eligible for Zero Data Retention.
