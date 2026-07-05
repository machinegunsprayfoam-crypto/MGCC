import { McpConnectorApiError } from "./errors.js";
import {
  buildMcpMessagesRequest,
  type BuildMcpMessagesRequestParams,
} from "./request.js";
import { MCP_CONNECTOR_BETA, type MessagesResponse } from "./types.js";

const DEFAULT_BASE_URL = "https://api.anthropic.com";
const DEFAULT_ANTHROPIC_VERSION = "2023-06-01";

export interface McpConnectorClientOptions {
  /** Anthropic API key. Defaults to `process.env.ANTHROPIC_API_KEY`. */
  apiKey?: string;
  /** API base URL. Defaults to `https://api.anthropic.com`. */
  baseUrl?: string;
  /** `anthropic-version` header value. Defaults to `2023-06-01`. */
  anthropicVersion?: string;
  /**
   * Extra beta flags to send alongside the required MCP connector beta. The
   * `mcp-client-2025-11-20` flag is always included.
   */
  betas?: string[];
  /** Injectable fetch implementation (defaults to the global `fetch`). */
  fetch?: typeof fetch;
}

/**
 * Thin client over the Anthropic Messages API that always sets the MCP
 * connector beta header. Use {@link McpConnectorClient.createMessage} with
 * server bindings, or {@link McpConnectorClient.send} with a pre-built body.
 */
export class McpConnectorClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly anthropicVersion: string;
  private readonly betaHeader: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: McpConnectorClientOptions = {}) {
    const apiKey =
      options.apiKey ??
      (typeof process !== "undefined"
        ? process.env?.ANTHROPIC_API_KEY
        : undefined);
    if (!apiKey) {
      throw new Error(
        "Anthropic API key is required (pass options.apiKey or set ANTHROPIC_API_KEY)",
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.anthropicVersion = options.anthropicVersion ?? DEFAULT_ANTHROPIC_VERSION;

    const betas = [MCP_CONNECTOR_BETA, ...(options.betas ?? [])];
    // De-duplicate while preserving order.
    this.betaHeader = Array.from(new Set(betas)).join(",");

    const resolvedFetch = options.fetch ?? globalThis.fetch;
    if (typeof resolvedFetch !== "function") {
      throw new Error(
        "No fetch implementation available; pass options.fetch (Node < 18 or non-browser runtime)",
      );
    }
    this.fetchImpl = resolvedFetch;
  }

  /** Build a request from server bindings and send it. */
  async createMessage(
    params: BuildMcpMessagesRequestParams,
  ): Promise<MessagesResponse> {
    return this.send(buildMcpMessagesRequest(params));
  }

  /** Send an already-assembled Messages request body. */
  async send(body: Record<string, unknown>): Promise<MessagesResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.anthropicVersion,
        "anthropic-beta": this.betaHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new McpConnectorApiError(response.status, text);
    }

    return (await response.json()) as MessagesResponse;
  }
}
