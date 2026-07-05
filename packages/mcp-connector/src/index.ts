/**
 * `@mgcc/mcp-connector`
 *
 * Typed helpers for Anthropic's MCP connector (beta `mcp-client-2025-11-20`):
 * build `mcp_servers` + `mcp_toolset` request payloads, validate them against
 * the connector's rules, call the Messages API, and read MCP tool blocks out of
 * the response.
 */

export {
  MCP_CONNECTOR_BETA,
  type CacheControlEphemeral,
  type McpMessageParam,
  type McpMessagesRequest,
  type McpServerDefinition,
  type McpToolConfig,
  type McpToolResultBlock,
  type McpToolset,
  type McpToolUseBlock,
  type MessagesResponse,
} from "./types.js";

export { McpConfigError, McpConnectorApiError } from "./errors.js";

export {
  allowlist,
  deferAll,
  denylist,
  enableAllTools,
  resolveToolConfig,
} from "./toolset.js";

export {
  buildMcpMessagesRequest,
  validateMcpConfiguration,
  type BuildMcpMessagesRequestParams,
  type McpServerBinding,
} from "./request.js";

export {
  getMcpToolResults,
  getMcpToolUses,
  getResponseText,
  getToolResultText,
} from "./content.js";

export {
  McpConnectorClient,
  type McpConnectorClientOptions,
} from "./client.js";

export {
  tunnelServer,
  tunnelUrl,
  type TunnelServerParams,
  type TunnelUrlParams,
} from "./tunnel.js";
