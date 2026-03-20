import {
  MONTHLY_PERSONAL_ALLOWANCE_2026,
  calculatePayroll
} from "./calculator";

const salaryBoundaries = [0, 498122, 498123, 1398450, 1398451, 5000000];
const additionalSavingsRates = [0, 1, 2, 3, 4] as const;

describe("calculatePayroll", () => {
  it.each(salaryBoundaries)(
    "keeps outputs non-negative and internally consistent for %i kr.",
    (grossSalary) => {
      const result = calculatePayroll({
        grossSalary,
        usePersonalAllowance: true,
        usePensionFund: true,
        additionalPensionPercent: 2
      });

      expect(result.grossSalary).toBe(grossSalary);
      expect(result.taxableBase).toBeCloseTo(
        grossSalary - result.pensionFundAmount - result.additionalPensionAmount,
        8
      );
      expect(result.taxAfterAllowance).toBeGreaterThanOrEqual(0);
      expect(result.netSalary).toBeCloseTo(
        grossSalary -
          result.pensionFundAmount -
          result.additionalPensionAmount -
          result.taxAfterAllowance,
        8
      );
      expect(
        result.bracketBreakdown.reduce(
          (sum, bracket) => sum + bracket.taxableAmount,
          0
        )
      ).toBeCloseTo(result.taxableBase, 8);
      expect(
        result.bracketBreakdown.reduce((sum, bracket) => sum + bracket.taxAmount, 0)
      ).toBeCloseTo(result.taxBeforeAllowance, 8);
    }
  );

  it("caps used personal allowance at the computed tax", () => {
    const result = calculatePayroll({
      grossSalary: 100000,
      usePersonalAllowance: true,
      usePensionFund: false,
      additionalPensionPercent: 0
    });

    expect(result.taxBeforeAllowance).toBeLessThan(MONTHLY_PERSONAL_ALLOWANCE_2026);
    expect(result.usedPersonalAllowance).toBeCloseTo(result.taxBeforeAllowance, 8);
    expect(result.taxAfterAllowance).toBe(0);
  });

  it("handles all combinations of allowance, pension fund and additional savings", () => {
    for (const grossSalary of salaryBoundaries) {
      for (const usePersonalAllowance of [true, false]) {
        for (const usePensionFund of [true, false]) {
          for (const additionalPensionPercent of additionalSavingsRates) {
            const result = calculatePayroll({
              grossSalary,
              usePersonalAllowance,
              usePensionFund,
              additionalPensionPercent
            });

            expect(result.grossSalary).toBe(grossSalary);
            expect(result.pensionFundAmount).toBeCloseTo(
              usePensionFund ? grossSalary * 0.04 : 0,
              8
            );
            expect(result.additionalPensionAmount).toBeCloseTo(
              grossSalary * (additionalPensionPercent / 100),
              8
            );
            expect(result.usedPersonalAllowance).toBeLessThanOrEqual(
              result.taxBeforeAllowance
            );
            expect(result.netShare).toBeGreaterThanOrEqual(0);
            expect(result.netShare).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it("taxes only the amount above each bracket threshold", () => {
    const result = calculatePayroll({
      grossSalary: 1398451,
      usePersonalAllowance: false,
      usePensionFund: false,
      additionalPensionPercent: 0
    });

    expect(result.bracketBreakdown[0].taxableAmount).toBe(498122);
    expect(result.bracketBreakdown[1].taxableAmount).toBe(900328);
    expect(result.bracketBreakdown[2].taxableAmount).toBe(1);
  });
});
