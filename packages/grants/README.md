# @mgcc/grants

Grant **finder → getter → writer** for the MGCC AI Command Center console,
backed by the [Granted](https://grantedai.com) database (84k+ live grants, 133k+
US foundations). Built for Machine Gun Spray Foam & Concrete Lifting — find
weatherization / energy-efficiency / building grants, pull the details, and
draft the application.

**Transport-agnostic and dependency-free.** You inject:
- a `GrantedCall` — runs a Granted tool and returns its text (wire it to your
  Granted MCP connector / API); and
- for the writer, any Claude backend (e.g. `@mgcc/mcp-connector` or
  `@mgcc/anthropic-backends`) to send the drafting request.

## 1. Finder — `findGrants`

```ts
import { findGrants } from "@mgcc/grants";

// `call` runs a Granted tool by name and returns its text output.
const call = (tool, args) => mcp.call(`mcp__Granted__${tool}`, args);

const { grants, reportedCount } = await findGrants(call, {
  query: "weatherization energy efficiency insulation retrofit",
  orgType: "Small Business", // eligibility filtering — pass this for MGCC
  state: "MO",               // optional
  limit: 6,
});

// grants: [{ name, funder, amount, deadline, summary, applyUrl, detailsUrl,
//            slug, confidence, fitScore, why[] }]
```

The parser is pinned to Granted's real output (see `src/fixtures.ts` — a live
capture) and always returns the `raw` text too, so nothing is lost if the
format shifts.

## 2. Getter — `getGrant`

```ts
import { getGrant } from "@mgcc/grants";

// Accepts a slug or a Granted details URL (e.g. grants[0].slug / .detailsUrl):
const { slug, detailsUrl, raw } = await getGrant(call, grants[0].slug!);
// raw = full eligibility, application link, deadline, funder info
```

Bonus callers: `searchFunders`, `getFunder`, `getPastWinners` (competitive
intelligence — who has won a federal program).

## 3. Writer — `buildGrantApplicationRequest`

The **AI grant writer**: builds a Claude request that drafts the application
from a grant + your business profile. It returns a request body — you send it
with your backend; the model's text response is the draft.

```ts
import { buildGrantApplicationRequest } from "@mgcc/grants";
import { McpConnectorClient } from "@mgcc/mcp-connector";

const company = {
  legalName: "Machine Gun Spray Foam & Concrete Lifting LLC",
  description: "Spray foam insulation, weatherization, and concrete lifting/leveling.",
  services: ["spray foam insulation", "weatherization", "concrete lifting"],
  orgType: "Small Business",
  state: "MO",
  // yearsInBusiness, certifications, setAsides, notes … all strengthen the draft
};

const details = await getGrant(call, grants[0].slug!);
const request = buildGrantApplicationRequest({
  grant: grants[0],
  grantDetails: details.raw,
  company,
  projectSummary: "Insulate 40 rural homes with closed-cell spray foam.",
  requestedAmount: "$250,000",
});

const client = new McpConnectorClient();
const draft = await client.send(request); // draft.content → the written sections
```

**Guardrails (built into the system prompt):** the writer drafts *only* from the
profile + grant you supply, never invents facts/numbers/certifications about the
business, and inserts clearly-marked `[TODO: …]` placeholders wherever it needs
information you didn't provide — then ends with a checklist of those TODOs to
finish before submitting. So it's an assistant that gets you 80% of the way, not
a black box that fabricates a submission.

Default sections: executive summary, organization background, statement of need,
project description, goals & objectives, expected outcomes, budget narrative
(override via `sections`).

> The writer builds the request; it does **not** submit to any funder. A human
> reviews, fills the TODOs, and submits through the funder's own portal
> (`grant.applyUrl`).

## Scripts

```bash
pnpm --filter @mgcc/grants build
pnpm --filter @mgcc/grants typecheck
pnpm --filter @mgcc/grants test
```
