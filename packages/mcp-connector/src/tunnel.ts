import { McpConfigError } from "./errors.js";
import type { McpServerDefinition } from "./types.js";

/**
 * MCP tunnels expose a private-network MCP server at a hostname under your
 * tunnel domain (`<subdomain>.<tunnel-domain>`). Traffic is otherwise identical
 * to any other remote MCP server — the only tunnel-specific value is the `url`.
 *
 * These helpers build that `url` (and the full {@link McpServerDefinition})
 * from its parts so callers don't hand-assemble host + path strings.
 *
 * See https://docs.anthropic.com/en/docs/agents-and-tools/mcp-tunnels/overview
 */

export interface TunnelUrlParams {
  /**
   * The subdomain your proxy routes to a specific upstream MCP server, e.g.
   * `echo` or `docs`. A single label — no dots.
   */
  subdomain: string;
  /**
   * Your tunnel domain, e.g. `my-team.tunnel.anthropic.com`. May be provided
   * with or without a scheme; any scheme or trailing slash is stripped.
   */
  tunnelDomain: string;
  /**
   * The path the upstream MCP server expects. Depends on the server, not the
   * tunnel (FastMCP's streamable-http serves at `/mcp`; others use `/` or a
   * custom path). Defaults to `/mcp`. A leading slash is added if missing.
   */
  path?: string;
}

const DEFAULT_TUNNEL_PATH = "/mcp";

function stripScheme(domain: string): string {
  return domain.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
}

/**
 * Build the HTTPS URL for a tunneled MCP server:
 * `https://<subdomain>.<tunnel-domain><path>`.
 *
 * Throws {@link McpConfigError} if the subdomain or tunnel domain is empty or
 * malformed (a subdomain must be a single DNS label without dots).
 */
export function tunnelUrl(params: TunnelUrlParams): string {
  const subdomain = params.subdomain.trim();
  const rawDomain = stripScheme(params.tunnelDomain.trim()).replace(/\/+$/, "");

  if (!subdomain) {
    throw new McpConfigError("tunnel subdomain must not be empty");
  }
  if (subdomain.includes(".") || subdomain.includes("/")) {
    throw new McpConfigError(
      `tunnel subdomain "${params.subdomain}" must be a single DNS label (no dots or slashes)`,
    );
  }
  if (!rawDomain) {
    throw new McpConfigError("tunnel domain must not be empty");
  }
  if (rawDomain.includes("/")) {
    throw new McpConfigError(
      `tunnel domain "${params.tunnelDomain}" must not contain a path`,
    );
  }

  const rawPath = params.path ?? DEFAULT_TUNNEL_PATH;
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  return `https://${subdomain}.${rawDomain}${path}`;
}

export interface TunnelServerParams extends TunnelUrlParams {
  /**
   * Unique server name used to reference this server from a toolset. Defaults
   * to the subdomain.
   */
  name?: string;
  /** OAuth token for the upstream MCP server, if it requires one. */
  authorization_token?: string;
}

/**
 * Build a {@link McpServerDefinition} for a tunneled MCP server. The result
 * plugs straight into `bindings` / `mcp_servers` alongside any other remote
 * server.
 *
 * ```ts
 * tunnelServer({ subdomain: "echo", tunnelDomain: "my-team.tunnel.anthropic.com" })
 * // { type: "url", url: "https://echo.my-team.tunnel.anthropic.com/mcp", name: "echo" }
 * ```
 *
 * The tunnel carries encrypted traffic but does not authenticate to the
 * upstream server; pass `authorization_token` if the server needs its own auth.
 */
export function tunnelServer(params: TunnelServerParams): McpServerDefinition {
  const url = tunnelUrl(params);
  const name = (params.name ?? params.subdomain).trim();
  if (!name) {
    throw new McpConfigError("tunnel server name must not be empty");
  }
  return {
    type: "url",
    url,
    name,
    ...(params.authorization_token !== undefined
      ? { authorization_token: params.authorization_token }
      : {}),
  };
}
