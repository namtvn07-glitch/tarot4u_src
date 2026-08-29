---
description: Implement an approved plan, layer by layer, with resumable checkpoints
argument-hint: [task-slug] | --step N | --dry-run
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task
---

# /execute — Implement the Plan

> Flow: `/plan` → review → **`/execute`** → `/design-review` → `/finish` → `/commit`

Argument: **$ARGUMENTS**

## Step 1 — Locate the Task

1. If a slug was given → `.claude/brain/<slug>/`
2. Otherwise → the task created in this conversation
3. Otherwise → the most recent `.claude/brain/*/task.md` with unchecked items;
   confirm with the user before acting on it

**Block and ask** if: no plan exists, or the plan has no "Proposed Changes"
section. `/execute` implements a plan; it does not invent one.

**Resume, don't restart.** Read `task.md` first. Items already `[x]` are done —
skip them. This is what makes an interrupted run cheap to pick back up.

If `--dry-run`: print what you would change, file by file, and stop.

## Step 2 — Implement in Dependency Order

```
1. Tokens / theme        (nothing else can be correct before these)
   ↓
2. Primitives            (Button, Input, Card — shared building blocks)
   ↓
3. Composed components   (assembled from primitives)
   ↓
4. Pages / routes        (wire components to data and navigation)
   ↓
5. Content & copy        (real strings, real alt text — not lorem ipsum)
```

Working bottom-up (page first, tokens last) means rewriting the page once the
primitives land. Follow the order.

### Non-negotiables while writing

- **Tokens, not magic numbers.** No `padding: 13px`, no `#6b21a8`, no `mt-[13px]`.
- **All four states.** Any surface that loads data gets loading, empty, error,
  and success. Shipping only the success path is shipping an unfinished feature.
- **Semantic HTML first.** `<button>` before `<div role="button">`.
- **Accessible name on every control.** Icon-only buttons always need one.
- **Both themes**, if the project has them — no hardcoded light-mode values.
- **Mobile-first**, verified at 375px. Not "it probably reflows".
- **Real content.** Placeholder copy hides layout bugs that real text exposes.

### Delegation

For a self-contained component, fill in `.claude/templates/component-spec.md`
and hand that to the `ui-implementer` agent. A spec with blank sections comes
back with an assumption in each one — fill it before delegating.

Keep integration work — wiring, routing, state — in the main thread, where the
full context lives.

## Step 3 — Checkpoint After Each Layer (mandatory)

After finishing each layer, **write `task.md` before starting the next one**:

```
✅ tokens done      → mark [x] in task.md → continue to primitives
✅ primitives done  → mark [x] in task.md → continue to components
✅ components done  → mark [x] in task.md → continue to pages
```

> [!IMPORTANT]
> The checkpoint is what makes an interrupted run resumable. Skipping it to
> "save a step" costs the entire run if anything goes wrong.

## Step 4 — Verify

Run the gate ladder in `.claude/rules/verification.md` — **including gate 5
(visual) and gate 6 (a11y)**, which are the ones that actually matter for a
design project.

If a gate fails: fix the cause, re-run. After **3 failed attempts on the same
gate**, stop and report the real error with its output. Do not keep guessing.

## Step 5 — Report

```markdown
✅ **Executed**: <task name>

### Changes
| File | Action | What |
|------|--------|------|
| src/components/Card.tsx | NEW | Card primitive, 3 variants |
| src/styles/tokens.css | MODIFY | Added --color-surface-raised |

### Verification
<the verification table from .claude/rules/verification.md — verbatim>

### Deviations from plan
- <anything you did differently, and why> — or "none"

### Next
- `/design-review` before committing
- `/finish` to extract learnings and close out
```

> [!CAUTION]
> Deviations are reported, never silently absorbed. A plan that changed during
> implementation is normal; a plan that changed **invisibly** is how trust dies.
