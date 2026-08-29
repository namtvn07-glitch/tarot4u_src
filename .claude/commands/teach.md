---
description: Write a narrative debrief of the work — the reasoning, not just the result
argument-hint: [optional focus for the debrief]
allowed-tools: Read, Grep, Glob, Write, Bash(git log:*), Bash(git diff:*), Bash(date:*)
---

# /teach — Debrief

Focus: **$ARGUMENTS**

Your job here is to make the reader smarter, not to summarize what happened.
Write `docs/teach/YYYY-MM-DD_<kebab-case-name>.md` using today's date
(!`date +%Y-%m-%d`).

## When to Use

✅ After a feature, a refactor, a hard debugging session, a design decision with
real tradeoffs.

❌ Not for one-line changes, file reads, or questions with no implementation.

## Voice

Write like a sharp friend explaining over coffee. Not a textbook. Not API docs.

- Use analogies and concrete comparisons. Abstract ideas need something the
  reader can picture.
- Short paragraphs. Real sentences.
- The reader should finish understanding **why**, not just **what**.

## The Nine Sections

### 1. Approach and Reasoning
What did you do and why that way? Where did you start? What did you look at first?

### 2. Roads Not Taken ⭐
What else did you seriously consider, and why did you reject it? **This is the
highest-value section in the document.** A debrief without real alternatives is
just a changelog. If you genuinely considered nothing else, say that — and say
why the choice was forced.

### 3. How the Pieces Connect
How do the parts fit? Why in that order? What depends on what?

### 4. Tools and Methods
What did you use, and why that instead of the alternative? What would have been
different with a different choice?

### 5. Tradeoffs
What did you prioritize, and what did you give up for it? Every decision costs
something. Name both sides.

### 6. Mistakes and Dead Ends
What went wrong? What did you try that didn't work? How did you recover?
**Don't clean this up — the mess is where the learning is.**

### 7. Future Pitfalls
The "I wish someone had told me this" advice for the next person doing something similar.

### 8. Expert vs Beginner Eye
What would an experienced person notice here that a beginner would walk past?

### 9. Transferable Lessons
What carries over to a completely different project? Be specific — "always plan
ahead" teaches nothing.

## Design-Work Angles

For a design task, these usually carry the most value:

- Why *this* layout/hierarchy and not the obvious alternative?
- What did the constraint (breakpoint, contrast ratio, existing token) force you
  to change, and was the result better or just compliant?
- Where did the design system help, and where did you have to fight it?
- What looked right in isolation and wrong in context?

## Failure Modes

| Mistake | Fix |
|---------|-----|
| "Roads Not Taken" is one sentence | Go back. This section justifies the document. |
| Reads like documentation | Rewrite with "it's like when…" |
| Steps with no reasoning | Every step needs a why |
| Mistakes hidden | Be honest. The mess teaches more than the clean result. |
| Fortune-cookie lessons | Specific and actionable, or cut it |

## Red Flags

- No analogies anywhere
- Section 2 or 6 is thin
- The lessons would apply to literally any project
- You finished the work and skipped the debrief
