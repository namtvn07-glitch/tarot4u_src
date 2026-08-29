---
description: Review the working diff for design-system, a11y, and correctness issues
argument-hint: [file path | --staged | (empty = full working diff)]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(git ls-files:*), Bash(.claude/hooks/detect-stack.sh:*), Task
---

# /design-review — Pre-Commit Review

> Flow: `/plan` → `/execute` → **`/design-review`** → `/finish` → `/commit`

Scope argument: **$ARGUMENTS**

Working tree:
!`git status --short`

Changed files:
!`git diff --name-only HEAD 2>/dev/null; git diff --name-only --staged 2>/dev/null`

> [!IMPORTANT]
> `git diff` misses **untracked files**. New components show as `??` in the
> status above and are the most likely place for problems. Review them too.

## Step 1 — Scope

- No argument → every changed **and untracked** source file above
- `--staged` → staged only
- A path → that file or directory

## Step 2 — Load the Rules

Read before judging anything: `.claude/rules/design-system.md`,
`.claude/rules/accessibility.md`, `.claude/rules/code-style.md`, and any
relevant `docs/learned/*.md`.

## Step 3 — Review Lenses

Apply each lens that matches the changed files.

### 3.1 Design system (any file producing pixels)

For a diff spanning more than a few files, delegate this lens to the
`design-system-guardian` agent — it greps the whole surface for drift in one pass.

| Check | Rule |
|-------|------|
| Magic numbers | Every color / spacing / radius / shadow / z-index is a token |
| Arbitrary values | No `mt-[13px]`, `w-[347px]`, `text-[#6b21a8]` |
| Scale drift | New spacing/type values fit the existing ramp |
| Duplication | This component doesn't near-duplicate an existing one |
| Layout ownership | No outer margin baked into a reusable component |
| Theme | Both themes handled — no hardcoded light-mode color |

### 3.2 Responsive

- [ ] Verified at 375 / 768 / 1280px — not assumed
- [ ] No horizontal page scroll at any width; wide content scrolls in its own container
- [ ] Line length capped (~65–75ch) for body copy
- [ ] Touch targets ≥ 44×44px
- [ ] Images have `max-width: 100%` and intrinsic dimensions (no layout shift)

### 3.3 Accessibility (delegate a full sweep to `a11y-auditor` for large diffs)

- [ ] Semantic element used before any `role`/`aria-*`
- [ ] Every control has an accessible name
- [ ] Keyboard reachable, operable, escapable — no traps
- [ ] Visible focus indicator, ≥3:1 contrast
- [ ] Text contrast ≥4.5:1 (≥3:1 large), **in both themes**
- [ ] Color is never the only signal
- [ ] Images: descriptive `alt`, or `alt=""` if decorative
- [ ] Headings descend without skipping levels
- [ ] `prefers-reduced-motion` honored

### 3.4 Correctness

- [ ] Loading / empty / error / success all handled
- [ ] No `console.log`, no commented-out code, no unused imports
- [ ] No silent `catch {}`
- [ ] No `any` where a real type is knowable
- [ ] Keys on list items are stable, not array indices over reorderable data
- [ ] Effects have correct dependencies and clean up subscriptions/listeners

### 3.5 Security

- [ ] No hardcoded credentials, tokens, or API keys
- [ ] No secrets in client-visible code or logs
- [ ] User-supplied content escaped — `dangerouslySetInnerHTML` / `v-html` /
      `innerHTML` justified and sanitized
- [ ] External links carry `rel="noopener noreferrer"`

### 3.6 Blast radius

For each **shared** file changed (component, token, util), find its consumers:

```bash
grep -rn "ComponentName" src/ --include=*.tsx --include=*.jsx --include=*.vue
grep -rn -- "--token-name" src/
```

| Changed | Must check |
|---------|-----------|
| Shared component | Every render site — did a prop's meaning change? |
| Token value | Every consumer — contrast still passing everywhere? |
| Route / URL | Every link and redirect pointing at it |
| Public prop signature | Every call site |

> [!CAUTION]
> Modifying a shared primitive without checking its consumers is how one "small
> fix" breaks six screens.

### 3.7 Duplication

```bash
grep -rn "<a distinctive line from the new code>" src/
```
Same logic in 2+ places → extract. Copy-paste differing only in a variable name
→ parameterize it. Flag before approving.

### 3.8 Gates

Run the gate ladder from `.claude/rules/verification.md`. Any failure is 🔴 Critical.

## Step 4 — Report

```markdown
# 📋 Review Report

## Summary
- Files reviewed: X (including Y untracked)
- Issues: Z (N critical)
- Status: ✅ Ready to commit / ⚠️ Needs fixes / ❌ Major rework

## 🔴 Critical — must fix before commit
1. **[src/components/Card.tsx:42]** Hardcoded `#6b21a8` bypasses the token system
   - Rule: design-system.md → The Token Rule
   - Fix: `var(--color-accent)`

## 🟡 Warning — should fix
1. **[src/pages/Home.tsx:15]** No empty state for the readings list
   - Suggestion: add an empty state before this ships

## 🟢 Info

## ✅ Clean
- src/lib/shuffle.ts

## Gate Summary
| Lens | Status |
|------|--------|
| Design system | ✅/❌ |
| Responsive | ✅/❌ |
| Accessibility | ✅/❌ |
| Correctness | ✅/❌ |
| Security | ✅/❌ |
| Blast radius | ✅/❌ |
| Duplication | ✅/❌ |
```

## Step 5 — Offer to Fix

```
Fix these? — `all` / `critical` / `no`
```
Wait for the answer. Do not auto-fix.

> [!IMPORTANT]
> Report what you actually checked. If you could not run the app, the responsive
> and visual items are `⏭️ skipped (could not run dev server)` — never `✅`.
