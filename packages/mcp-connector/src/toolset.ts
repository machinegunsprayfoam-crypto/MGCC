import type { McpToolConfig, McpToolset } from "./types.js";

/**
 * Enable every tool from a server with default configuration.
 *
 * ```ts
 * enableAllTools("google-calendar-mcp")
 * // { type: "mcp_toolset", mcp_server_name: "google-calendar-mcp" }
 * ```
 */
export function enableAllTools(serverName: string): McpToolset {
  return { type: "mcp_toolset", mcp_server_name: serverName };
}

/**
 * Allowlist: disable all tools by default, then enable only the named ones.
 *
 * `overrides` may supply per-tool config (e.g. `defer_loading`) for individual
 * allowed tools; those merge over `{ enabled: true }`.
 */
export function allowlist(
  serverName: string,
  toolNames: string[],
  overrides?: Record<string, McpToolConfig>,
): McpToolset {
  const configs: Record<string, McpToolConfig> = {};
  for (const name of toolNames) {
    configs[name] = { enabled: true, ...overrides?.[name] };
  }
  return {
    type: "mcp_toolset",
    mcp_server_name: serverName,
    default_config: { enabled: false },
    configs,
  };
}

/**
 * Denylist: enable all tools by default, then disable the named ones. Useful
 * for read-only assistants that must never reach destructive tools.
 */
export function denylist(serverName: string, toolNames: string[]): McpToolset {
  const configs: Record<string, McpToolConfig> = {};
  for (const name of toolNames) {
    configs[name] = { enabled: false };
  }
  return { type: "mcp_toolset", mcp_server_name: serverName, configs };
}

/**
 * Defer loading of every tool in the set (for use with the tool search tool),
 * optionally enabling a few tools eagerly with `defer_loading: false`.
 */
export function deferAll(
  serverName: string,
  eagerToolNames: string[] = [],
): McpToolset {
  const configs: Record<string, McpToolConfig> = {};
  for (const name of eagerToolNames) {
    configs[name] = { defer_loading: false };
  }
  return {
    type: "mcp_toolset",
    mcp_server_name: serverName,
    default_config: { defer_loading: true },
    ...(eagerToolNames.length > 0 ? { configs } : {}),
  };
}

/**
 * Resolve the effective config for a tool given a toolset, applying the
 * documented precedence: per-tool `configs` > `default_config` > system
 * defaults (`enabled: true`, `defer_loading: false`).
 */
export function resolveToolConfig(
  toolset: McpToolset,
  toolName: string,
): Required<McpToolConfig> {
  return {
    enabled: true,
    defer_loading: false,
    ...toolset.default_config,
    ...toolset.configs?.[toolName],
  };
}
