# Launareiknir — Design System & Coding Cookbook

## Project goal

A single static page (Icelandic) hosted on GitHub Pages that visualises monthly salary
as `net pay`, `income tax`, and `pension savings`. Targets a regular wage earner using
2026 Skatturinn rules, with no edge-case rules that would complicate the first release.

The active implementation for calculator changes is the static app made up of
`index.html`, `css/*`, and `js/*`. The parallel `src/` Vite prototype is not the
source of truth unless a task explicitly says to update both implementations.

All calculations are **monthly only** — no annual, weekly, or hourly modes in v1.

---

## Out of scope (v1)

- Multiple employers
- Spouse's personal allowance (persónuafsláttur maka)
- Child tax credits
- Limited tax liability (takmörkuð skattskylda)
- Seafarer rules
- Other specific deductions
- Municipality selection

---

## Future work (post-v1)

- Add English translation
- Add Polish translation
- Evaluate support for additional pay periods and special rules
- Replace inline SVG path for GitHub icon with the official GitHub logo asset

---

## Aesthetic direction

**Swiss editorial / financial print.**

The site is a data tool, not a product homepage. The visual language borrows from
well-designed annual reports, tax forms, and statistics publications — not SaaS
dashboards. The goal is to feel like something Skatturinn would have built if they
had good designers.

Key principles:
- Warm paper tones, near-black ink, one controlled accent (volcanic terracotta)
- No gradient backgrounds, no backdrop-filter blur, no glass cards
- Zero shadows on structural elements — elevation via background tone only
- Sharp corners everywhere except input fields (2px radius)
- Numbers are the hero; decoration is the enemy

---

## File structure

```
launareiknir/
├── index.html                  — Static markup; class names must match components.css
├── css/
│   ├── tokens.css              — :root design tokens ONLY. Everything else imports from here
│   ├── base.css                — Reset, body, typographic baseline
│   ├── layout.css              — Page grid, header, footer, two-column split
│   ├── components.css          — All UI components (fields, toggles, breakdown table)
│   └── visualization.css       — SVG bar and proportion label styles
└── js/
    ├── tax-tables.js           — Static data: brackets, rates, allowances. No logic
    ├── calculator.js           — Pure calculation functions. No DOM access ever
    ├── render.js               — DOM mutation and SVG generation. No calculation logic
    └── app.js                  — Event binding and orchestration. No logic or tax data
```

No build tools. All CSS linked in order in `<head>`. All JS loaded as `type="module"`.
Works directly from `file://` with no server.

---

## Design tokens

All design decisions are CSS custom properties in `css/tokens.css`. **Never** use
hardcoded hex values in any other CSS file.

### Color palette

| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#F5F3EF` | Page background — warm off-white paper |
| `--color-surface` | `#EDEBE6` | Input fields, panels |
| `--color-surface-raised` | `#E6E3DC` | Input suffix, raised surfaces |
| `--color-rule` | `#C8C4BB` | 1px separator lines, default borders |
| `--color-text-muted` | `#8A8680` | Labels, hints, secondary copy |
| `--color-text-body` | `#2A2825` | Body text |
| `--color-text-heading` | `#1A1816` | Headings, net pay figure |
| `--color-accent` | `#8B4A3C` | Focus rings, terracotta accent |
| `--color-gross` | `#2A4A3A` | Net pay bar segment — deep forest green |
| `--color-tax` | `#5A3A2A` | Tax bar segment + negative values — sienna |
| `--color-social` | `#3A3A5A` | Pension segment — slate blue |
| `--color-deduction` | `#4A4A2A` | Additional pension — olive |

### Typography

Font: **Inter** (Google Fonts, 400/500/600). Loaded in `index.html`.

`font-variant-numeric: tabular-nums` must be applied to all numeric output
elements — numbers in different rows must align.

| Token | Value | Use |
|---|---|---|
| `--text-xs` | 0.75rem | Footnotes, bracket sub-rows, source links |
| `--text-sm` | 0.875rem | Labels (uppercase), hints, field badges |
| `--text-base` | 1rem | Body text, breakdown rows |
| `--text-xl` | 1.5rem | Net pay row in breakdown table |
| `--text-3xl` | 2.5rem | Net salary hero number |

### Borders & shadows

- Default border radius: **0** on all structural elements
- Inputs: `--radius-sm` (2px) only
- No box shadows except the focus ring: `0 0 0 2px var(--color-accent)`
- Never use `box-shadow` for elevation — use a background tone step instead

### Spacing

All spacing values must reference `--space-*` tokens (4px base unit).
No inline pixel values in component files.

---

## Component patterns

### Field

The `.field` component wraps every input group. It uses `display: flex; flex-direction: column`
with a bottom border separating it from the next field. The last `.field` removes
its own border via `:last-child`.

Labels are always uppercase, tracked, `--text-sm`, `--color-text-muted`.
They sit above the input via the column flex direction.

### Salary slider

A native `<input type="range">` styled via `::-webkit-slider-thumb` and
`::-moz-range-thumb`. The thumb is a 16×16 square (no border radius) in
`--color-text-heading`. It becomes `--color-accent` on hover.

### Toggle

A visually custom toggle built from a hidden `<input type="checkbox">` with
a sibling `.toggle__track` span. The track is 32×16px with no border radius.
The sliding indicator is a `::after` pseudo-element. No JavaScript needed —
pure CSS `:checked` state.

### Step slider (additional pension)

Five `<button>` elements with `data-value` attributes. The active one receives
`aria-pressed="true"` and `.step-slider__btn--active`. JavaScript in `app.js`
manages the pressed state. Never use `<input type="range">` for discrete 0–4%
steps — buttons communicate the discrete values more clearly.

### Breakdown table

A `<dl>` list with flex rows. Label (`.breakdown__term`) left, value
(`.breakdown__value`) right. One `1px var(--color-rule)` border below each row.

Group headers use a heavy `2px` top border and uppercase small text.
The net pay total row uses the heavy border above and `--text-xl` for both
term and value — this is the only row that gets larger text.

Negative values (deductions) receive `.breakdown__value--negative` which
applies `--color-tax` (sienna). Never use green/red traffic-light colors.

### SVG visualization

Inline SVG generated entirely by `render.js`. A single `<svg>` with
`viewBox="0 0 100 48"` and `preserveAspectRatio="none"` fills the
container width. Each segment is a `<rect>` with `x` and `width` as
percentages of the 100-unit viewbox.

Colors are resolved at runtime via `getComputedStyle(document.documentElement)`.
This keeps the SVG in sync with the CSS token values.

---

## JavaScript architecture

### Rule: each module has exactly one responsibility

| Module | What it owns | What it must not touch |
|---|---|---|
| `tax-tables.js` | Static data | Anything |
| `calculator.js` | Calculation logic | DOM, events |
| `render.js` | DOM writes, SVG | Calculation logic, events |
| `app.js` | Event binding, state, orchestration | Logic, data |

### Calculation order

1. Clamp and sanitize `grossMonthly`
2. `pensionFundAmount = gross × 0.04` (if enabled)
3. `additionalPensionAmount = gross × (pct / 100)`
4. `taxableBase = gross − totalPension`
5. Apply monthly tax brackets to `taxableBase` → `taxBeforeAllowance`
6. `personalAllowanceUsed = min(72_492, taxBeforeAllowance)` (if enabled)
7. `taxAfterAllowance = taxBeforeAllowance − allowanceUsed`
8. `netSalary = gross − totalPension − taxAfterAllowance`

**Critical:** The personal allowance is a **tax credit** — it is subtracted from
the computed tax, not from the gross income. Subtracting it from the taxable base
is a common mistake.

### Number formatting

Use the two helpers in `calculator.js`:

```js
formatISK(value)        // "850.000 kr."
formatPct(share, 1)     // "72,4%"
```

Never call `Intl.NumberFormat` inline in `app.js` or `render.js`.
The formatters use the `is-IS` locale (period = thousands separator).

---

## Coding conventions

| Rule | Value |
|---|---|
| Indentation | 2 spaces |
| Quotes | Single quotes in JS |
| Semicolons | Always |
| CSS values | Reference `--*` tokens only; no hardcoded hex in component files |
| Magic numbers | Forbidden — all rates live in `tax-tables.js` |
| `var` | Never — use `const`/`let`, prefer `const` |
| CSS `!important` | Never |
| CSS property order | position → box model → typography → visual → misc |
| CSS modifiers | `--` double-hyphen: `.breakdown__row--total` |
| JS exports | All exported functions get JSDoc `@param` + `@returns` |

---

## Tax data reference (2026)

| Item | Value |
|---|---|
| Bracket 1 | 0 – 498.122 kr./mth at **31,49%** |
| Bracket 2 | 498.123 – 1.398.450 kr./mth at **37,99%** |
| Bracket 3 | > 1.398.450 kr./mth at **46,29%** |
| Personal allowance (persónuafsláttur) | **72.492 kr./mth** (tax credit) |
| Mandatory pension (lífeyrissjóður) | **4%** of gross (reduces taxable base) |
| Additional pension (séreign) | **0–4%** of gross (reduces taxable base) |
| Employer pension contribution | **11,5%** of wage base |
| Employer séreign match | **2%** when employee pays séreign |
| Default vacation pay percentage | **10,17%** of entered salary when paid with salary |

Sources:
- [Launaseðillinn — SA](https://www.sa.is/vinnumarkadsvefur/reiknivelar/launasedillinn/)
- [Innvinnsla og greiðsla orlofs — SA](https://www.sa.is/vinnumarkadsvefur/starfsmannamal/orlof/innvinnsla-og-greidsla-orlofs)
- [Staðgreiðsla 2026](https://www.skatturinn.is/einstaklingar/stadgreidsla/stadgreidsla/2026)
- [Persónuafsláttur](https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/)
- [Iðgjald í lífeyrissjóði](https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/)
- [Helstu tölur og prósentur 2026](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)

### Vacation pay assumption

When `Orlof greitt út með launum` is enabled, the calculator treats the entered
`Brúttólaun` as the base monthly salary and adds vacation pay on top:

`salaryWithVacation = baseSalary + (baseSalary × vacationPercent)`

That combined wage base is then used for:
- employee 4% pension contribution
- employee séreign contribution
- taxable base and withholding tax
- employer pension contribution
- employer séreign match

This rule follows SA's orlof guidance that vacation pay is calculated from total wages
and, in this calculator, is treated like other wages when it is paid out together with
salary.

### Personal allowance discrepancy

Skatturinn publishes two slightly different annual figures: `869.898 kr.` on the
withholding-tax page and `869.904 kr.` on the personal-allowance page (the latter
being 12 × 72.492). Because this calculator is monthly-only, **72.492 kr./month is
the controlling assumption** and the annual figure is never used directly.

---

## Verification

Open `index.html` directly in a browser (`file://` — no server needed).

Test case: 850.000 kr. gross, personal allowance on, pension on, séreign 2%:

| Line | Expected |
|---|---|
| Lífeyrissjóður | 34.000 kr. |
| Séreign | 17.000 kr. |
| Skattstofn | 799.000 kr. |
| Staðgreiðsla (ca.) | ~179.000 kr. |
| Nettólaun (ca.) | ~570.000 kr. |

Check:
- Tab through all controls — terracotta focus ring appears on every interactive element
- Toggle pension off — breakdown rows disappear cleanly
- Toggle `Orlof greitt út með launum` on — `Orlofsprósenta` input appears with `10,17`
- Set séreign to 0% — additional pension row is hidden
- Resize to < 640px — layout stacks to single column
- Numbers in the breakdown table align on the decimal separator
