import { renderCalculator } from "./app";

function getBySelector<T extends Element>(
  container: HTMLElement,
  selector: string
): T {
  const element = container.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Element fannst ekki: ${selector}`);
  }

  return element;
}

describe("renderCalculator", () => {
  it("renders the default state in Icelandic", () => {
    const container = document.createElement("div");

    renderCalculator(container);

    expect(container.textContent).toContain("Sjáðu hvert launin fara");
    expect(
      getBySelector(container, '[data-field="net-salary"]').textContent
    ).toContain("kr.");
  });

  it("updates the outputs immediately when inputs change", () => {
    const container = document.createElement("div");
    renderCalculator(container);

    const salaryRange = getBySelector<HTMLInputElement>(container, "#salary-range");
    const personalAllowance = getBySelector<HTMLInputElement>(
      container,
      "#personal-allowance"
    );
    const pensionFund = getBySelector<HTMLInputElement>(container, "#pension-fund");
    const additionalPension = getBySelector<HTMLInputElement>(
      container,
      "#additional-pension"
    );
    const netSalary = getBySelector(container, '[data-field="net-salary"]');

    const initialNetSalary = netSalary.textContent;

    salaryRange.value = "1500000";
    salaryRange.dispatchEvent(new Event("input", { bubbles: true }));
    additionalPension.value = "4";
    additionalPension.dispatchEvent(new Event("input", { bubbles: true }));
    personalAllowance.checked = false;
    personalAllowance.dispatchEvent(new Event("change", { bubbles: true }));
    pensionFund.checked = false;
    pensionFund.dispatchEvent(new Event("change", { bubbles: true }));

    expect(netSalary.textContent).not.toBe(initialNetSalary);
    expect(
      getBySelector(container, "#additional-pension-value").textContent
    ).toBe("4%");
    expect(
      getBySelector(container, '[data-field="tax-after-allowance"]').textContent
    ).toContain("kr.");
  });
});
