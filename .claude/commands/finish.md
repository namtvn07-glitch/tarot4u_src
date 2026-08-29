---
description: Close out a task — verify, extract durable learnings, write the walkthrough
argument-hint: [task-slug] | --no-learnings
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# /finish — Close the Loop

> Flow: `/plan` → `/execute` → `/design-review` → **`/finish`** → `/commit`

Argument: **$ARGUMENTS**

## Step 1 — Locate the Task

Slug given → `.claude/brain/<slug>/`. Otherwise the task from this conversation.
Uncertain → ask which one.

**No task artifacts at all?** Offer a mini-summary: capture what was done and any
learnings, then continue from Step 3. Don't refuse to close out work just because
it started without `/plan`.

## Step 2 — Verify Before Declaring Done

Run the gate ladder in `.claude/rules/verification.md` and record the result table.

> [!CAUTION]
> `/finish` never marks a task complete on gates that were not run. If something
> could not be verified, the task closes as **partially verified**, with the gap
> named. A green checkmark you didn't earn is worse than a red one.

Update `task.md`: check off what's genuinely done, and for anything still open,
write **why** it's open.

## Step 3 — Extract Learnings *(default; skipped with `--no-learnings`)*

Ask of the completed work:
- What pattern emerged that will be reused?
- What surprised you — what cost time that shouldn't have next time?
- What convention did the codebase reveal that isn't written down anywhere?

### Where does each learning go?

```
Is it reusable beyond this task?
│
├─ No ──────────────────────────► stays in task.md. Done.
│
└─ Yes
   │
   ├─ A convention/gotcha the agent should know EVERY session?
   │  └─► .claude/rules/*.md → the matching file's rules or "Learned Patterns"
   │      e.g. "Modal focus trap must restore focus to the trigger"
   │
   ├─ Deep knowledge about one tool/stack?
   │  └─► docs/learned/<stack>.md
   │      e.g. "Tailwind arbitrary values break the purge scanner when interpolated"
   │
   └─ A flaw in the PROCESS itself?
      └─► .claude/commands/*.md — ⚠️ ASK THE USER BEFORE EDITING A WORKFLOW
          e.g. "/design-review should check untracked files — it missed a new component"
```

**Tiebreaker**: if it fits two places, the more-frequently-read one wins.
`.claude/rules/` is read every session; `docs/learned/` only when relevant.

### Quality gate — do NOT record it if:

- ❌ It's a one-off decision specific to this task
- ❌ It's a restatement of something already in the rules
- ❌ It's general programming advice ("write tests", "plan ahead")
- ❌ It's a design preference, not a rule with a reason
- ❌ It never actually caused a problem — a hypothetical is not a gotcha

> [!IMPORTANT]
> Rules files are read every session. Every line added is a permanent tax on
> attention. Adding a weak rule makes the strong ones harder to see. **When in
> doubt, leave it out.**

Keep each entry 2–4 lines, and state the *why* — a rule without a reason gets
ignored the first time it's inconvenient.

## Step 4 — Write the Walkthrough

Write `.claude/brain/<slug>/walkthrough.md` from `.claude/templates/walkthrough.md`.
This is the record of what actually happened, including what changed from the plan.

## Step 5 — Offer a Deeper Debrief

If the task involved real tradeoffs, dead ends, or non-obvious decisions:

> "There's good material here for a debrief. Run `/teach` to write it up?"

Skip the offer for routine work.

## Step 6 — Report

```markdown
✅ **Task complete**: <name>

### Verification
<the table from .claude/rules/verification.md>

### Learnings recorded
- `.claude/rules/design-system.md`: <what and why>
- `docs/learned/<stack>.md`: <what and why>
- *(or: none met the quality gate — <one line on why>)*

### Still open
- <anything unfinished, and why> — or "nothing"

💡 `/commit` when you're ready to commit.
```
