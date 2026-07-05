import { getBackend } from "./registry.js";
import type { BackendId } from "./types.js";

/** Region-scope prefixes for legacy Bedrock cross-region inference. */
export type BedrockRegionScope = "global" | "us" | "eu" | "jp" | "apac";

export interface FormatModelOptions {
  /**
   * For `bedrock-legacy` only: cross-region inference scope prefix
   * (`global.`/`us.`/…). Ignored by other backends.
   */
  regionScope?: BedrockRegionScope;
}

/**
 * Format a base model id (e.g. `claude-opus-4-8`) for a backend's expected
 * `model` value:
 *
 * - plain / deployment-name → unchanged
 * - anthropic-prefixed (Bedrock Messages API) → `anthropic.claude-opus-4-8`
 * - anthropic-arn-versioned (Bedrock legacy) → `anthropic.` prefix + optional
 *   `{regionScope}.` prefix. Include any ARN version suffix (`-v1:0`) in the
 *   input `model` yourself — this doesn't invent one.
 *
 * Idempotent: an already-prefixed id is returned unchanged.
 */
export function formatModelId(
  id: BackendId,
  model: string,
  options: FormatModelOptions = {},
): string {
  const { modelIdFormat } = getBackend(id);

  switch (modelIdFormat) {
    case "plain":
    case "deployment-name":
      return model;

    case "anthropic-prefixed":
      return model.startsWith("anthropic.") ? model : `anthropic.${model}`;

    case "anthropic-arn-versioned": {
      const core = model.startsWith("anthropic.") ? model : `anthropic.${model}`;
      return options.regionScope ? `${options.regionScope}.${core}` : core;
    }
  }
}
