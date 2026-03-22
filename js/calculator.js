/**
 * calculator.js — Pure payroll calculation logic.
 * Zero DOM access. Zero side effects. All inputs explicit, all outputs returned.
 *
 * @module calculator
 */

import {
  TAX_BRACKETS_2026,
  PERSONAL_ALLOWANCE_MONTHLY_2026,
  PENSION_FUND_RATE,
  MAX_GROSS_SALARY,
} from './tax-tables.js';

/**
 * Clamp and sanitize a raw salary value.
 *
 * @param {number} value
 * @returns {number}
 */
export function clampSalary(value) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(MAX_GROSS_SALARY, Math.round(value));
}

/**
 * Apply progressive monthly tax brackets to a taxable income figure.
 * Returns a per-bracket breakdown as well as the total raw tax.
 *
 * @param {number} taxableMonthly — monthly taxable income in ISK
 * @returns {{ total: number, breakdown: Array<{ label: string, rate: number, taxableAmount: number, taxAmount: number }> }}
 */
function applyBrackets(taxableMonthly) {
  let total = 0;
  const breakdown = TAX_BRACKETS_2026.map((bracket, index) => {
    const lower   = index === 0 ? bracket.lowerBound : bracket.lowerBound - 1;
    const ceiling = bracket.upperBound === null
      ? taxableMonthly
      : Math.min(taxableMonthly, bracket.upperBound);
    const taxableAmount = Math.max(ceiling - lower, 0);
    const taxAmount     = taxableAmount * bracket.rate;
    total += taxAmount;
    return {
      label:         bracket.label,
      rate:          bracket.rate,
      taxableAmount,
      taxAmount,
    };
  });
  return { total, breakdown };
}

/**
 * Calculate a full monthly payroll breakdown.
 *
 * @param {Object} params
 * @param {number} params.grossMonthly          — gross monthly salary (ISK)
 * @param {boolean} params.usePersonalAllowance — apply persónuafsláttur
 * @param {boolean} params.useSpouseAllowance   — apply transferred persónuafsláttur maka
 * @param {boolean} params.usePensionFund       — deduct 4% lífeyrissjóður
 * @param {number} params.additionalPensionPct  — additional pension (séreign) 0–4
 * @param {number} params.unionFeePct           — union fee as % of gross (deducted from net after tax)
 *
 * @returns {CalculationResult}
 *
 * @typedef {Object} CalculationResult
 * @property {number} grossSalary
 * @property {number} pensionFundAmount         — mandatory pension (4% if enabled)
 * @property {number} additionalPensionAmount   — additional pension (séreign)
 * @property {number} totalPensionAmount        — sum of both pension lines
 * @property {number} taxableBase               — gross minus total pension
 * @property {number} taxBeforeAllowance        — raw progressive tax on taxableBase
 * @property {number} personalAllowanceUsed     — own allowance credit applied (≤ taxBeforeAllowance)
 * @property {number} spouseAllowanceUsed       — spouse allowance credit applied
 * @property {number} taxAfterAllowance         — final income tax
 * @property {number} unionFeeAmount            — union fee deducted from net pay
 * @property {number} netSalary                 — take-home pay (after union fee)
 * @property {number} netShare                  — net / gross (0–1)
 * @property {number} taxShare                  — tax / gross (0–1)
 * @property {number} pensionShare              — mandatory pension / gross (0–1)
 * @property {number} additionalPensionShare    — additional pension / gross (0–1)
 * @property {number} unionFeeShare             — union fee / gross (0–1)
 * @property {Array}  bracketBreakdown          — per-bracket detail
 */
export function calculate({
  grossMonthly,
  usePersonalAllowance = true,
  useSpouseAllowance = false,
  usePensionFund = true,
  additionalPensionPct = 2,
  unionFeePct = 0,
}) {
  const gross = clampSalary(grossMonthly);

  const pensionFundAmount       = usePensionFund ? Math.round(gross * PENSION_FUND_RATE) : 0;
  const additionalPensionAmount = Math.round(gross * (additionalPensionPct / 100));
  const totalPensionAmount      = pensionFundAmount + additionalPensionAmount;

  const taxableBase = Math.max(gross - totalPensionAmount, 0);

  const { total: taxBeforeAllowance, breakdown: bracketBreakdown } = applyBrackets(taxableBase);

  const personalAllowanceUsed = usePersonalAllowance
    ? Math.min(PERSONAL_ALLOWANCE_MONTHLY_2026, taxBeforeAllowance)
    : 0;

  const remainingTax = Math.max(taxBeforeAllowance - personalAllowanceUsed, 0);

  const spouseAllowanceUsed = useSpouseAllowance
    ? Math.min(PERSONAL_ALLOWANCE_MONTHLY_2026, remainingTax)
    : 0;

  const taxAfterAllowance = Math.max(remainingTax - spouseAllowanceUsed, 0);

  const clampedUnionFee = Math.max(0, Math.round(gross * (unionFeePct / 100)));
  const netSalary       = gross - totalPensionAmount - taxAfterAllowance - clampedUnionFee;

  const pct = (n) => gross === 0 ? 0 : n / gross;

  return {
    grossSalary:             gross,
    pensionFundAmount:       Math.round(pensionFundAmount),
    additionalPensionAmount: Math.round(additionalPensionAmount),
    totalPensionAmount:      Math.round(totalPensionAmount),
    taxableBase:             Math.round(taxableBase),
    taxBeforeAllowance:      Math.round(taxBeforeAllowance),
    personalAllowanceUsed:   Math.round(personalAllowanceUsed),
    spouseAllowanceUsed:     Math.round(spouseAllowanceUsed),
    taxAfterAllowance:       Math.round(taxAfterAllowance),
    unionFeeAmount:          clampedUnionFee,
    netSalary:               Math.round(netSalary),
    netShare:                pct(netSalary),
    taxShare:                pct(taxAfterAllowance),
    pensionShare:            pct(pensionFundAmount),
    additionalPensionShare:  pct(additionalPensionAmount),
    unionFeeShare:           pct(clampedUnionFee),
    bracketBreakdown,
  };
}

/**
 * Build an array of { gross, net, tax } data points sweeping the full salary range.
 * Used by the XY line chart in render.js.
 *
 * @param {Object} params — same option flags as calculate(); grossMonthly is swept internally
 * @param {boolean} params.usePersonalAllowance
 * @param {boolean} params.usePensionFund
 * @param {number}  params.additionalPensionPct
 * @param {number}  [steps=100]
 * @returns {Array<{ gross: number, net: number, tax: number }>}
 */
export function buildCurveData(params, steps = 100) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const gross = Math.round((i / steps) * MAX_GROSS_SALARY);
    const r = calculate({ ...params, grossMonthly: gross });
    points.push({
      gross,
      net:               r.netSalary,
      tax:               r.taxAfterAllowance,
      pension:           r.pensionFundAmount,
      additionalPension: r.additionalPensionAmount,
      unionFee:          r.unionFeeAmount,
    });
  }
  return points;
}

/**
 * Format a number as Icelandic króna.
 * Uses the IS locale: period as thousands separator, no decimals.
 *
 * @param {number} value
 * @returns {string}  e.g. "850.000 kr."
 */
export function formatISK(value) {
  return new Intl.NumberFormat('is-IS', {
    maximumFractionDigits: 0,
  }).format(Math.round(value)) + ' kr.';
}

/**
 * Format a proportion as a percentage string.
 *
 * @param {number} share — 0 to 1
 * @param {number} [decimals=1]
 * @returns {string}  e.g. "72,4%"
 */
export function formatPct(share, decimals = 1) {
  return new Intl.NumberFormat('is-IS', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(share * 100) + '%';
}
