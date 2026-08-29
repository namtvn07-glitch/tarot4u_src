---
description: Design a change before writing it — produces task.md + implementation-plan.md
argument-hint: [what you want to build]
allowed-tools: Read, Grep, Glob, Write, Bash(.claude/hooks/detect-stack.sh:*), Bash(git status:*), Bash(ls:*), Task
---

# /plan — Implementation Plan

> Flow: **`/plan`** → review → `/execute` → `/design-review` → `/finish` → `/commit`

Request: **$ARGUMENTS**

Stack:
!`.claude/hooks/detect-stack.sh`

## Step 1 — Pin Down the Request

Before anything else, confirm you have the two things a plan cannot be written without:

| Atom | Question | If missing |
|------|----------|------------|
| 🔴 **Goal** | What should be true when this is done? What does success look like? | **Ask the user. Do not guess.** |
| 🔴 **Scope** | What is explicitly in, and explicitly out? | **Ask the user. Do not guess.** |
| 🟡 Surface | Which pages/components/routes are touched? | Infer from the codebase |
| 🟡 Constraints | Existing design system? Breakpoints? Browser support? Perf budget? | Infer, state your assumption |
| 🟢 Reference | An existing screen, competitor, or Figma frame to match? | Ask if it would change the design |
| 🟢 Depth | Does the user want a quick sketch or a rigorous plan? | Default: rigorous |

> [!CAUTION]
> Missing **Goal** or **Scope** is the #1 cause of rework. Ask once, up front —
> it is cheaper than rebuilding. Everything else you may assume, as long as you
> write the assumption into the plan.

## Step 2 — Explore Before Committing (skip if all "no")

- [ ] Is the scope vague? ("make the homepage better")
- [ ] Are there 2+ genuinely different approaches? (new component vs. extend existing)
- [ ] Is this a new pattern with no precedent in the codebase?
- [ ] Does it change a shared primitive that many screens depend on?

If **any** is yes: sketch 2–3 approaches with tradeoffs, recommend one, and get
agreement **before** writing the detailed plan. A plan for the wrong approach is
wasted work.

## Step 3 — Research the Codebase

Read the rules that apply, then look for what already exists:

1. `.claude/rules/design-system.md` — tokens and component conventions
2. `.claude/rules/accessibility.md` — what the change must not break
3. `docs/learned/` — known gotchas for this stack

Then search. **Delegate a broad sweep to the `frontend-scout` agent** when the
change touches more than a couple of files:

| Looking for | Where |
|-------------|-------|
| Existing component to extend | components dir, design-system dir |
| Token definitions | `tokens.css`, `tailwind.config.*`, theme files |
| A similar screen already built | routes / pages / app dir |
| Existing utility that does this | `lib/`, `utils/`, `hooks/` |

> [!IMPORTANT]
> Building something that already exists is the most expensive mistake in a
> design system. Search first, every time.

## Step 4 — Write the Artifacts

Create `.claude/brain/<task-slug>/` (kebab-case, derived from the goal) and write
both files from their templates:

- `task.md` — from `.claude/templates/task.md` (checklist; drop rows that don't apply)
- `implementation-plan.md` — from `.claude/templates/implementation-plan.md`

The plan must name **actual file paths**, not vague areas. "Update the header"
is not a plan; `src/components/Header.tsx — add nav collapse below 768px` is.

## Step 5 — Self-Review ⚠️ Never trust your first plan

Re-read it as a skeptical reviewer who wants it rejected:

**Completeness**
- [ ] Every file that must change is listed — including tests and token files?
- [ ] Every state designed: loading, empty, error, success?
- [ ] Every breakpoint considered: 375 / 768 / 1280 / 1920?
- [ ] Both themes, if the project has themes?

**Consistency**
- [ ] Uses existing tokens — no new magic values?
- [ ] Matches naming and file conventions already in the repo?
- [ ] Reuses an existing component instead of adding a near-duplicate?

**Blast radius**
- [ ] Does this touch a shared component? Which screens consume it? *(grep them)*
- [ ] Does it change a token? What else uses that token?
- [ ] Does it change a route or URL? What links to it?
- [ ] Does it change a public prop signature? Who passes that prop?

**Accessibility**
- [ ] Keyboard path through the new UI is designed, not assumed?
- [ ] New color pairings checked for contrast — in both themes?
- [ ] Semantic elements chosen before any ARIA?

**Final pass**
1. Verify every file path in the plan actually exists (or is explicitly marked NEW).
2. Find one more related file you missed. There usually is one.
3. If the plan feels too simple, you missed something — dig again.

## Step 6 — Present and Stop

Show the user:
- The goal and scope as you understood them
- The approach in 3–5 sentences
- The file-by-file change list
- **Any assumption you made** — flagged clearly
- The open decisions you need them to settle

> [!CAUTION]
> **STOP. Wait for approval.** Do not start implementing.
> `/execute` immediately after `/plan` counts as approval.
