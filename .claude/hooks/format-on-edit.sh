#!/usr/bin/env bash
# PostToolUse hook — formats the file that was just edited, if the project has a
# formatter installed locally. Never installs anything. Never fails the tool call.
set -uo pipefail

INPUT="$(cat)"
ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

if command -v jq >/dev/null 2>&1; then
  FILE="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
else
  FILE="$(printf '%s' "$INPUT" \
    | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/')"
fi

[ -z "$FILE" ] || [ ! -f "$FILE" ] && exit 0

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.scss|*.json|*.md|*.mdx|*.html|*.yml|*.yaml) ;;
  *) exit 0 ;;
esac

# Local formatters only — a global or downloaded formatter would apply the wrong
# config and silently reformat the project against its own conventions.
if [ -x "$ROOT/node_modules/.bin/biome" ]; then
  "$ROOT/node_modules/.bin/biome" format --write "$FILE" >/dev/null 2>&1
elif [ -x "$ROOT/node_modules/.bin/prettier" ]; then
  "$ROOT/node_modules/.bin/prettier" --write --ignore-unknown "$FILE" >/dev/null 2>&1
fi

exit 0
