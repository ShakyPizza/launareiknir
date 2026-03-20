export type AdditionalPensionPercent = 0 | 1 | 2 | 3 | 4;

export interface CalculatorState {
  grossSalary: number;
  usePersonalAllowance: boolean;
  usePensionFund: boolean;
  additionalPensionPercent: AdditionalPensionPercent;
}

export interface TaxBracket {
  label: string;
  lowerBound: number;
  upperBound: number | null;
  rate: number;
}

export interface BracketBreakdown {
  label: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface CalculationResult {
  grossSalary: number;
  pensionFundAmount: number;
  additionalPensionAmount: number;
  totalPensionAmount: number;
  taxableBase: number;
  taxBeforeAllowance: number;
  usedPersonalAllowance: number;
  taxAfterAllowance: number;
  netSalary: number;
  netShare: number;
  taxShare: number;
  pensionShare: number;
  additionalPensionShare: number;
  bracketBreakdown: BracketBreakdown[];
}

export const TAX_BRACKETS_2026: TaxBracket[] = [
  {
    label: "Skattþrep 1",
    lowerBound: 0,
    upperBound: 498122,
    rate: 0.3149
  },
  {
    label: "Skattþrep 2",
    lowerBound: 498123,
    upperBound: 1398450,
    rate: 0.3799
  },
  {
    label: "Skattþrep 3",
    lowerBound: 1398451,
    upperBound: null,
    rate: 0.4629
  }
];

export const MONTHLY_PERSONAL_ALLOWANCE_2026 = 72492;
export const PENSION_FUND_RATE = 0.04;

export function clampSalary(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(5000000, Math.max(0, Math.round(value)));
}

export function calculatePayroll(state: CalculatorState): CalculationResult {
  const grossSalary = clampSalary(state.grossSalary);
  const pensionFundAmount = state.usePensionFund
    ? grossSalary * PENSION_FUND_RATE
    : 0;
  const additionalPensionAmount =
    grossSalary * (state.additionalPensionPercent / 100);
  const totalPensionAmount = pensionFundAmount + additionalPensionAmount;
  const taxableBase = Math.max(grossSalary - totalPensionAmount, 0);

  const bracketBreakdown = TAX_BRACKETS_2026.map((bracket, index) => {
    const effectiveLowerBound =
      index === 0 ? bracket.lowerBound : bracket.lowerBound - 1;
    const ceiling =
      bracket.upperBound === null
        ? taxableBase
        : Math.min(taxableBase, bracket.upperBound);
    const taxableAmount = Math.max(ceiling - effectiveLowerBound, 0);

    return {
      label: bracket.label,
      rate: bracket.rate,
      taxableAmount,
      taxAmount: taxableAmount * bracket.rate
    };
  });

  const taxBeforeAllowance = bracketBreakdown.reduce(
    (sum, bracket) => sum + bracket.taxAmount,
    0
  );
  const usedPersonalAllowance = state.usePersonalAllowance
    ? Math.min(MONTHLY_PERSONAL_ALLOWANCE_2026, taxBeforeAllowance)
    : 0;
  const taxAfterAllowance = Math.max(
    taxBeforeAllowance - usedPersonalAllowance,
    0
  );
  const netSalary = grossSalary - totalPensionAmount - taxAfterAllowance;

  return {
    grossSalary,
    pensionFundAmount,
    additionalPensionAmount,
    totalPensionAmount,
    taxableBase,
    taxBeforeAllowance,
    usedPersonalAllowance,
    taxAfterAllowance,
    netSalary,
    netShare: grossSalary === 0 ? 0 : netSalary / grossSalary,
    taxShare: grossSalary === 0 ? 0 : taxAfterAllowance / grossSalary,
    pensionShare: grossSalary === 0 ? 0 : pensionFundAmount / grossSalary,
    additionalPensionShare:
      grossSalary === 0 ? 0 : additionalPensionAmount / grossSalary,
    bracketBreakdown
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("is-IS", {
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("is-IS", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value * 100);
}
