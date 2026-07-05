# @mgcc/programmatic-tools

Typed helpers for Anthropic [programmatic tool calling](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/programmatic-tool-calling):
Claude calls your tools from Python inside the code execution container, cutting
model round-trips and token use in multi-tool workflows (fan-out lookups, large
result filtering, agentic search).

This package handles the request/response plumbing so callers don't hand-manage
the `allowed_callers` wiring or the pause/continue loop:

- define tools with the right `allowed_callers`,
- pull programmatic `tool_use` blocks out of responses by `caller`,
- drive the `tool_result` continuation loop (with the API's message-formatting
  and container rules baked in).

No runtime dependencies; **transport-agnostic**. Requires the code execution
tool `code_execution_20260120` (or later) and a compatible model. Available on
the Claude API, Claude Platform on AWS, and Foundry (Hosted on Anthropic); not
on Bedrock or Vertex.

## Define tools

```ts
import { codeExecutionTool, programmaticTool } from "@mgcc/programmatic-tools";

const tools = [
  codeExecutionTool(), // { type: "code_execution_20260120", name: "code_execution" }
  programmaticTool({
    name: "query_database",
    // Document the OUTPUT format — Claude deserializes the result in code.
    description: "Execute a SQL query. Returns a JSON array of row objects.",
    input_schema: {
      type: "object",
      properties: { sql: { type: "string", description: "SQL to run" } },
      required: ["sql"],
    },
  }),
];
```

`programmaticTool` sets `allowed_callers: ["code_execution_20260120"]`;
`directTool` sets `["direct"]`; `dualTool` allows both. Prefer one mode per tool
for clearer guidance. `allowed_callers` is guidance, **not** a security boundary
— still be ready to handle a direct `tool_use` for any tool you define.

## Drive the loop

`runToolLoop` sends the request, runs each pending programmatic tool via your
`executeTool`, answers with a user message of **only** `tool_result` blocks
(required), reuses the container id (required while calls are pending), and
resends the same `tools` — until the turn completes.

```ts
import { runToolLoop } from "@mgcc/programmatic-tools";

const { response, exhausted, directToolUse } = await runToolLoop({
  create: (req) => client.messages.create(req),
  request: {
    model: "claude-opus-4-8",
    max_tokens: 4096,
    messages: [{ role: "user", content: "Which region had the highest revenue?" }],
    tools,
  },
  executeTool: async (toolUse) => {
    // toolUse.input is the tool's arguments; return a STRING (JSON is ideal).
    const rows = await db.query(toolUse.input.sql as string);
    return JSON.stringify(rows);
  },
  maxTurns: 10, // default
});

if (directToolUse) {
  // Claude called a direct-only tool; handle it the traditional way.
} else if (exhausted) {
  // Hit maxTurns while still paused.
} else {
  // response is the completed turn.
}
```

## Read responses yourself

```ts
import {
  getProgrammaticToolUses,
  getDirectToolUses,
  groupByCodeExecution,
  isProgrammaticPause,
  toolResult,
  getContainerId,
} from "@mgcc/programmatic-tools";

if (isProgrammaticPause(response)) {
  for (const [codeRunId, calls] of groupByCodeExecution(response)) {
    // calls[].caller.tool_id === codeRunId (the server_tool_use that made them)
  }
  const results = getProgrammaticToolUses(response).map((tu) =>
    toolResult(tu.id, "…string result…"),
  );
  // send { role: "user", content: results } with container: getContainerId(response)
}
```

## Constraints to know (from the docs)

- The user message answering programmatic calls must contain **only**
  `tool_result` blocks (no text). Enforced by `runToolLoop`.
- Programmatic `tool_result` content must be a **string or text blocks** —
  image/document results are rejected.
- The **container id is required** on a continuation with pending calls.
- Return results within ~4 minutes or the pending call raises `TimeoutError`
  inside Claude's code; watch the paused response's `expires_at`.
- Not compatible with: `strict: true` tools, forcing a programmatic tool via
  `tool_choice`, `disable_parallel_tool_use: true`, MCP-connector tools, or
  tools whose `input_schema` has a recursive `$ref`.

## Scripts

```bash
pnpm --filter @mgcc/programmatic-tools build
pnpm --filter @mgcc/programmatic-tools typecheck
pnpm --filter @mgcc/programmatic-tools test
```
