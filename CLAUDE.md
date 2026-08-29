# Tarot — Agent Instructions

Web design project. Rules below are loaded every session.

@.claude/rules/project.md
@.claude/rules/design-system.md
@.claude/rules/accessibility.md
@.claude/rules/code-style.md
@.claude/rules/verification.md

## Workflow

```
/plan → (review) → /execute → /design-review → /finish → /commit
                      ↑           ↓
                      └── /debug ─┘
```

| Command | Use for |
|---------|---------|
| `/plan` | Design a change before writing it. Produces `task.md` + `implementation-plan.md`. |
| `/execute` | Implement an approved plan, layer by layer, with checkpoints. |
| `/design-review` | Design-system + a11y + correctness review of the working diff. |
| `/debug` | Disciplined bug hunt. No blind edits. |
| `/finish` | Verify, extract durable learnings, write the walkthrough. |
| `/commit` | Conventional-commit message, reviewed before it lands. |
| `/teach` | Narrative debrief in `docs/teach/` — why, not just what. |
| `/report` | Rà soát `Research/plan/`, build trang tổng quan tiến độ tại `design/index.html`. |

## Specialist Agents

Delegate when the task fits; these run with their own context.

| Agent | Delegate when |
|-------|---------------|
| `design-system-guardian` | Auditing token/component consistency across many files. |
| `a11y-auditor` | Accessibility sweep of a change or a page. |
| `ui-implementer` | Building a component from an approved spec. |
| `frontend-scout` | Read-only search for existing patterns before building new. |

## Standing Reminders

- Detect the stack, never assume it — `.claude/hooks/detect-stack.sh`.
- Tokens over magic numbers. Semantics over ARIA. Both themes, every time.
- Report what you actually verified. Skipped is `⏭️ skipped (reason)`, not `✅`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
