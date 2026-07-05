# MGCC — agent guide

Machine Gun Command Center: the operating platform for Machine Gun Spray Foam &
Concrete Lifting LLC. pnpm monorepo (Node ≥ 20, TypeScript, ESM).

## Layout

```
apps/
  web/                  Next.js app — STUB (only package.json; no source/tsconfig yet)
packages/
  shared/               @mgcc/shared — common types/utils (module registry)
  mcp-connector/        @mgcc/mcp-connector — Anthropic MCP connector + tunnel URL helpers
  agent-skills/         @mgcc/agent-skills — Agent Skills via the Messages API
  programmatic-tools/   @mgcc/programmatic-tools — programmatic tool calling
  vision/               @mgcc/vision — image token cost / resize / coordinate rescale
  anthropic-backends/   @mgcc/anthropic-backends — Claude backend registry + capability matrix
  grants/               @mgcc/grants — grant finder / getter / AI writer (Granted-backed)
  ai-command-center/    @mgcc/ai-command-center — integration layer; wires the above into
                        console services (GrantsService: find → get → draft)
docs/
  mcp-tunnels-setup.md          operator runbook (Console + Helm + Docker Compose)
  agent-skills-governance.md    Skills authoring + governance reference
```

The `@mgcc/*` packages are a Claude-integration layer for the planned **AI
Command Center** module. Each package README has usage + the exact API.

## Build / test / typecheck

Root install works now (`@mgcc/shared` satisfies web's `workspace:*` dep):

```bash
pnpm install                      # from repo root
pnpm -r test                      # all packages (108 tests today)
pnpm -r typecheck                 # NB: excludes web (stub, would fail)
pnpm --filter @mgcc/vision test   # one package
```

Per-package scripts: `build` (emit dist), `typecheck` (`tsc --noEmit`), `test`
(vitest). Root `pnpm -r typecheck`/`build` currently trip on `apps/web` because
it's a stub with no `tsconfig.json`/source — filter to `@mgcc/*` packages, or
wire up web before relying on the root scripts.

## Package conventions (follow these when adding a package)

- **Dependency-free at runtime** and **transport-agnostic** where it applies:
  the Claude packages build/validate payloads and take an injected `fetch` or a
  `create` callback rather than bundling an HTTP client. Keeps them usable from
  any backend (see `@mgcc/anthropic-backends`).
- **tsconfig**: `tsconfig.json` extends `../../tsconfig.base.json` with
  `rootDir: src`, `types: []`. A separate `tsconfig.build.json` sets
  `noEmit:false`, `outDir:dist`, `declaration`, sourcemaps, and — importantly —
  **`incremental: false`**. The base config's `incremental:true` writes a
  `.tsbuildinfo` that makes `tsc` *skip emit* when `dist` was deleted but the
  info file remains; `incremental:false` guarantees a full emit every build.
- **ESM imports use `.js` extensions** (`./types.js`) even though sources are
  `.ts` — required for the emitted ESM and handled by vitest.
- With `types: []`, reading `process.env` needs a minimal ambient decl (see
  `mcp-connector/src/globals.d.ts`).
- Ports of reference algorithms: match the source exactly. `@mgcc/vision` uses
  banker's rounding (round-half-to-even) to reproduce Python's `round()`; its
  test pins the documented `resizedSize(1075,1520) → 924×1307` example.
- New package quickstart: copy `tsconfig.json` + `tsconfig.build.json` from an
  existing package; give it `package.json` scripts build/typecheck/test.
- **Cross-package deps** (a package importing another `@mgcc/*`, e.g.
  `ai-command-center`): resolve to *source* for typecheck/test so no pre-build is
  needed — add tsconfig `paths` (`@mgcc/x` → `../x/src/index.ts`, drop `rootDir`
  from the typecheck config) and matching `vitest.config.ts` `resolve.alias`.
  The build config re-adds `rootDir: src` and clears `paths` (`"paths": {}`) so
  emit resolves deps via their `dist`; run `pnpm -r build` (topological — deps
  build first). Consuming packages remain green in `pnpm -r test` with no build.

## Git workflow

- Work on branch `claude/mcp-connector-qumy8a`; commit + push there.
- Don't open a PR unless asked. Push with `git push -u origin <branch>`.
- End commit messages with the `Co-Authored-By` / `Claude-Session` trailers.

## Available tooling (use it, don't hand-roll)

This environment has many MCP connectors (GitHub, GovTribe — relevant to the
Government Contracting module — Linear, Notion, Slack, Gmail, Airtable, Stripe,
QuickBooks, Google Drive/Calendar, and more) and skills (`deep-research`,
`code-review`, `verify`, `security-review`, `dataviz`, …). Prefer an MCP tool /
skill / subagent over doing broad manual work by hand. GitHub actions go
through the `mcp__github__*` tools (no `gh` CLI).
