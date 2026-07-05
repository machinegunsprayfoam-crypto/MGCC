# Agent Skills — Authoring & Governance

How MGCC authors, reviews, evaluates, and operates [Agent Skills](https://docs.anthropic.com/en/docs/build-with-claude/skills-guide)
across the AI Command Center. Skills are folders of instructions (+ optional
scripts/resources) that extend what Claude can do — brand-formatted documents,
CRM/estimating procedures, report generation.

- **Consume Skills in code:** [`@mgcc/agent-skills`](../packages/agent-skills/README.md).
- **This doc** covers the human side: writing good Skills and governing them at
  scale. Skills run in the code execution container; the API allows **≤ 8 per
  request**.

> Custom Skills are workspace-private and **do not sync across surfaces**
> (API vs claude.ai vs Claude Code). Keep source in Git as the single source of
> truth and upload to each surface separately.

---

## Part 1 — Authoring Skills

### SKILL.md structure (hard requirements)

A Skill is a directory with `SKILL.md` at the top level, YAML frontmatter + a
markdown body:

- **`name`** — ≤ 64 chars, lowercase letters/numbers/hyphens only, no XML tags,
  no reserved words (`anthropic`, `claude`).
- **`description`** — non-empty, ≤ 1024 chars, no XML tags. **This is what
  drives Skill selection** — write it in **third person** and include both *what
  the Skill does* and *when to use it* (with trigger terms).
- Total upload ≤ 30 MB; all files share a common root directory; forward slashes
  in paths only.

```yaml
---
name: formatting-sales-reports
description: Formats sales reports to MGCC brand standards, builds pivot tables, and generates charts. Use when preparing sales or pipeline reports, or when the user mentions spreadsheets or .xlsx files.
---
```

### Core principles

1. **Be concise — context is a shared budget.** Assume Claude is already smart;
   only add what it doesn't know. Challenge every paragraph ("does this justify
   its tokens?"). Keep the `SKILL.md` body **under ~500 lines**.
2. **Match freedom to fragility.** High freedom (prose steps) when many
   approaches work; medium (parameterized scripts) when a pattern is preferred;
   low (exact scripts, "run exactly this") when operations are fragile and order
   matters (e.g. migrations).
3. **Test across the models you use** (Haiku / Sonnet / Opus). What Opus infers,
   Haiku may need spelled out.
4. **Consistent terminology** — pick one term ("field", "extract") and stick to it.
5. **No time-sensitive info** in the main body — put deprecated guidance in an
   "old patterns" `<details>` section.

### Progressive disclosure

`SKILL.md` is a table of contents; Claude loads referenced files only when
needed (no context cost until read). Rules:

- **Keep references one level deep from `SKILL.md`** — Claude may only partially
  read files reached through nested references.
- Organize reference files by domain (`reference/finance.md`, `reference/sales.md`)
  so unrelated context isn't loaded.
- For reference files > 100 lines, add a table of contents at the top.
- Naming: prefer **gerund form** (`processing-pdfs`, `analyzing-spreadsheets`);
  avoid vague names (`helper`, `utils`, `data`).

### Workflows, feedback loops, and scripts

- Break complex tasks into numbered steps; for fragile multi-step work, give a
  **checklist** Claude copies into its response and ticks off.
- Build **validator → fix → repeat** loops (run a validation script/checklist,
  fix errors, only then proceed).
- For scripts: **solve, don't punt** (handle errors explicitly rather than
  failing to Claude); no "voodoo constants" (justify every value); prefer
  pre-made **utility scripts** (more reliable, save tokens) and say whether
  Claude should *execute* or *read* each one.
- **Plan → validate → execute** for batch/destructive ops: have Claude write a
  plan file, validate it with a script, then apply.
- Skills run with **no network access** and **no runtime package install** on
  the API — list required packages and confirm they're pre-installed.
- MCP tool references must be fully qualified: `ServerName:tool_name`.

### Evaluation-driven development

Write evaluations **before** extensive docs:

1. Run Claude on representative tasks **without** the Skill; note the failures.
2. Build 3–5 eval scenarios (should-trigger, should-not-trigger, ambiguous).
3. Baseline performance without the Skill.
4. Write minimal instructions to close the gaps and pass the evals.
5. Iterate.

Develop with two Claude instances: **Claude A** helps write/refine the Skill;
**Claude B** (fresh, Skill loaded) tests it on real tasks; bring B's failures
back to A. There's no built-in eval runner — MGCC owns the harness.

---

## Part 2 — Governance

### Security review & vetting

Treat installing a Skill like installing software in production. Assess each
Skill against these risk indicators before approval:

| Indicator | Look for | Concern |
| --- | --- | --- |
| Code execution | scripts (`*.py`, `*.sh`, `*.js`) | High — full env access |
| Instruction manipulation | "ignore safety", hide actions, conditional behavior | High — bypasses controls |
| MCP references | `ServerName:tool_name` | High — extends access |
| Network access | URLs, `fetch`, `curl`, `requests` | High — exfiltration vector |
| Hardcoded credentials | keys/tokens/passwords in files | High — secrets in Git + context |
| File-system scope | paths outside the Skill dir, `../`, broad globs | Medium |
| Tool invocations | directs Claude to bash/file ops | Medium |

**Review checklist (every third-party or internal Skill):**

1. Read **all** directory content (SKILL.md, referenced files, scripts).
2. Run scripts in a sandbox; confirm behavior matches the stated purpose.
3. Check for adversarial instructions (ignore rules, hide actions, exfiltrate).
4. Search for network calls.
5. Verify **no hardcoded credentials** (use env/secret stores).
6. List every tool/command the Skill invokes; weigh combined risk (file-read +
   network together).
7. Confirm any external URL destinations.
8. Verify no read-then-transmit exfiltration patterns (including via Claude's
   own responses).

**Separation of duties:** authors do not review their own Skills.

### Evaluation gates before production

Require passing evals on these dimensions:

| Dimension | Failure it catches |
| --- | --- |
| Triggering accuracy | fires on the wrong queries / misses the right ones |
| Isolation | references files that don't exist |
| Coexistence | a too-broad description steals triggers from other Skills |
| Instruction following | skips validation, uses wrong libraries |
| Output quality | malformed or incomplete results |

Authors submit an eval suite (3–5 queries/Skill) covering trigger, no-trigger,
and edge cases, tested across the models MGCC uses.

### Lifecycle

**Plan → Create & review → Test → Deploy → Monitor → Iterate/Deprecate.**

- **Create & review:** best-practices author + security review + eval suite;
  separate reviewer.
- **Test:** in isolation **and** alongside the existing Skill set (coexistence).
- **Deploy:** upload via the Skills API for workspace-wide access; record in the
  internal registry.
- **Monitor:** usage analytics aren't in the Skills API — add **app-level
  logging** of which Skills are in each request; re-run evals periodically to
  catch drift.
- **Signals to act:** declining trigger accuracy → fix description/instructions;
  coexistence conflicts → consolidate/narrow; low output quality → rewrite +
  add validation; persistent failures → deprecate.

### Organizing at scale

- **Recall limits:** each Skill's name+description competes for attention. Add
  Skills only while evals show recall stays accurate; the API caps at **8 per
  request**.
- **Start specific, consolidate later:** begin with narrow, workflow-specific
  Skills; merge into role bundles only when evals confirm equivalent performance.
- **Role-based bundles** keep each user's active set focused — e.g. Sales (CRM,
  pipeline reporting, proposals), Field/Estimating, Finance (reports, validation,
  audit prep).

### Distribution & version control

- **Git is the source of truth.** Each Skill directory maps to a tracked folder;
  review via PRs; use signed commits for provenance.
- **API distribution** is workspace-scoped (available to all workspace members).
- **Versioning:** production pins **specific versions** (run the full eval suite
  before promoting; treat each update as a new deployment requiring security
  review); dev uses `latest`. Keep the previous version as an immediate rollback.
  Compute checksums of reviewed Skills and verify at deploy time.
- **Cross-surface:** Skills do **not** sync across API / claude.ai / Claude Code
  — implement your own sync from the Git source if you deploy to more than one.

### Internal registry — record per Skill

Purpose · Owner (team/individual) · Current deployed version · Dependencies
(MCP servers, packages, services) · Last evaluation date + result.

---

## References

- [Using Skills with the API](https://docs.anthropic.com/en/docs/build-with-claude/skills-guide)
- [Skill authoring best practices](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [Skills for enterprise](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/skills-for-enterprise)
- [`@mgcc/agent-skills`](../packages/agent-skills/README.md) — the client-side code
