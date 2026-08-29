---
description: Disciplined bug hunt — reproduce, isolate, confirm root cause, then fix
argument-hint: [description of the bug]
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Task
---

# /debug — Bug Hunt

> Flow: `/debug` → fix → `/design-review` or `/finish`

Bug: **$ARGUMENTS**

## Step 0 — Check What's Already Known

Search `docs/learned/` for the symptom before investigating. Many bugs have been
solved here before; re-deriving a known fix is pure waste.

## Step 1 — Classify

| Signal | Type | Route |
|--------|------|-------|
| Clear error message, reproducible, obvious location | **Simple** | Route A |
| Intermittent, no stack trace, worked before, or "looks wrong" with no error | **Hard** | Route B |
| Not enough information | Unknown | Start at A, escalate after 2 failed fixes |

Ask yourself:
- [ ] Can I reproduce it consistently? *(no → hard)*
- [ ] Does the stack trace point somewhere specific? *(no → hard)*
- [ ] Is it a regression? *(yes → hard; find the change that caused it)*
- [ ] Is it visual-only with no console error? *(yes → hard; see the visual protocol below)*

> [!CAUTION]
> **Hard bugs: no code edits until the root cause is confirmed with the user.**
> Editing before you understand the cause is guessing, and guessing on a hard
> bug adds new bugs on top of the one you started with.

## Route A — Simple Bug

1. **Reproduce** — exact steps, exact conditions.
2. **Evidence** — console, network tab, the actual error text. Read it; don't skim.
3. **Hypothesis** — state what you believe is wrong, in one sentence.
4. **Test the hypothesis** — a log or a breakpoint that would *disprove* it.
5. **Fix the cause**, not the symptom.
6. **Verify** — re-run the original reproduction.

**Two failed fixes → stop and switch to Route B.** Say so out loud:
"Simple approach isn't working — switching to phase-gated debugging."

## Route B — Hard Bug (phase-gated)

Each phase completes before the next begins. No skipping ahead.

### Phase 1 — REPRODUCE
Trigger the bug 2–3 times. Record exactly what makes it happen and what makes it
not happen. **No code reading yet** — you are collecting facts, not theories.

### Phase 2 — ISOLATE
Now read code along the reproduction path. Add temporary `// DEBUG` logging to
narrow the failing region. Re-run. Narrow again. Binary-search the surface area.

### Phase 3 — ROOT CAUSE (gate)
Apply five whys until you reach something that explains **every** observed
symptom, including the ones that seem unrelated.

Present to the user:
```markdown
## Root Cause
<one sentence>

## Evidence
- <observation that proves it>
- <observation that rules out the alternatives>

## Why the symptoms follow
<how this cause produces exactly what was seen>

## Proposed fix
<minimal change addressing the cause>
```

> [!CAUTION]
> **STOP. Wait for confirmation before editing anything.**

### Phase 4 — FIX
The minimal change that addresses the confirmed cause. Nothing else — no
drive-by refactors, no "while I'm here" cleanups. They contaminate the verification.

### Phase 5 — VERIFY
Re-run the original reproduction. For intermittent bugs, **5+ runs**. Remove
every `// DEBUG` line you added.

## Visual Bug Protocol

Bugs with no console error need their own evidence trail:

| Symptom | First thing to check |
|---------|---------------------|
| Element in the wrong place | Computed styles in devtools, not the source. Which rule actually won? |
| Style not applying | Specificity, source order, or a `!important` upstream |
| Layout collapses at a width | Which element overflows — inspect at that exact viewport |
| Flash of wrong content | Hydration mismatch, or a theme applied after first paint |
| Works in one browser only | Check feature support before assuming your code is wrong |
| Animation janky | Are you animating layout properties instead of transform/opacity? |
| Wrong in dark mode only | A hardcoded color that skipped the token system |

Devtools first, source second. The computed value tells you the truth; the
source tells you what you intended.

## Step 3 — Close Out

1. Run the gate ladder in `.claude/rules/verification.md`.
2. If the root cause was non-obvious, **document it** in `docs/learned/<area>.md`:
   ```markdown
   ### [Area] <short symptom>
   - **Symptom**: what was observed
   - **Root cause**: the actual problem
   - **Fix**: what changed
   - **Prevention**: how to avoid it next time
   ```
3. Report:
   ```markdown
   ✅ Fixed: <bug>
   - Root cause: <one line>
   - Changed: <files>
   - Verified: <how, how many runs>

   Next: `/design-review` or `/finish`
   ```

> [!IMPORTANT]
> If you fixed the symptom without understanding the cause, **say so**. A fix
> you can't explain will come back, and the next person deserves to know.
