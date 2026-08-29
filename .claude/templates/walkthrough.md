# Walkthrough: <Feature Name>

> Completed: <YYYY-MM-DD> · Task: `<task-slug>`

## What Was Built
<Two or three sentences describing the end result, not the process.>

## Changes
| File | Action | What |
|------|--------|------|
| `src/components/ReadingCard.tsx` | NEW | Card with 3 variants |
| `src/styles/tokens.css` | MODIFY | Added `--color-surface-raised` |

## Deviations From the Plan
| Planned | Actual | Why |
|---------|--------|-----|
| Extend `Card` | New `ReadingCard` | `Card` assumes fixed height; extending would have broken its 4 existing consumers |

*(none, if the plan held)*

## Verification
| Gate | Result |
|------|--------|
| lint | ✅ |
| typecheck | ✅ |
| test | n/a |
| build | ✅ |
| visual (375/768/1280) | ✅ |
| a11y (keyboard + contrast) | ✅ |

**Manually checked**: <what you actually looked at>
**Not checked**: <what was skipped, and why — write "nothing" only if true>

## Known Gaps
- <anything left incomplete, degraded, or deferred>

## Learnings Recorded
- `.claude/rules/<file>.md`: <what>
- `docs/learned/<file>.md`: <what>

*(or: none met the quality gate)*
