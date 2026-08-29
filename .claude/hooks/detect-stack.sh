#!/usr/bin/env bash
# Resolve the project's package manager and available verification scripts.
# Single source of truth for build commands — see .claude/rules/verification.md.
# Usage:
#   detect-stack.sh          # human-readable summary
#   detect-stack.sh --pm     # print package manager only
#   detect-stack.sh --has lint   # exit 0 if the script exists, 1 if not
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PKG="$ROOT/package.json"

# --- package manager -------------------------------------------------------
detect_pm() {
  [ -f "$ROOT/pnpm-lock.yaml" ]    && { echo pnpm; return; }
  [ -f "$ROOT/bun.lockb" ]         && { echo bun;  return; }
  [ -f "$ROOT/yarn.lock" ]         && { echo yarn; return; }
  [ -f "$ROOT/package-lock.json" ] && { echo npm;  return; }
  [ -f "$PKG" ]                    && { echo npm;  return; }
  echo none
}
PM="$(detect_pm)"

# --- scripts declared in package.json --------------------------------------
# Extracts top-level keys of the "scripts" object. Prefers node (present in any
# JS project); falls back to a line-oriented scan so the script still works
# without a runtime installed.
list_scripts() {
  [ -f "$PKG" ] || return 0
  if command -v node >/dev/null 2>&1; then
    node -e '
      try {
        const s = require(process.argv[1]).scripts || {};
        console.log(Object.keys(s).join("\n"));
      } catch (e) { process.exit(0); }
    ' "$PKG" 2>/dev/null
  else
    sed -n '/"scripts"[[:space:]]*:/,/}/p' "$PKG" \
      | grep -oE '"[a-zA-Z0-9:_-]+"[[:space:]]*:' \
      | tr -d '":' | tr -d ' ' | tail -n +2
  fi
}
SCRIPTS="$(list_scripts)"

has_script() { printf '%s\n' "$SCRIPTS" | grep -qx "$1"; }

# --- flags -----------------------------------------------------------------
case "${1:-}" in
  --pm)  echo "$PM"; exit 0 ;;
  --has) has_script "${2:-}" && exit 0 || exit 1 ;;
esac

# --- run command prefix ----------------------------------------------------
case "$PM" in
  pnpm) RUN="pnpm" ;;
  bun)  RUN="bun run" ;;
  yarn) RUN="yarn" ;;
  npm)  RUN="npm run" ;;
  *)    RUN="" ;;
esac

# --- framework fingerprints ------------------------------------------------
FRAMEWORK="unknown"
ls "$ROOT"/next.config.* >/dev/null 2>&1 && FRAMEWORK="next"
ls "$ROOT"/vite.config.* >/dev/null 2>&1 && FRAMEWORK="vite"
ls "$ROOT"/astro.config.* >/dev/null 2>&1 && FRAMEWORK="astro"
ls "$ROOT"/svelte.config.* >/dev/null 2>&1 && FRAMEWORK="sveltekit"
ls "$ROOT"/nuxt.config.* >/dev/null 2>&1 && FRAMEWORK="nuxt"
[ "$PM" = none ] && FRAMEWORK="static"

STYLING="unknown"
ls "$ROOT"/tailwind.config.* >/dev/null 2>&1 && STYLING="tailwind"
# Tailwind v4 has no config file — it is imported from CSS instead.
if [ "$STYLING" = unknown ] && [ -d "$ROOT/src" ]; then
  if find "$ROOT/src" -name '*.css' -maxdepth 4 -exec grep -lq 'tailwindcss' {} + 2>/dev/null; then
    STYLING="tailwind"
  fi
fi

TS="no"
[ -f "$ROOT/tsconfig.json" ] && TS="yes"

# --- report ----------------------------------------------------------------
echo "package manager : $PM"
echo "framework       : $FRAMEWORK"
echo "styling         : $STYLING"
echo "typescript      : $TS"
echo "verification commands (run only those marked available):"
for s in lint typecheck test build dev; do
  if has_script "$s"; then
    printf '  %-10s: available -> %s %s\n' "$s" "$RUN" "$s"
  elif [ "$s" = typecheck ] && [ "$TS" = yes ]; then
    printf '  %-10s: no script -> npx tsc --noEmit\n' "$s"
  else
    printf '  %-10s: n/a\n' "$s"
  fi
done

if [ "$PM" = none ]; then
  echo "note: no package.json — static project. Skip lint/typecheck/test/build."
  echo "      Verify visually and with the accessibility checklist instead."
fi
