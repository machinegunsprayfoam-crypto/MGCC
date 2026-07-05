/** Raised when an MCP connector configuration is invalid. */
export class McpConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpConfigError";
  }
}

/** Raised when the Anthropic Messages API returns a non-2xx response. */
export class McpConnectorApiError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Anthropic Messages API request failed with status ${status}`);
    this.name = "McpConnectorApiError";
    this.status = status;
    this.body = body;
  }
}
