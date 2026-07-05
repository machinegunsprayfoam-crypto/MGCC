import type { Backend, BackendId, Capability } from "./types.js";

/**
 * The backend registry. Capability values reflect the documented feature
 * support per platform; `"conditional"` means it depends on configuration
 * (see `notes`). Verify against the platform docs before relying on an edge case.
 */
export const BACKENDS: Record<BackendId, Backend> = {
  anthropic: {
    id: "anthropic",
    displayName: "Claude API (first-party)",
    operator: "anthropic",
    apiSurface: "messages",
    authMethods: ["api-key"],
    modelIdFormat: "plain",
    urlShape: "fixed",
    sdkPackages: ["@anthropic-ai/sdk", "anthropic"],
    sdkClient: "Anthropic",
    envVars: ["ANTHROPIC_API_KEY"],
    capabilities: {
      mcpConnector: true,
      mcpTunnels: true,
      agentSkills: true,
      codeExecution: true,
      programmaticToolCalling: true,
      filesApi: true,
      structuredOutputs: true,
      messageBatches: true,
      betaHeaders: true,
      promptCaching: true,
      extendedThinking: true,
      citations: true,
    },
  },

  "claude-platform-aws": {
    id: "claude-platform-aws",
    displayName: "Claude Platform on AWS",
    operator: "anthropic",
    apiSurface: "messages",
    authMethods: ["aws-sigv4", "api-key"],
    modelIdFormat: "plain",
    urlShape: "aws-region",
    sdkPackages: ["@anthropic-ai/aws-sdk", "anthropic[aws]"],
    sdkClient: "AnthropicAws",
    envVars: ["ANTHROPIC_AWS_WORKSPACE_ID", "AWS_REGION", "ANTHROPIC_AWS_API_KEY"],
    capabilities: {
      mcpConnector: true,
      mcpTunnels: false,
      agentSkills: true,
      codeExecution: true,
      programmaticToolCalling: true,
      filesApi: true,
      structuredOutputs: true,
      messageBatches: true,
      betaHeaders: true,
      promptCaching: true,
      extendedThinking: true,
      citations: true,
    },
    notes: {
      mcpTunnels: "Only MCP servers exposed over the public internet are supported.",
      general:
        "Anthropic-operated; requires the anthropic-workspace-id header and outbound web identity federation enabled once per account.",
    },
  },

  bedrock: {
    id: "bedrock",
    displayName: "Claude in Amazon Bedrock (Messages API)",
    operator: "aws",
    apiSurface: "messages",
    authMethods: ["aws-sigv4"],
    modelIdFormat: "anthropic-prefixed",
    urlShape: "aws-region",
    sdkPackages: ["@anthropic-ai/bedrock-sdk", "anthropic[bedrock]"],
    sdkClient: "AnthropicBedrockMantle",
    envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_REGION"],
    capabilities: {
      mcpConnector: false,
      mcpTunnels: false,
      agentSkills: false,
      codeExecution: false,
      programmaticToolCalling: false,
      filesApi: false,
      structuredOutputs: true,
      messageBatches: false,
      betaHeaders: false,
      promptCaching: true,
      extendedThinking: true,
      citations: true,
    },
    notes: {
      general:
        "AWS-operated; Messages API at /anthropic/v1/messages (bedrock-mantle). anthropic-beta header not supported.",
    },
  },

  "bedrock-legacy": {
    id: "bedrock-legacy",
    displayName: "Amazon Bedrock (legacy InvokeModel/Converse)",
    operator: "aws",
    apiSurface: "bedrock-invoke",
    authMethods: ["aws-sigv4", "bearer"],
    modelIdFormat: "anthropic-arn-versioned",
    urlShape: "aws-region",
    sdkPackages: ["@anthropic-ai/bedrock-sdk", "anthropic[bedrock]"],
    sdkClient: "AnthropicBedrock",
    envVars: [
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_SESSION_TOKEN",
      "AWS_REGION",
      "AWS_BEARER_TOKEN_BEDROCK",
    ],
    capabilities: {
      mcpConnector: false,
      mcpTunnels: false,
      agentSkills: false,
      codeExecution: false,
      programmaticToolCalling: false,
      filesApi: false,
      structuredOutputs: true,
      messageBatches: false,
      betaHeaders: false,
      promptCaching: true,
      extendedThinking: true,
      citations: true,
    },
    notes: {
      general:
        "AWS EventStream via InvokeModel/Converse; ARN-versioned model ids with optional global./us./eu. region prefix.",
    },
  },

  vertex: {
    id: "vertex",
    displayName: "Claude on Google Cloud (Vertex / Agent Platform)",
    operator: "google",
    apiSurface: "messages",
    authMethods: ["gcp-oauth"],
    modelIdFormat: "plain",
    urlShape: "gcp-region",
    sdkPackages: ["@anthropic-ai/vertex-sdk", "anthropic[vertex]"],
    sdkClient: "AnthropicVertex",
    envVars: ["ANTHROPIC_VERTEX_PROJECT_ID", "CLOUD_ML_REGION", "GOOGLE_APPLICATION_CREDENTIALS"],
    capabilities: {
      mcpConnector: false,
      mcpTunnels: false,
      agentSkills: false,
      codeExecution: false,
      programmaticToolCalling: false,
      filesApi: false,
      structuredOutputs: true,
      messageBatches: false,
      betaHeaders: false,
      promptCaching: true,
      extendedThinking: true,
      citations: true,
    },
    notes: {
      general:
        "Google-operated; model is in the URL path and anthropic_version: vertex-2023-10-16 goes in the body (not a header).",
    },
  },

  foundry: {
    id: "foundry",
    displayName: "Claude in Microsoft Foundry",
    operator: "microsoft",
    apiSurface: "messages",
    authMethods: ["api-key", "bearer"],
    modelIdFormat: "deployment-name",
    urlShape: "azure-resource",
    sdkPackages: ["@anthropic-ai/foundry-sdk"],
    sdkClient: "AnthropicFoundry",
    envVars: [
      "ANTHROPIC_FOUNDRY_API_KEY",
      "ANTHROPIC_FOUNDRY_RESOURCE",
      "ANTHROPIC_FOUNDRY_BASE_URL",
    ],
    capabilities: {
      mcpConnector: "conditional",
      mcpTunnels: false,
      agentSkills: "conditional",
      codeExecution: "conditional",
      programmaticToolCalling: "conditional",
      filesApi: "conditional",
      structuredOutputs: "conditional",
      messageBatches: false,
      betaHeaders: "conditional",
      promptCaching: true,
      extendedThinking: true,
      citations: true,
    },
    notes: {
      general:
        "Two hosting options. Structured outputs, server-side tools, MCP connector, Agent Skills, programmatic tool calling, and Files API require a Hosted-on-Anthropic deployment; they return 400 on Hosted-on-Azure. `model` is the deployment name.",
    },
  },
};

/** Every backend id. */
export const BACKEND_IDS = Object.keys(BACKENDS) as BackendId[];

/** Look up a backend by id, or throw if unknown. */
export function getBackend(id: BackendId): Backend {
  const backend = BACKENDS[id];
  if (!backend) {
    throw new Error(`Unknown backend id: ${String(id)}`);
  }
  return backend;
}

/** All backends as an array. */
export function listBackends(): Backend[] {
  return BACKEND_IDS.map((id) => BACKENDS[id]);
}

/** Whether a backend supports a capability (`true` | `false` | `"conditional"`). */
export function supports(
  id: BackendId,
  capability: Capability,
): boolean | "conditional" {
  return getBackend(id).capabilities[capability];
}

/** Backend ids that fully support a capability (excludes `"conditional"`). */
export function backendsSupporting(capability: Capability): BackendId[] {
  return BACKEND_IDS.filter((id) => BACKENDS[id].capabilities[capability] === true);
}
