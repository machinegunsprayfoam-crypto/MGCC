#!/bin/bash
# MGCC SessionStart hook: install workspace deps so tests/typecheck are ready.
# Runs only in Claude Code on the web (the container is ephemeral and the repo
# is cloned fresh each session). Idempotent and non-interactive.
set -euo pipefail

# Only run in the remote/web environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# pnpm workspace install (not --frozen-lockfile: prefer the cacheable install so
# a lockfile drift doesn't hard-fail session startup).
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  echo "pnpm not found on PATH; skipping dependency install" >&2
fi
