#!/usr/bin/env bash
# PreToolUse hook — blocks edits to paths that must never be hand-modified.
# Reads the tool call as JSON on stdin. Exit 2 = block and show stderr to Claude.
set -uo pipefail

INPUT="$(cat)"

# Pull file_path out of tool_input without requiring jq.
extract_path() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' 2>/dev/null
  else
    printf '%s' "$INPUT" \
      | grep -oE '"(file_path|notebook_path)"[[:space:]]*:[[:space:]]*"[^"]*"' \
      | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'
  fi
}

FILE="$(extract_path)"
[ -z "$FILE" ] && exit 0

block() {
  echo "BLOCKED: $1" >&2
  echo "Path: $FILE" >&2
  exit 2
}

case "$FILE" in
  # Allowed: placeholder files that exist precisely to be committed.
  *.env.example|*.env.sample|*.env.template)
    exit 0 ;;
  *.env|*.env.*|*/.env)
    block "Secrets must not be written by an agent. Ask the user to edit .env manually, or write .env.example with placeholder values instead." ;;
  */node_modules/*|node_modules/*)
    block "node_modules is generated. Change the dependency or a patch file instead." ;;
  */.git/*|.git/*)
    block "Never hand-edit git internals. Use git commands." ;;
  *pnpm-lock.yaml|*package-lock.json|*yarn.lock|*bun.lockb)
    block "Lockfiles are generated. Run the package manager's install/add command instead." ;;
  */dist/*|dist/*|*/build/*|build/*|*/.next/*|.next/*|*/out/*|out/*)
    block "This is build output. Edit the source that produces it." ;;
esac

exit 0
