# Code Style Rules

> Match the surrounding code first. These rules resolve ties and set defaults
> for new files; existing local convention beats them.

## Naming

| Thing | Convention |
|-------|------------|
| Components | `PascalCase` — file matches export (`CardSpread.tsx` → `CardSpread`) |
| Hooks / composables | `useThing` |
| Utilities, variables | `camelCase` |
| CSS custom properties | `--kebab-case`, semantic (`--color-surface-raised`) |
| CSS classes (non-utility) | `kebab-case`, BEM-ish (`card__title`, `card--flipped`) |
| Constants | `SCREAMING_SNAKE` only for true module-level constants |
| Booleans | `is` / `has` / `can` prefix (`isLoading`, `hasError`) |
| Files (non-component) | `kebab-case.ts` |

Avoid `data`, `info`, `item`, `handleClick2`, `temp`, `utils2`. If a name needs
a comment to explain it, rename it.

## Structure

- **One component per file**, plus its tightly-coupled subcomponents.
- Order within a component: hooks → derived values → handlers → early returns → JSX.
- Extract when a component passes ~150 lines or takes on a second responsibility —
  not on a line count alone, on the second responsibility.
- Co-locate: component, its styles, and its test live together.
- Barrel files (`index.ts`) only at package boundaries. Inside a feature they
  create import cycles and hide dependencies.

## Comments

Comment **why**, never **what**. The code already says what.

```
❌ // increment the counter
❌ // loop through the cards
✅ // The deck is shuffled client-side so the server never sees the draw order —
   // required for the "sealed reading" flow.
```

Delete commented-out code. Git remembers it.

## State & Data

- Derive, don't duplicate. If a value can be computed from existing state, compute it.
- Lift state only as far as it must go. Global state is a last resort.
- Loading, empty, error, and success are **four** states. A UI that only handles
  success is unfinished — every async surface needs all four designed.

## Imports

Order: external packages → internal aliases (`@/…`) → relative → styles.
No unused imports. No deep relative chains (`../../../..`) — use an alias.

## What Not To Do

- No `any` in TypeScript when a real type is knowable. `unknown` + narrowing beats `any`.
- No `!important` unless overriding a third-party stylesheet you don't control,
  with a comment saying which one.
- No inline styles for anything a token can express.
- No `console.log` in committed code — remove it or use the project's logger.
- No silent `catch {}`. Handle it, or let it throw.
