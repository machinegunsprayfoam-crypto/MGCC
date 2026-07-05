/**
 * A registry of the platforms that serve Claude, with the facts an app needs to
 * target each one: base URL shape, model-id format, auth methods, and a
 * capability matrix. **Auth/signing is delegated to the official Anthropic
 * backend SDKs** — this package carries configuration and capabilities, not
 * credentials or request signing.
 */

/** Backend identifiers. */
export type BackendId =
  | "anthropic"
  | "claude-platform-aws"
  | "bedrock"
  | "bedrock-legacy"
  | "vertex"
  | "foundry";

/** Who operates the inference stack. */
export type Operator = "anthropic" | "aws" | "google" | "microsoft";

/** The request/response API surface a backend exposes. */
export type ApiSurface =
  | "messages" // Claude Messages API shape (/v1/messages or /anthropic/v1/messages)
  | "bedrock-invoke"; // Bedrock InvokeModel / Converse (legacy)

/** How requests authenticate. */
export type AuthMethod =
  | "api-key" // x-api-key / api-key header
  | "bearer" // Authorization: Bearer (OAuth / Entra / GCP token)
  | "aws-sigv4" // AWS SigV4 request signing
  | "gcp-oauth"; // Google Cloud application-default credentials

/** How the `model` value is formatted for this backend. */
export type ModelIdFormat =
  | "plain" // claude-opus-4-8
  | "anthropic-prefixed" // anthropic.claude-opus-4-8
  | "anthropic-arn-versioned" // anthropic.claude-opus-4-6-v1 (+ optional region prefix)
  | "deployment-name"; // Foundry deployment name (defaults to the model id)

/** Features an app may depend on, tracked per backend. */
export type Capability =
  | "mcpConnector"
  | "mcpTunnels"
  | "agentSkills"
  | "codeExecution"
  | "programmaticToolCalling"
  | "filesApi"
  | "structuredOutputs"
  | "messageBatches"
  | "betaHeaders" // anthropic-beta pass-through
  | "promptCaching"
  | "extendedThinking"
  | "citations";

/** A backend's full descriptor. */
export interface Backend {
  id: BackendId;
  displayName: string;
  operator: Operator;
  apiSurface: ApiSurface;
  authMethods: AuthMethod[];
  modelIdFormat: ModelIdFormat;
  /**
   * Whether the base URL is parameterized by AWS/GCP region, and/or an Azure
   * resource name. Drives {@link resolveBaseUrl}.
   */
  urlShape: "fixed" | "aws-region" | "gcp-region" | "azure-resource";
  /** The official Anthropic SDK package(s) that implement this backend's auth. */
  sdkPackages: string[];
  /** The SDK client class for this backend. */
  sdkClient: string;
  /** Environment variables the SDK reads. */
  envVars: string[];
  /** Capability support. `"conditional"` = depends on configuration (see notes). */
  capabilities: Record<Capability, boolean | "conditional">;
  /** Free-text caveats keyed by capability or topic. */
  notes?: Partial<Record<Capability | "general", string>>;
}
