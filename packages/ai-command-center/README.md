# @mgcc/ai-command-center

The integration layer for MGCC's **AI Command Center** module. Where the other
`@mgcc/*` packages are standalone building blocks, this one **depends on them
and wires them into console-ready services**.

First service: **grants**, composing
[`@mgcc/grants`](../grants/README.md) (find → get → draft) +
[`@mgcc/mcp-connector`](../mcp-connector/README.md) (send to Claude) +
[`@mgcc/anthropic-backends`](../anthropic-backends/README.md) (per-backend model
formatting) + [`@mgcc/shared`](../shared/README.md) (module registry).

## GrantsService

```ts
import { GrantsService, senderFromMcpConnector, MACHINE_GUN_SPRAY_FOAM } from "@mgcc/ai-command-center";
import { McpConnectorClient } from "@mgcc/mcp-connector";

const client = new McpConnectorClient();            // reads ANTHROPIC_API_KEY

const grants = new GrantsService({
  // How the console reaches Granted (MCP connector, API, …):
  grantedCall: (tool, args) => mcp.call(`mcp__Granted__${tool}`, args),
  // How drafts are sent to Claude:
  sender: senderFromMcpConnector(client),
  company: MACHINE_GUN_SPRAY_FOAM,                  // default applicant profile
  backendId: "anthropic",                           // formats the model id per backend
});

// 1. FIND
const { grants: hits } = await grants.search({
  query: "weatherization energy efficiency insulation",
  orgType: "Small Business",
});

// 2. GET (optional — draftApplication can do this for you via fetchDetails)
const details = await grants.getDetails(hits[0].slug!);

// 3. DRAFT  (find → get → write → send, in one call)
const { draft, request } = await grants.draftApplication({
  grant: hits[0],
  fetchDetails: true,
  projectSummary: "Insulate 40 rural homes with closed-cell spray foam.",
  requestedAmount: "$250,000",
});
// draft = the written application; request = the exact prompt sent (auditable)
```

### What it wires together

| Step | Package used |
| --- | --- |
| `search()` — finder | `@mgcc/grants` → Granted |
| `getDetails()` — getter | `@mgcc/grants` → Granted |
| `draftApplication()` — writer | `@mgcc/grants` builds the request, `@mgcc/anthropic-backends` formats the model id for `backendId`, `sender` (`@mgcc/mcp-connector`) sends it, `getResponseText` extracts the draft |
| `MODULE` / `IS_REGISTERED_MODULE` | `@mgcc/shared` module registry |

Set `backendId` to target a different platform — e.g. `"bedrock"` formats the
model as `anthropic.claude-opus-4-8` automatically.

### A console HTTP shape this maps onto

```
GET  /grants?query=…&orgType=Small Business   → search()
GET  /grants/:slug                            → getDetails()
POST /grants/:slug/draft                      → draftApplication()
```

## Company profile

`MACHINE_GUN_SPRAY_FOAM` is a starter profile — fill in the `[TODO]` fields
(state, years in business, certifications, set-asides, differentiators) to get
stronger drafts with fewer `[TODO:]` placeholders for you to complete.

## Build / test

Tests and typecheck resolve the `@mgcc/*` deps to **source** (via
`vitest.config.ts` aliases and tsconfig `paths`), so they run without building
the dependencies first. `build` resolves to the deps' `dist` instead, so run it
topologically:

```bash
pnpm --filter @mgcc/ai-command-center test        # from source, no build needed
pnpm --filter @mgcc/ai-command-center typecheck
pnpm -r build                                     # topological: deps build first
```
