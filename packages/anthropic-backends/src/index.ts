/**
 * `@mgcc/anthropic-backends`
 *
 * A typed registry of the platforms that serve Claude — first-party API,
 * Claude Platform on AWS, Amazon Bedrock (Messages + legacy), Vertex, and
 * Microsoft Foundry — with base-URL resolution, model-id formatting, and a
 * capability matrix. Auth/signing is delegated to the official Anthropic
 * backend SDKs; this package carries configuration, not credentials.
 */

export {
  type ApiSurface,
  type AuthMethod,
  type Backend,
  type BackendId,
  type Capability,
  type ModelIdFormat,
  type Operator,
} from "./types.js";

export { BackendConfigError } from "./errors.js";

export {
  BACKEND_IDS,
  BACKENDS,
  backendsSupporting,
  getBackend,
  listBackends,
  supports,
} from "./registry.js";

export {
  resolveBaseUrl,
  vertexModelPath,
  type ResolveUrlOptions,
} from "./urls.js";

export {
  formatModelId,
  type BedrockRegionScope,
  type FormatModelOptions,
} from "./models.js";
