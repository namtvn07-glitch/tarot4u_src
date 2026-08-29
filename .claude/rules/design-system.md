# Design System Rules

> Applies to every file that produces pixels: components, stylesheets, tokens,
> templates. Enforced by `/design-review` and the `design-system-guardian` agent.

## The Token Rule

Every color, spacing value, radius, shadow, font size, and z-index comes from a
named token. A raw value in a component is a bug.

```
❌ padding: 14px;              ✅ padding: var(--space-4);
❌ color: #6b21a8;             ✅ color: var(--color-accent);
❌ className="mt-[13px]"       ✅ className="mt-3"
❌ z-index: 9999;              ✅ z-index: var(--z-modal);
```

**The single exception**: a one-off value inside a genuinely one-off decorative
element, with a comment naming why it can't be a token. If you write that
comment twice, it was always a token.

## Scales

Define these once, in the project's token source (`tokens.css`,
`tailwind.config.*`, or equivalent), and never extend them ad hoc.

| Scale | Rule |
|-------|------|
| Spacing | One geometric-ish ramp (4/8/12/16/24/32/48/64). New value → justify or round to an existing step. |
| Type | One ramp with a named role per step (`body`, `body-sm`, `heading-3`…). Never size text by raw px in a component. |
| Color | Semantic names (`surface`, `text-muted`, `accent`, `danger`), not literal names (`purple-600`). Literal palettes may exist *underneath* semantic tokens. |
| Radius | 3–4 steps max (`sm`, `md`, `lg`, `full`). |
| Shadow | 3–4 elevation steps. Elevation must be consistent with z-index layering. |
| Z-index | Named layers only (`base`, `dropdown`, `sticky`, `overlay`, `modal`, `toast`). |

## Component Rules

- **Search before creating.** A new component that duplicates 70% of an existing
  one is a refactor, not a feature. `/design-review` greps for this.
- **Variants over forks.** `<Button variant="ghost">`, not `GhostButton`.
- **Layout belongs to the parent.** A component sets its own internal spacing;
  its outer margin is the parent's business. No `margin-bottom` baked into a
  reusable component.
- **Props describe intent, not appearance.** `emphasis="high"` beats `isBig`.
- **No dead variants.** A variant nothing renders is deleted.

## Responsive

Mobile-first. Every layout is verified at these widths before it is called done:

| Width | Why |
|-------|-----|
| 375px | Small phone — the tightest realistic case |
| 768px | Tablet / breakpoint boundary |
| 1280px | Standard desktop |
| 1920px | Wide — check that content doesn't stretch into unreadable line lengths |

Rules:
- Body copy caps at ~65–75 characters per line (`max-width`, not luck).
- No horizontal scroll at any width. Wide content (tables, code, diagrams)
  scrolls **inside its own container**, never the page body.
- Touch targets ≥ 44×44px.
- Images: `max-width: 100%`, explicit intrinsic dimensions to prevent layout shift.

## Theming

If the project supports dark mode, **every** surface, border, and text color is
theme-aware. A hardcoded light-mode value that survives into dark mode is a
critical issue, not a nitpick. Test both themes on every visual change.

## Motion

- Respect `prefers-reduced-motion: reduce` — provide a non-animated path.
- Transitions: 150–250ms for UI feedback, ≤400ms for entrances. Longer feels broken.
- Animate `transform` and `opacity`. Animating `width`/`height`/`top`/`left`
  triggers layout on every frame — use it only when there is no alternative.
