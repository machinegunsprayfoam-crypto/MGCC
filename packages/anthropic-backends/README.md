# @mgcc/anthropic-backends

A typed registry of the platforms that serve Claude, so the AI Command Center
can target any of them from one config: **base-URL resolution**, **model-id
formatting**, and a **capability matrix**. Pure and dependency-free.

**Auth is delegated to the official Anthropic backend SDKs** — this package
carries configuration and capabilities, not credentials or request signing.
Reimplementing SigV4 / Google OAuth / Entra by hand would be inferior and risky;
use the SDK named in each backend's `sdkClient`/`sdkPackages`.

## Backends

| id | operator | API surface | auth | model id | SDK client |
| --- | --- | --- | --- | --- | --- |
| `anthropic` | Anthropic | Messages | api-key | plain | `Anthropic` |
| `claude-platform-aws` | Anthropic | Messages | SigV4 / api-key | plain | `AnthropicAws` |
| `bedrock` | AWS | Messages (`/anthropic/v1/messages`) | SigV4 | `anthropic.`-prefixed | `AnthropicBedrockMantle` |
| `bedrock-legacy` | AWS | InvokeModel / Converse | SigV4 / bearer | ARN-versioned | `AnthropicBedrock` |
| `vertex` | Google | Messages (model in URL) | GCP OAuth | plain | `AnthropicVertex` |
| `foundry` | Microsoft | Messages (`/anthropic/v1/messages`) | api-key / Entra | deployment name | `AnthropicFoundry` |

## Resolve base URLs & paths

```ts
import { resolveBaseUrl, vertexModelPath } from "@mgcc/anthropic-backends";

resolveBaseUrl("anthropic");                                  // https://api.anthropic.com
resolveBaseUrl("claude-platform-aws", { region: "us-west-2" }); // https://aws-external-anthropic.us-west-2.api.aws
resolveBaseUrl("bedrock", { region: "us-east-1" });           // https://bedrock-mantle.us-east-1.api.aws
resolveBaseUrl("vertex", { region: "global" });               // https://aiplatform.googleapis.com
resolveBaseUrl("vertex", { region: "us" });                   // https://aiplatform.us.rep.googleapis.com  (multi-region)
resolveBaseUrl("vertex", { region: "us-east1" });             // https://us-east1-aiplatform.googleapis.com (regional)
resolveBaseUrl("foundry", { resource: "my-resource" });       // https://my-resource.services.ai.azure.com/anthropic

// Vertex puts the model in the path:
vertexModelPath({ projectId: "p", region: "global", model: "claude-opus-4-8" });
// /v1/projects/p/locations/global/publishers/anthropic/models/claude-opus-4-8:rawPredict
```

Missing a required region/resource throws `BackendConfigError`.

## Format model ids

```ts
import { formatModelId } from "@mgcc/anthropic-backends";

formatModelId("anthropic", "claude-opus-4-8");            // claude-opus-4-8
formatModelId("bedrock", "claude-opus-4-8");              // anthropic.claude-opus-4-8
formatModelId("bedrock-legacy", "claude-opus-4-6-v1", { regionScope: "us" });
//                                                         us.anthropic.claude-opus-4-6-v1
formatModelId("foundry", "my-deployment");               // my-deployment (deployment name)
```

## Check capabilities

The matrix tracks `mcpConnector`, `mcpTunnels`, `agentSkills`, `codeExecution`,
`programmaticToolCalling`, `filesApi`, `structuredOutputs`, `messageBatches`,
`betaHeaders`, `promptCaching`, `extendedThinking`, and `citations`. Values are
`true`, `false`, or `"conditional"` (see the backend's `notes`).

```ts
import { supports, backendsSupporting, getBackend } from "@mgcc/anthropic-backends";

supports("bedrock", "mcpConnector");   // false
supports("foundry", "agentSkills");    // "conditional" (Hosted-on-Anthropic only)
backendsSupporting("codeExecution");   // ["anthropic", "claude-platform-aws"]

getBackend("bedrock").notes?.general;
// "AWS-operated; Messages API at /anthropic/v1/messages (bedrock-mantle). anthropic-beta header not supported."
```

Key gotchas the matrix encodes: **MCP connector, Agent Skills, code execution,
programmatic tool calling, and the Files API are NOT available on Bedrock or
Vertex**, and on **Foundry** they require a Hosted-on-Anthropic deployment.

## Scripts

```bash
pnpm --filter @mgcc/anthropic-backends build
pnpm --filter @mgcc/anthropic-backends typecheck
pnpm --filter @mgcc/anthropic-backends test
```
