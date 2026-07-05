import { BackendConfigError } from "./errors.js";
import { getBackend } from "./registry.js";
import type { BackendId } from "./types.js";

export interface ResolveUrlOptions {
  /** AWS or GCP region (required for aws-region / gcp-region backends). */
  region?: string;
  /** Azure Foundry resource name (required for the foundry backend). */
  resource?: string;
}

/** GCP multi-region identifiers that use the `.rep.googleapis.com` host. */
const GCP_MULTI_REGIONS = new Set(["us", "eu"]);

/**
 * Resolve the base URL for a backend. Matches how the official Anthropic
 * backend SDKs construct endpoints:
 *
 * - anthropic → `https://api.anthropic.com`
 * - claude-platform-aws → `https://aws-external-anthropic.{region}.api.aws`
 * - bedrock → `https://bedrock-mantle.{region}.api.aws`
 * - bedrock-legacy → `https://bedrock-runtime.{region}.amazonaws.com`
 * - vertex → global: `https://aiplatform.googleapis.com`;
 *   us/eu: `https://aiplatform.{region}.rep.googleapis.com`;
 *   else: `https://{region}-aiplatform.googleapis.com`
 * - foundry → `https://{resource}.services.ai.azure.com/anthropic`
 *
 * Throws {@link BackendConfigError} when a required region/resource is missing.
 */
export function resolveBaseUrl(id: BackendId, options: ResolveUrlOptions = {}): string {
  const backend = getBackend(id);
  const { region, resource } = options;

  switch (backend.urlShape) {
    case "fixed":
      return "https://api.anthropic.com";

    case "aws-region": {
      if (!region) throw new BackendConfigError(`${id} requires a region`);
      if (id === "bedrock") return `https://bedrock-mantle.${region}.api.aws`;
      if (id === "bedrock-legacy") return `https://bedrock-runtime.${region}.amazonaws.com`;
      return `https://aws-external-anthropic.${region}.api.aws`; // claude-platform-aws
    }

    case "gcp-region": {
      if (!region) throw new BackendConfigError(`${id} requires a region`);
      if (region === "global") return "https://aiplatform.googleapis.com";
      if (GCP_MULTI_REGIONS.has(region)) {
        return `https://aiplatform.${region}.rep.googleapis.com`;
      }
      return `https://${region}-aiplatform.googleapis.com`;
    }

    case "azure-resource": {
      if (!resource) throw new BackendConfigError(`${id} requires a resource name`);
      return `https://${resource}.services.ai.azure.com/anthropic`;
    }
  }
}

/**
 * Build the Vertex request path, where the model lives in the URL and the
 * `:rawPredict` / `:streamRawPredict` specifier depends on streaming.
 */
export function vertexModelPath(params: {
  projectId: string;
  region: string;
  model: string;
  stream?: boolean;
}): string {
  const { projectId, region, model, stream = false } = params;
  const specifier = stream ? "streamRawPredict" : "rawPredict";
  return `/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${model}:${specifier}`;
}
