# RSK.is Additional Variables Research

## Context

Research into rsk.is / skatturinn.is to identify tax variables and rules not yet
accounted for in the launareiknir calculator. The goal is to document findings
with sources so the team can decide which items to prioritize for future releases.

---

## Findings: Additional Variables from Skatturinn 2026

### Already Correctly Implemented

- [x] Income tax bracket 1: 0 – 498.122 kr./mth @ 31,49% — [source](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)
- [x] Income tax bracket 2: 498.123 – 1.398.450 kr./mth @ 37,99% — [source](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)
- [x] Income tax bracket 3: > 1.398.450 kr./mth @ 46,29% — [source](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)
- [x] Personal allowance (persónuafsláttur) as tax credit: 72.492 kr./mth — [source](https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/)
- [x] Mandatory pension (lífeyrissjóður): 4% of gross, reduces taxable base — [source](https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/)
- [x] Additional pension (séreign): 0–4% of gross, reduces taxable base — [source](https://www.lifeyrismal.is/en/qa/additional-pension-savings)

---

### Not Yet Accounted For

#### Employer-Side Contributions (informational, not deducted from net pay)

- [ ] **Employer pension contribution: 11,5% of gross** — Employers pay this on top of salary; does not reduce employee net pay but is relevant for total cost-of-employment display — [source](https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/)
- [ ] **Employer séreign match: +2% when employee contributes séreign** — Employers add 2% on top of the employee's séreign contribution — [source](https://www.lifeyrismal.is/en/qa/additional-pension-savings)


#### Family & Household

- [ ] **Child benefits (barnabætur)** — Income-tested payments for parents of children under 18; paid in advance in Feb/May with reconciliation in Jun/Oct. Amounts depend on income level, marital status, and number of children. Out of scope v1 — [source](https://www.skatturinn.is/english/individuals/child-benefits/)
- [ ] **Spouse personal allowance transfer (persónuafsláttur maka)** — Non-working spouse may transfer their 72.492 kr./mth allowance to the working spouse. Out of scope v1 per CLAUDE.md — [source](https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/)

#### Deductions

- [ ] **Trade union fees (~1% of gross)** — Employer deducts mandatory and voluntary union fees from salary. Varies Tax deductibility status requires verification with Skatturinn — [source](https://work.iceland.is/working/tax-regulations/)


---

## Sources

- [Helstu tölur og prósentur 2026 — Skatturinn](https://www.skatturinn.is/einstaklingar/helstutolur/2026/)
- [Staðgreiðsla 2026 — Skatturinn](https://www.skatturinn.is/einstaklingar/stadgreidsla/stadgreidsla/2026)
- [Persónuafsláttur — Skatturinn](https://www.skatturinn.is/einstaklingar/stadgreidsla/personuafslattur/)
- [Iðgjald í lífeyrissjóði — Skatturinn](https://www.skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/)
- [Allowances, deductions and credits — Skatturinn (EN)](https://www.skatturinn.is/english/individuals/allowances-deductions-and-credits/)
- [Child benefits — Skatturinn (EN)](https://www.skatturinn.is/english/individuals/child-benefits/)
- [Additional pension savings — Lífeyrismál.is](https://www.lifeyrismal.is/en/qa/additional-pension-savings)
- [Tax on wages and pensions — Ísland.is](https://island.is/en/taxes-individuals)
- [Tax regulations — Work in Iceland](https://work.iceland.is/working/tax-regulations/)
- [Iceland Individual Taxes — PwC Tax Summaries](https://taxsummaries.pwc.com/iceland/individual/taxes-on-personal-income)
- [Icelandic Tax Facts 2025 — KPMG](https://assets.kpmg.com/content/dam/kpmg/is/pdf/2025/01/Icelandic-Tax-Facts-2025.pdf)
- [Personal tax credit — Skatturinn (EN)](https://www.skatturinn.is/english/individuals/personal-tax-credit/)
- [Key rates and amounts 2026 — Skatturinn (EN)](https://www.skatturinn.is/english/individuals/key-rates-and-amounts/2026/)
