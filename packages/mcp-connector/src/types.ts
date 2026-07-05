/**
 * Types for Anthropic's MCP connector feature (beta `mcp-client-2025-11-20`).
 *
 * These mirror the shapes documented at
 * https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector — the
 * `mcp_servers` connection definitions and the `mcp_toolset` tool entries.
 */

/** Beta header value required by the current MCP connector API. */
export const MCP_CONNECTOR_BETA = "mcp-client-2025-11-20" as const;

/**
 * Connection details for a remote MCP server. Lives in the request's
 * `mcp_servers` array. Only Streamable HTTP / SSE servers exposed over HTTPS
 * are supported — local STDIO servers cannot be connected directly.
 */
export interface McpServerDefinition {
  /** Currently only "url" is supported. */
  type: "url";
  /** URL of the MCP server. Must start with `https://`. */
  url: string;
  /** Unique identifier; must be referenced by exactly one toolset. */
  name: string;
  /** OAuth authorization token, if the server requires one. */
  authorization_token?: string;
}

/**
 * Per-tool configuration. Applied either as `default_config` (to every tool in
 * a set) or under `configs` keyed by tool name (overriding the default).
 */
export interface McpToolConfig {
  /** Whether the tool is enabled. Defaults to `true`. */
  enabled?: boolean;
  /**
   * If true, the tool description is not sent to the model initially (used with
   * the tool search tool). Defaults to `false`.
   */
  defer_loading?: boolean;
}

/** Prompt-caching cache breakpoint. */
export interface CacheControlEphemeral {
  type: "ephemeral";
}

/**
 * Toolset entry for the request's `tools` array. Selects which tools from a
 * connected MCP server are enabled and how they are configured.
 */
export interface McpToolset {
  type: "mcp_toolset";
  /** Must match a server `name` in the `mcp_servers` array. */
  mcp_server_name: string;
  /** Defaults applied to all tools in this set. */
  default_config?: McpToolConfig;
  /** Per-tool overrides, keyed by tool name. */
  configs?: Record<string, McpToolConfig>;
  /** Prompt-caching cache breakpoint for this toolset. */
  cache_control?: CacheControlEphemeral;
}

/** A single message in the conversation. */
export interface McpMessageParam {
  role: "user" | "assistant";
  content: unknown;
}

/**
 * The portion of a Messages API request that the connector is responsible for.
 * Additional tools (e.g. custom tools or the tool search tool) may be appended
 * to `tools` by the caller.
 */
export interface McpMessagesRequest {
  model: string;
  max_tokens: number;
  messages: McpMessageParam[];
  mcp_servers: McpServerDefinition[];
  tools: McpToolset[];
  system?: string | unknown;
  [key: string]: unknown;
}

/** Content block emitted when Claude invokes an MCP tool. */
export interface McpToolUseBlock {
  type: "mcp_tool_use";
  id: string;
  name: string;
  server_name: string;
  input: Record<string, unknown>;
}

/** Content block carrying the result of an MCP tool call. */
export interface McpToolResultBlock {
  type: "mcp_tool_result";
  tool_use_id: string;
  is_error: boolean;
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
}

/** Minimal shape of a Messages API response we care about here. */
export interface MessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: string; [key: string]: unknown }>;
  stop_reason: string | null;
  [key: string]: unknown;
}
