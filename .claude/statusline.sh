#!/usr/bin/env bash
# Status line: <dir> <branch><dirty> · <model> · <open tasks>
# Receives the session JSON on stdin.
set -uo pipefail

INPUT="$(cat)"

field() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -r "$1 // empty" 2>/dev/null
  else
    printf '%s' "$INPUT" \
      | grep -oE "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" \
      | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'
  fi
}

CWD="$(field '.workspace.current_dir' 'current_dir')"
[ -z "$CWD" ] && CWD="$PWD"
MODEL="$(field '.model.display_name' 'display_name')"
[ -z "$MODEL" ] && MODEL="claude"

DIR="$(basename "$CWD")"

# --- git ---
BRANCH=""
if git -C "$CWD" rev-parse --git-dir >/dev/null 2>&1; then
  # --show-current reports the branch name even before the first commit,
  # where rev-parse would misleadingly say "HEAD".
  BRANCH="$(git -C "$CWD" branch --show-current 2>/dev/null)"
  [ -z "$BRANCH" ] && BRANCH="detached"
  if [ -n "$(git -C "$CWD" status --porcelain 2>/dev/null)" ]; then
    BRANCH="${BRANCH}*"
  fi
fi

# --- open tasks in .claude/brain ---
TASKS=""
BRAIN="$CWD/.claude/brain"
if [ -d "$BRAIN" ]; then
  N="$(grep -rl '^- \[ \]' "$BRAIN"/*/task.md 2>/dev/null | wc -l | tr -d ' ')"
  [ "${N:-0}" -gt 0 ] 2>/dev/null && TASKS="${N} open"
fi

OUT="📁 $DIR"
[ -n "$BRANCH" ] && OUT="$OUT  ⎇ $BRANCH"
OUT="$OUT  ·  $MODEL"
[ -n "$TASKS" ] && OUT="$OUT  ·  📋 $TASKS"

printf '%s' "$OUT"
