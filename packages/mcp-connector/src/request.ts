import { McpConfigError } from "./errors.js";
import type {
  McpMessageParam,
  McpMessagesRequest,
  McpServerDefinition,
  McpToolset,
} from "./types.js";

/**
 * A server paired with the toolset that governs it. `toolset` is optional — when
 * omitted, all tools are enabled with default configuration.
 */
export interface McpServerBinding {
  server: McpServerDefinition;
  toolset?: McpToolset;
}

/**
 * Validate a set of servers and toolsets against the connector's rules:
 *
 * - every server `url` starts with `https://`
 * - server names are unique
 * - every toolset references a defined server
 * - every server is referenced by exactly one toolset
 *
 * Throws {@link McpConfigError} on the first violation found.
 */
export function validateMcpConfiguration(
  servers: McpServerDefinition[],
  toolsets: McpToolset[],
): void {
  const serverNames = new Set<string>();
  for (const server of servers) {
    if (!server.url.startsWith("https://")) {
      throw new McpConfigError(
        `MCP server "${server.name}" url must start with https:// (got "${server.url}")`,
      );
    }
    if (serverNames.has(server.name)) {
      throw new McpConfigError(`Duplicate MCP server name "${server.name}"`);
    }
    serverNames.add(server.name);
  }

  const referenceCounts = new Map<string, number>();
  for (const toolset of toolsets) {
    const name = toolset.mcp_server_name;
    if (!serverNames.has(name)) {
      throw new McpConfigError(
        `Toolset references unknown MCP server "${name}"`,
      );
    }
    referenceCounts.set(name, (referenceCounts.get(name) ?? 0) + 1);
  }

  for (const name of serverNames) {
    const count = referenceCounts.get(name) ?? 0;
    if (count === 0) {
      throw new McpConfigError(
        `MCP server "${name}" is not referenced by any toolset`,
      );
    }
    if (count > 1) {
      throw new McpConfigError(
        `MCP server "${name}" is referenced by ${count} toolsets (expected exactly one)`,
      );
    }
  }
}

/** Base fields for a Messages request, excluding the MCP-specific arrays. */
export interface BuildMcpMessagesRequestParams {
  model: string;
  max_tokens: number;
  messages: McpMessageParam[];
  /** One binding per MCP server to connect. */
  bindings: McpServerBinding[];
  /** Optional system prompt. */
  system?: string | unknown;
  /** Additional non-MCP tools to append (e.g. custom tools, tool search). */
  extraTools?: unknown[];
  /** Any other Messages API fields (temperature, stop_sequences, …). */
  extra?: Record<string, unknown>;
}

/**
 * Assemble a validated Messages API request body wired for the MCP connector.
 * The returned object is a plain JSON payload ready to send with the
 * `mcp-client-2025-11-20` beta header.
 */
export function buildMcpMessagesRequest(
  params: BuildMcpMessagesRequestParams,
): McpMessagesRequest {
  const { model, max_tokens, messages, bindings, system, extraTools, extra } =
    params;

  const mcp_servers = bindings.map((b) => b.server);
  const toolsets = bindings.map(
    (b) =>
      b.toolset ?? {
        type: "mcp_toolset" as const,
        mcp_server_name: b.server.name,
      },
  );

  validateMcpConfiguration(mcp_servers, toolsets);

  const tools = [...toolsets, ...(extraTools ?? [])] as McpToolset[];

  return {
    model,
    max_tokens,
    messages,
    mcp_servers,
    tools,
    ...(system !== undefined ? { system } : {}),
    ...extra,
  };
}
