import { describe, expect, it } from 'vitest';

import { calculate } from './calculator.js';

describe('static calculator payroll math', () => {
  it('preserves the current salary basis when vacation pay is disabled', () => {
    const result = calculate({
      grossMonthly: 850_000,
      usePersonalAllowance: true,
      useSpouseAllowance: false,
      usePensionFund: true,
      payVacationWithSalary: false,
      vacationPercent: 10.17,
      additionalPensionPct: 2,
      unionFeePct: 0,
    });

    expect(result.vacationPayAmount).toBe(0);
    expect(result.salaryWithVacation).toBe(850_000);
    expect(result.pensionFundAmount).toBe(34_000);
    expect(result.additionalPensionAmount).toBe(17_000);
    expect(result.employerContributionBase).toBe(850_000);
    expect(result.totalEmployerCost).toBe(964_750);
  });

  it('adds vacation pay on top of entered salary and uses the combined base downstream', () => {
    const result = calculate({
      grossMonthly: 850_000,
      usePersonalAllowance: true,
      useSpouseAllowance: false,
      usePensionFund: true,
      payVacationWithSalary: true,
      vacationPercent: 10.17,
      additionalPensionPct: 2,
      unionFeePct: 0,
    });

    expect(result.vacationPayAmount).toBe(86_445);
    expect(result.salaryWithVacation).toBe(936_445);
    expect(result.pensionFundAmount).toBe(37_458);
    expect(result.additionalPensionAmount).toBe(18_729);
    expect(result.taxableBase).toBe(880_258);
    expect(result.employerContributionBase).toBe(936_445);
    expect(result.employerPensionAmount).toBe(107_691);
    expect(result.employerSereignMatch).toBe(18_729);
    expect(result.totalEmployerCost).toBe(1_062_865);
  });

  it('includes employer-side pension contributions in total compensation share', () => {
    const result = calculate({
      grossMonthly: 100_000,
      usePersonalAllowance: true,
      useSpouseAllowance: false,
      usePensionFund: true,
      payVacationWithSalary: true,
      vacationPercent: 10.17,
      additionalPensionPct: 2,
      unionFeePct: 1,
    });

    expect(result.totalCompensationAmount).toBe(
      result.netSalary +
      result.pensionFundAmount +
      result.additionalPensionAmount +
      result.unionFeeAmount +
      result.employerPensionAmount +
      result.employerSereignMatch
    );
    expect(result.totalCompensationShare).toBeGreaterThan(1);
  });
});
