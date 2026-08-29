#!/usr/bin/env bash
# SessionStart hook — injects a short project snapshot into context so the first
# turn doesn't have to rediscover the stack or forget an in-flight task.
# Keep the output SHORT; it is prepended to every session.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

echo "=== Project snapshot ==="
if [ -x "$ROOT/.claude/hooks/detect-stack.sh" ]; then
  # Fingerprint lines only — the full command list would be noise every session.
  "$ROOT/.claude/hooks/detect-stack.sh" 2>/dev/null \
    | grep -E '^(package manager|framework|styling|typescript|note:)'
fi

BRAIN="$ROOT/.claude/brain"
if [ -d "$BRAIN" ]; then
  OPEN="$(grep -rl '^- \[ \]' "$BRAIN"/*/task.md 2>/dev/null | head -3)"
  if [ -n "$OPEN" ]; then
    echo "unfinished tasks (have open checklist items):"
    for f in $OPEN; do
      echo "  - $(dirname "${f#"$BRAIN"/}")"
    done
    echo "  -> /execute to resume, or ignore if starting something new."
  fi
fi
exit 0
