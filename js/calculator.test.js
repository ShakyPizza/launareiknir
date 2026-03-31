import { calculate } from './calculator.js';
import {
  CURRENT_TAX_PROFILE,
  PROPOSAL_TAX_PROFILE,
} from './tax-tables.js';

describe('live calculator tax profiles', () => {
  it('keeps the current profile output stable for the default salary scenario', () => {
    const result = calculate({
      grossMonthly: 850_000,
      usePersonalAllowance: true,
      useSpouseAllowance: false,
      usePensionFund: true,
      additionalPensionPct: 2,
      unionFeePct: 0,
    }, CURRENT_TAX_PROFILE);

    expect(result.taxableBase).toBe(799_000);
    expect(result.taxBeforeAllowance).toBe(271_162);
    expect(result.personalAllowanceUsed).toBe(72_492);
    expect(result.taxAfterAllowance).toBe(198_670);
    expect(result.netSalary).toBe(600_330);
    expect(result.bracketBreakdown).toHaveLength(3);
  });

  it('uses a single 35% bracket and a 100.000 kr. personal allowance for the proposal profile', () => {
    const result = calculate({
      grossMonthly: 500_000,
      usePersonalAllowance: true,
      useSpouseAllowance: false,
      usePensionFund: false,
      additionalPensionPct: 0,
      unionFeePct: 0,
    }, PROPOSAL_TAX_PROFILE);

    expect(result.bracketBreakdown).toHaveLength(1);
    expect(result.bracketBreakdown[0].label).toBe('Eitt skattþrep');
    expect(result.bracketBreakdown[0].rate).toBe(0.35);
    expect(result.taxBeforeAllowance).toBe(175_000);
    expect(result.personalAllowanceUsed).toBe(100_000);
    expect(result.taxAfterAllowance).toBe(75_000);
  });

  it('lets the proposal spouse allowance use the remaining 100.000 kr. cap', () => {
    const result = calculate({
      grossMonthly: 500_000,
      usePersonalAllowance: true,
      useSpouseAllowance: true,
      usePensionFund: false,
      additionalPensionPct: 0,
      unionFeePct: 0,
    }, PROPOSAL_TAX_PROFILE);

    expect(result.personalAllowanceUsed).toBe(100_000);
    expect(result.spouseAllowanceUsed).toBe(75_000);
    expect(result.taxAfterAllowance).toBe(0);
    expect(result.netSalary).toBe(500_000);
  });
});
