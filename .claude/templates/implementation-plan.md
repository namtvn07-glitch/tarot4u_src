# <Feature Name>

<Two or three sentences: what this is and why it's being built.>

## Decisions Needed From You
> [!IMPORTANT]
> - <decision 1 — with your recommendation and the reason>
> - <decision 2>
>
> *(If there are none, say "none" — don't delete the section.)*

## Approach
<3–5 sentences. What is the shape of the solution, and why this shape?>

**Considered and rejected**
- <alternative> — <why not>

## Proposed Changes

### Tokens / Theme
#### [NEW] `--color-surface-raised`
- Value, both themes, and what consumes it

### Primitives
#### [MODIFY] `src/components/ui/Button.tsx`
- What changes and why
- **Consumers affected**: <files that render it>

### Components
#### [NEW] `src/components/ReadingCard.tsx`
- Purpose, props, variants
- States: loading / empty / error / success
- Responsive behavior at 375 / 768 / 1280

### Pages / Routes
#### [MODIFY] `src/app/reading/page.tsx`
- What changes

### Content
- Real copy needed for: <where>

## Accessibility Plan
- Semantic structure: <elements used>
- Keyboard path: <tab order and key handling through the new UI>
- New color pairings and their expected contrast ratios (both themes)
- Focus management: <if anything opens, closes, or navigates>

## Blast Radius
| Changed | Consumers | Risk |
|---------|-----------|------|
| `Button.tsx` | 6 files | Prop rename breaks call sites — listed below |

## Verification Plan
### Automated
<the gates from .claude/rules/verification.md that apply here>

### Manual
1. <specific thing to look at, at which width, in which theme>
2. <keyboard walkthrough steps>

## Out of Scope
- <explicitly not doing, so it doesn't get quietly added later>
