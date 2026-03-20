/**
 * tax-tables.js — Static tax data only. No logic, no DOM access.
 *
 * Source: Skatturinn (skatturinn.is)
 * All monetary thresholds are monthly figures in ISK.
 * All rates are decimals (e.g. 0.3149 = 31.49%).
 *
 * @module tax-tables
 */

/**
 * Monthly income tax brackets for staðgreiðsla 2026.
 * Thresholds are monthly. Rates are cumulative (each rate applies only
 * to the slice of income within that bracket's range).
 *
 * @type {Array<{ label: string, lowerBound: number, upperBound: number|null, rate: number }>}
 */
export const TAX_BRACKETS_2026 = [
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
 * Monthly personal allowance (persónuafsláttur) for 2026, in ISK.
 * This is a tax credit — subtracted directly from computed tax, not from gross income.
 *
 * Source: skatturinn.is/einstaklingar/helstutolur/2026/
 *
 * @type {number}
 */
export const PERSONAL_ALLOWANCE_MONTHLY_2026 = 72_492;

/**
 * Employee pension fund contribution rate (lífeyrissjóður).
 * Applied to gross salary before income tax is calculated.
 *
 * @type {number}
 */
export const PENSION_FUND_RATE = 0.04;

/**
 * Maximum gross salary accepted by the calculator (in ISK).
 * Beyond this, results become less meaningful for a simple tool.
 *
 * @type {number}
 */
export const MAX_GROSS_SALARY = 5_000_000;
