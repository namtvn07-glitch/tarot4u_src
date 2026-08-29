# Accessibility Rules

> A11y is a **gate**. A change that regresses any item below is not shippable,
> regardless of how it looks. Enforced by `/design-review` and the `a11y-auditor` agent.

## Hard Gates (block the change)

| Gate | Requirement |
|------|-------------|
| Contrast | Body text ≥ 4.5:1. Large text (≥18.66px bold / ≥24px) ≥ 3:1. UI borders and icons carrying meaning ≥ 3:1. **Both themes.** |
| Keyboard | Every interactive element reachable by Tab, operable by Enter/Space, and escapable. No keyboard traps. |
| Focus visible | A visible focus indicator with ≥3:1 contrast against its background. Never `outline: none` without a replacement. |
| Names | Every control has an accessible name — visible label, `aria-label`, or `aria-labelledby`. Icon-only buttons always need one. |
| Images | Meaningful images have descriptive `alt`. Decorative images have `alt=""`. Never omit the attribute. |
| Forms | Every input is associated with a `<label>`. Errors are announced, not just colored red. |

## Semantics First

Use the element that already means what you want. `<button>` for actions,
`<a href>` for navigation, `<nav>/<main>/<header>/<footer>` for landmarks.

```
❌ <div onClick={...} className="btn">Save</div>
✅ <button type="button" onClick={...}>Save</button>
```

`role` and `aria-*` are for what HTML cannot express. Reaching for ARIA on a
plain button means the wrong element was chosen. **Bad ARIA is worse than no
ARIA** — it lies to the screen reader.

Heading levels descend without skipping: one `<h1>` per page, then `h2`, `h3`.
Headings are structure, not font size — style with tokens, not with level choice.

## Color Is Never the Only Signal

Error, success, required, selected, and active states each need a second cue —
icon, text, underline, weight, or position. ~8% of men have some form of color
vision deficiency.

## Motion & Media

- Honor `prefers-reduced-motion: reduce`.
- Nothing flashes more than 3 times per second.
- Auto-playing carousels/video need a pause control. Prefer not auto-playing.

## Dynamic Content

- Content that appears without a page change (toasts, validation, async results)
  is announced via a live region (`aria-live="polite"`, or `"assertive"` only for
  genuine interruptions).
- Modals: focus moves in on open, is trapped while open, returns to the trigger
  on close, and `Esc` closes.
- Route changes in SPAs move focus to the new page heading.

## Verification

Automated checks catch roughly 30% of real issues. Both halves are required:

```bash
# Automated — if the project has an a11y linter or axe available
<pm> run lint            # eslint-plugin-jsx-a11y, if configured

# Manual — always
1. Tab through the whole change. Can you reach and use everything? Is focus visible?
2. Zoom to 200%. Does anything overlap or get cut off?
3. Check contrast on every new color pairing, in both themes.
```
