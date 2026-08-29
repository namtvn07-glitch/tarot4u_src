# Verification Rules

> Single source of truth for "is this actually done?".
> `/execute`, `/design-review`, `/debug`, and `/finish` all defer to this file.
> Do not hardcode build commands anywhere else.

## Resolving Commands

```bash
.claude/hooks/detect-stack.sh
```

Prints the package manager and which of `lint`, `typecheck`, `test`, `build`
exist. Run the ones that exist, in that order. **A script that does not exist is
not a failure** — note it as `n/a` and move on. Never invent a command.

## The Gate Ladder

Run in order; stop at the first failure and fix before continuing.

| # | Gate | Applies when | Verdict on failure |
|---|------|--------------|--------------------|
| 1 | `lint` | script exists | 🔴 blocks |
| 2 | `typecheck` (or `tsc --noEmit`) | TypeScript project | 🔴 blocks |
| 3 | `test` | script exists **and** tests exist | 🔴 blocks |
| 4 | `build` | script exists | 🔴 blocks |
| 5 | Visual check | **any** change that produces pixels | 🔴 blocks |
| 6 | A11y pass | any change to interactive or text UI | 🔴 blocks — see [accessibility.md](accessibility.md) |

Static projects with no `package.json` skip 1–4 entirely. Gates 5 and 6 still apply.

## Gate 5 — Visual Check (the one that is always skipped)

Automated gates prove the code runs. They prove nothing about design. For any
change that renders:

1. Run the dev server (`/run` or the detected `dev` script).
2. Look at the changed surface at **375 / 768 / 1280px**.
3. If the project has themes, look at **both**.
4. Check the four async states if the surface loads data: loading, empty, error, success.

If you cannot run the app, say so explicitly in the report. **Never write
"verified" for a step you did not perform** — write `⏭️ skipped (reason)`.

## Reporting Format

Every workflow that verifies reports this block verbatim — no prose substitutes:

```markdown
### Verification
| Gate | Result |
|------|--------|
| lint | ✅ / ❌ / n/a |
| typecheck | ✅ / ❌ / n/a |
| test | ✅ 12 passed / ❌ 2 failed / n/a |
| build | ✅ / ❌ / n/a |
| visual (375/768/1280) | ✅ / ⏭️ skipped: <reason> |
| a11y (keyboard + contrast) | ✅ / ⏭️ skipped: <reason> |
```

## Honesty Rules

- A failing gate is reported with its actual output, not summarized away.
- "It should work" is not verification.
- If a gate was skipped, the reason is stated. An unexplained gap reads as a pass
  and that is a lie by omission.
- Three consecutive failed fix attempts on the same gate → stop, report the
  actual error, and ask. Do not keep flailing.
