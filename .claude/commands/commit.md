---
description: Draft a Conventional Commit message from the staged diff, confirm, then commit
argument-hint: [optional extra context for the message]
allowed-tools: Read, Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*), Bash(git rev-parse:*), Bash(git branch:*)
---

# /commit — Commit

Extra context: **$ARGUMENTS**

Branch: !`git rev-parse --abbrev-ref HEAD 2>/dev/null`
Status: !`git status --short`
Staged: !`git diff --cached --stat`
Recent style: !`git log --oneline -8 2>/dev/null`

## Step 1 — Stage

Stage the files changed **in this conversation** — the ones you edited. If
something is already staged, keep it staged.

> [!CAUTION]
> Never `git add -A` blindly. Unrelated local changes, scratch files, and
> `.env` files get swept in. Stage the specific paths you touched.

Nothing to commit → say so and stop.

## Step 2 — Read the Diff

`git diff --cached`. Read what actually changed. The message describes the
**change**, not the files — a message you could have written from the filenames
alone is a wasted message.

## Step 3 — Draft

```
<type>(<scope>): <summary>

- <what changed and why>
- <second change>
```

**Type**

| Type | For |
|------|-----|
| `feat` | New user-visible capability |
| `fix` | Bug fix |
| `style` | Visual/CSS change with no behavior change |
| `refactor` | Restructure, same behavior |
| `perf` | Performance |
| `a11y` | Accessibility improvement |
| `chore` | Config, deps, tooling |
| `docs` | Documentation only |
| `test` | Tests only |

**Scope** — derive from the paths actually changed:

| Path pattern | Scope |
|--------------|-------|
| `src/components/ui/**`, design-system dir | `ui` |
| `**/tokens*`, `tailwind.config.*`, theme files | `tokens` |
| `src/app/**`, `src/pages/**`, `src/routes/**` | the route name (`home`, `reading`) |
| `src/lib/**`, `src/utils/**`, `src/hooks/**` | `lib` |
| `public/**`, asset dirs | `assets` |
| `.claude/**` | `workflow` |
| `docs/**` | `docs` |
| root config files | `config` |
| Several areas | the dominant one; mention the rest in the body |

**Rules**
- Summary ≤72 chars, lowercase, imperative, no trailing period
- Body says **what and why**, not how — the diff already shows how
- English
- One logical change per commit. If the body needs "and also", it's two commits —
  say so and offer to split.

Match the repo's existing style from the log above if it differs from this.

## Step 4 — Present and Stop

```
📝 Proposed commit:

<message>

👉 1 = commit   2 = edit (tell me what to change)   3 = cancel
```

> [!CAUTION]
> **STOP. Wait for the reply. Never auto-commit.**

## Step 5 — Act

- `1` / `ok` / `commit` / `lgtm` → run the commit
- `2` + notes → revise, show Step 4 again
- `3` / `cancel` → stop, leave everything staged

## Step 6 — Confirm

Show `git log -1 --stat` so the user sees exactly what landed.

> [!IMPORTANT]
> Do not push. Pushing is a separate, explicit decision.
