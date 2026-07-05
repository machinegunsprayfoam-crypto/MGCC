/**
 * Resolution tiers for Claude vision. Each model caps images by a long-edge
 * limit and a visual-token budget; images beyond either are downscaled.
 *
 * See https://docs.anthropic.com/en/docs/build-with-claude/vision
 */

/** Every image patch is a 28x28-pixel block = one visual token. */
export const PATCH_SIZE = 28;

export interface ResolutionTier {
  /** Neither side may exceed this after rounding up to a patch multiple. */
  maxEdge: number;
  /** The image's visual-token cost may not exceed this. */
  maxTokens: number;
}

/** Standard tier: 1568 px edge, 1568 visual tokens. */
export const STANDARD_TIER: ResolutionTier = { maxEdge: 1568, maxTokens: 1568 };

/** High-resolution tier: 2576 px edge, 4784 visual tokens. */
export const HIGH_RESOLUTION_TIER: ResolutionTier = {
  maxEdge: 2576,
  maxTokens: 4784,
};

/**
 * Model ids on the high-resolution tier. All other models are standard tier.
 * High-resolution support is automatic — no beta header or opt-in.
 */
export const HIGH_RESOLUTION_MODELS = new Set<string>([
  "claude-fable-5",
  "claude-mythos-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-sonnet-5",
]);

/**
 * The resolution tier for a model id. Matches on prefix so dated/suffixed ids
 * (e.g. `claude-opus-4-8@20990101`) resolve correctly. Defaults to the standard
 * tier for unknown ids.
 */
export function tierForModel(model: string): ResolutionTier {
  for (const id of HIGH_RESOLUTION_MODELS) {
    if (model === id || model.startsWith(`${id}@`) || model.startsWith(`${id}-`)) {
      return HIGH_RESOLUTION_TIER;
    }
  }
  return STANDARD_TIER;
}
