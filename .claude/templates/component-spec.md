# Component: <Name>

> Hand this to the `ui-implementer` agent. A spec that leaves a section blank
> will come back with an assumption in its place.

## Purpose
<One sentence. What job does this component do?>

## Reuse Check
- Existing component considered: <name> — <why it wasn't enough>
- Composes from: <primitives it should build on>

## API
| Prop | Type | Default | Required | Purpose |
|------|------|---------|----------|---------|
| variant | `'default' \| 'raised'` | `'default'` | no | Surface elevation |
| children | `ReactNode` | — | yes | Body content |

**Props deliberately excluded**: <and why — this prevents scope creep>

## Anatomy
```
┌─────────────────────────┐
│ [icon]  Title           │  ← header: icon optional
│         Subtitle        │
├─────────────────────────┤
│ children                │  ← body: padding from --space-4
└─────────────────────────┘
```

## Tokens
| Property | Token |
|----------|-------|
| Background | `--color-surface` |
| Padding | `--space-4` |
| Radius | `--radius-md` |
| Border | `--color-border` |

## States
| State | Appearance |
|-------|------------|
| Default | |
| Hover | |
| Focus | Visible ring, `--color-focus`, ≥3:1 |
| Active | |
| Disabled | |
| Loading | |
| Empty | |
| Error | |

## Responsive
| Width | Behavior |
|-------|----------|
| 375 | |
| 768 | |
| 1280 | |

## Accessibility
- Semantic element: `<article>` / `<button>` / …
- Accessible name: <how it gets one>
- Keyboard: <keys handled, and what each does>
- Focus: <where focus goes on interaction>
- Announcements: <live region needs, if any>

## Out of Scope
- <what this component must NOT take on>
