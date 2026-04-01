/**
 * tax-tables.js — Static tax data only. No logic, no DOM access.
 *
 * Sources:
 * - Skatturinn (current 2026 rules)
 * - Morgunblaðið, 31 March 2026 (proposal comparison)
 *
 * All monetary thresholds are monthly figures in ISK.
 * All rates are decimals (e.g. 0.3149 = 31.49%).
 *
 * @module tax-tables
 */

/**
 * Monthly income tax brackets for current staðgreiðsla 2026.
 * Thresholds are monthly. Rates are cumulative (each rate applies only
 * to the slice of income within that bracket's range).
 *
 * @type {Array<{ label: string, lowerBound: number, upperBound: number|null, rate: number }>}
 */
export const CURRENT_TAX_BRACKETS_2026 = [
  {
    label:      'Skattþrep 1',
    lowerBound: 0,
    upperBound: 498_122,
    rate:       0.3149,
  },
  {
    label:      'Skattþrep 2',
    lowerBound: 498_123,
    upperBound: 1_398_450,
    rate:       0.3799,
  },
  {
    label:      'Skattþrep 3',
    lowerBound: 1_398_451,
    upperBound: null,
    rate:       0.4629,
  },
];

/**
 * Monthly flat tax proposal used for the comparison calculator.
 *
 * @type {Array<{ label: string, lowerBound: number, upperBound: number|null, rate: number }>}
 */
export const PROPOSAL_TAX_BRACKETS_2026 = [
  {
    label:      'Eitt skattþrep',
    lowerBound: 0,
    upperBound: null,
    rate:       0.35,
  },
];

/**
 * Monthly personal allowance (persónuafsláttur) for current 2026 rules.
 * This is a tax credit — subtracted directly from computed tax, not from gross income.
 *
 * Source: skatturinn.is/einstaklingar/helstutolur/2026/
 *
 * @type {number}
 */
export const CURRENT_PERSONAL_ALLOWANCE_MONTHLY_2026 = 72_492;

/**
 * Monthly personal allowance used in the proposal comparison.
 *
 * @type {number}
 */
export const PROPOSAL_PERSONAL_ALLOWANCE_MONTHLY_2026 = 100_000;

/**
 * Tax profiles used throughout the calculator UI.
 *
 * @type {{ key: string, name: string, shortLabel: string, brackets: Array<{ label: string, lowerBound: number, upperBound: number|null, rate: number }>, personalAllowanceMonthly: number }[]}
 */
export const TAX_PROFILES = [
  {
    key:                    'current',
    name:                   'Núverandi skattkerfi 2026',
    shortLabel:             'Núverandi kerfi',
    brackets:               CURRENT_TAX_BRACKETS_2026,
    personalAllowanceMonthly: CURRENT_PERSONAL_ALLOWANCE_MONTHLY_2026,
  },
  {
    key:                    'proposal',
    name:                   'Tillaga Sjálfstæðisflokksins',
    shortLabel:             'Tillaga Sjálfstæðisflokksins',
    brackets:               PROPOSAL_TAX_BRACKETS_2026,
    personalAllowanceMonthly: PROPOSAL_PERSONAL_ALLOWANCE_MONTHLY_2026,
  },
];

export const CURRENT_TAX_PROFILE = TAX_PROFILES[0];
export const PROPOSAL_TAX_PROFILE = TAX_PROFILES[1];

/* Backwards-compatible aliases for the original single-profile app. */
export const TAX_BRACKETS_2026 = CURRENT_TAX_BRACKETS_2026;
export const PERSONAL_ALLOWANCE_MONTHLY_2026 = CURRENT_PERSONAL_ALLOWANCE_MONTHLY_2026;

/**
 * Employee pension fund contribution rate (lífeyrissjóður).
 * Applied to gross salary before income tax is calculated.
 *
 * @type {number}
 */
export const PENSION_FUND_RATE = 0.04;

/**
 * Employer mandatory pension contribution rate (lífeyrissjóður launagreiðanda).
 * Paid on top of gross salary; does not reduce employee taxable income.
 *
 * Source: skatturinn.is/einstaklingar/tekjur-og-fradraettir/idgjald-i-lifeyrissjodi/
 *
 * @type {number}
 */
export const EMPLOYER_PENSION_RATE = 0.115;

/**
 * Employer séreign match rate (viðbót launagreiðanda í séreign).
 * Only applies when the employee contributes any séreign (additionalPensionPct > 0).
 *
 * Source: lifeyrismal.is/en/qa/additional-pension-savings
 *
 * @type {number}
 */
export const EMPLOYER_SEREIGN_MATCH_RATE = 0.02;

/**
 * Default vacation pay percentage when vacation is paid with salary.
 * The calculator currently assumes a 10,64% minimum vacation pay percentage.
 *
 * Source: sa.is/vinnumarkadsvefur/starfsmannamal/orlof/innvinnsla-og-greidsla-orlofs
 *
 * @type {number}
 */
export const DEFAULT_VACATION_PERCENT = 10.64;

/**
 * Maximum gross salary accepted by the calculator (in ISK).
 * Beyond this, results become less meaningful for a simple tool.
 *
 * @type {number}
 */
export const MAX_GROSS_SALARY = 10_000_000;
