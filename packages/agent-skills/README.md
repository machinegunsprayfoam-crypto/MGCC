# @mgcc/agent-skills

Typed helpers for using Anthropic [Agent Skills](https://docs.anthropic.com/en/docs/build-with-claude/skills-guide)
through the beta Messages API. Skills (pre-built like `pptx`/`xlsx`/`docx`/`pdf`,
or custom workspace uploads) run in the code execution container and let the AI
Command Center generate documents and run domain-specific procedures.

This package handles the mechanical parts so callers don't hand-assemble the
`container.skills` payload:

- build the `container.skills` block + the required beta headers + the code
  execution tool,
- extract the `file_id`s of files Skills generate,
- drive the `pause_turn` continuation loop for long-running Skills.

No runtime dependencies; **transport-agnostic** — you bring the Messages API
client (the beta Messages endpoint, or MGCC's own wrapper).

> Skills require the code execution tool and are **not** supported on Vertex,
> Amazon Bedrock, or Foundry-on-Azure. Use the first-party Claude API or Claude
> Platform on AWS.

## Build a request

```ts
import {
  ANTHROPIC_SKILLS,
  anthropicSkill,
  buildSkillsRequest,
} from "@mgcc/agent-skills";

const body = buildSkillsRequest({
  model: "claude-opus-4-8",
  max_tokens: 4096,
  messages: [{ role: "user", content: "Create a presentation about Q3 results" }],
  skills: [anthropicSkill(ANTHROPIC_SKILLS.pptx)],
});
// body.container.skills → [{ type: "anthropic", skill_id: "pptx", version: "latest" }]
// body.tools           → [{ type: "code_execution_20250825", name: "code_execution" }]
// body.betas           → ["code-execution-2025-08-25", "skills-2025-10-02", "files-api-2025-04-14"]

// Send with any beta Messages transport:
const response = await client.beta.messages.create(body);
```

`buildSkillsRequest` validates the request (≤ 8 Skills, non-empty ids, valid
`type`) and throws `SkillsConfigError` otherwise. Options:

- `skills` — mix `anthropicSkill(id, version?)` and `customSkill(id, version?)`
  (both default to `latest`).
- `containerId` — reuse a container across turns.
- `extraTools` — append tools alongside the code execution tool.
- `files` (default `true`) — include the Files API beta for downloading output.
- `promptCaching` (default `false`) / `extraBetas` — extra beta flags, de-duped.
- `extra` — any other Messages fields (`system`, `temperature`, …).

## Download generated files

Skills return generated documents as `file_id`s inside the response; fetch them
with the Files API.

```ts
import { extractFileIds } from "@mgcc/agent-skills";

const fileIds = extractFileIds(response);
for (const fileId of fileIds) {
  const meta = await client.beta.files.retrieveMetadata(fileId);
  const content = await client.beta.files.download(fileId);
  // save content → meta.filename
}
```

## Long-running Skills (`pause_turn`)

Some Skills pause mid-operation and must be resumed. `runToCompletion` drives
the loop — appending the assistant turn, reusing the container id, and resending
— against a transport callback you supply:

```ts
import { runToCompletion } from "@mgcc/agent-skills";

const { response, responses, exhausted } = await runToCompletion({
  create: (req) => client.beta.messages.create(req),
  params: {
    model: "claude-opus-4-8",
    max_tokens: 4096,
    messages: [{ role: "user", content: "Process this large dataset" }],
    skills: [customSkill("skill_01AbCdEfGhIjKlMnOpQrStUv")],
  },
  maxTurns: 10, // default
});
// `exhausted` is true if it stopped still paused after maxTurns.
```

`isPauseTurn(response)`, `getContainerId(response)`, and
`getResponseText(response)` are exported for building your own loop.

## Multi-turn conversations

Pass `containerId` (from `getContainerId(response)`) on the next request and
include the prior assistant turn in `messages` to keep the same container. Note:
changing the Skills list between requests breaks prompt caching — keep it stable.

## Scripts

```bash
pnpm --filter @mgcc/agent-skills build      # emit dist/ (js + d.ts)
pnpm --filter @mgcc/agent-skills typecheck  # tsc --noEmit
pnpm --filter @mgcc/agent-skills test       # vitest run
```

## Limits (enforced / documented)

- **≤ 8 Skills per request** (enforced by `validateSkills`).
- Skills run with **no network access** and **no runtime package install** in
  the code execution container.
- Custom Skills are workspace-private and **do not** sync across surfaces
  (API vs claude.ai vs Claude Code).
