import {
  type AdditionalPensionPercent,
  calculatePayroll,
  clampSalary,
  formatCurrency,
  formatPercent
} from "./calculator";
import { copy } from "./content/is";

interface AppElements {
  salaryRange: HTMLInputElement;
  salaryNumber: HTMLInputElement;
  personalAllowanceCheckbox: HTMLInputElement;
  pensionFundCheckbox: HTMLInputElement;
  additionalPensionRange: HTMLInputElement;
  additionalPensionValue: HTMLElement;
  netSalaryValue: HTMLElement;
  takeHomeShareValue: HTMLElement;
  distributionBar: HTMLElement;
  grossSalaryValue: HTMLElement;
  pensionFundValue: HTMLElement;
  additionalPensionAmountValue: HTMLElement;
  taxableBaseValue: HTMLElement;
  taxBeforeAllowanceValue: HTMLElement;
  usedPersonalAllowanceValue: HTMLElement;
  taxAfterAllowanceValue: HTMLElement;
  netSalaryLineValue: HTMLElement;
  bracketList: HTMLElement;
}

const defaultState = {
  grossSalary: 850000,
  usePersonalAllowance: true,
  usePensionFund: true,
  additionalPensionPercent: 2 as AdditionalPensionPercent
};

function getAdditionalPensionPercent(value: string): AdditionalPensionPercent {
  const normalized = Math.min(4, Math.max(0, Number.parseInt(value, 10) || 0));
  return normalized as AdditionalPensionPercent;
}

function createMarkup(): string {
  const pensionStops = [0, 1, 2, 3, 4]
    .map(
      (value) =>
        `<span class="step-slider__tick">${value}%</span>`
    )
    .join("");

  const links = copy.links
    .map(
      (link) =>
        `<li><a href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a></li>`
    )
    .join("");

  return `
    <main class="page-shell">
      <section class="hero-card hero-card--controls" aria-labelledby="controls-title">
        <p class="eyebrow">${copy.meta.eyebrow}</p>
        <h1>${copy.meta.heading}</h1>
        <p class="intro">${copy.meta.intro}</p>

        <div class="controls-panel">
          <div class="field-group">
            <div class="field-heading">
              <label for="salary-range">${copy.controls.salaryLabel}</label>
              <span class="field-badge">${copy.controls.monthlyLabel}</span>
            </div>
            <p class="field-help">${copy.controls.salaryHint}</p>
            <input
              id="salary-range"
              class="range-input"
              type="range"
              min="0"
              max="5000000"
              step="1000"
              value="${defaultState.grossSalary}"
            />
            <label class="sr-only" for="salary-number">${copy.controls.salaryInputLabel}</label>
            <div class="currency-input">
              <span>kr.</span>
              <input
                id="salary-number"
                type="number"
                inputmode="numeric"
                min="0"
                max="5000000"
                step="1000"
                value="${defaultState.grossSalary}"
              />
            </div>
          </div>

          <div class="toggle-grid">
            <label class="toggle-card" for="personal-allowance">
              <input
                id="personal-allowance"
                type="checkbox"
                ${defaultState.usePersonalAllowance ? "checked" : ""}
              />
              <span>${copy.controls.personalAllowance}</span>
            </label>

            <label class="toggle-card" for="pension-fund">
              <input
                id="pension-fund"
                type="checkbox"
                ${defaultState.usePensionFund ? "checked" : ""}
              />
              <span>${copy.controls.pensionFund}</span>
            </label>
          </div>

          <div class="field-group">
            <div class="field-heading">
              <label for="additional-pension">${copy.controls.additionalPension}</label>
              <strong id="additional-pension-value">${defaultState.additionalPensionPercent}%</strong>
            </div>
            <p class="field-help">${copy.controls.additionalPensionHint}</p>
            <input
              id="additional-pension"
              class="range-input"
              type="range"
              min="0"
              max="4"
              step="1"
              value="${defaultState.additionalPensionPercent}"
            />
            <div class="step-slider" aria-hidden="true">${pensionStops}</div>
          </div>
        </div>
      </section>

      <section class="hero-card hero-card--results" aria-labelledby="results-title">
        <div class="results-header">
          <div>
            <p class="eyebrow">${copy.summary.title}</p>
            <h2 id="results-title">${copy.summary.netSalary}</h2>
          </div>
          <div class="stat-chip">
            <span>${copy.summary.takeHomeShare}</span>
            <strong data-field="take-home-share"></strong>
          </div>
        </div>

        <div class="net-salary-block">
          <p class="net-salary-block__value" data-field="net-salary"></p>
          <p class="net-salary-block__caption">${copy.summary.distribution}</p>
        </div>

        <div class="distribution-block">
          <div class="distribution-bar" data-field="distribution-bar" aria-hidden="true"></div>
          <div class="distribution-legend">
            <span><i class="legend-swatch legend-swatch--net"></i>${copy.summary.shareNet}</span>
            <span><i class="legend-swatch legend-swatch--tax"></i>${copy.summary.shareTax}</span>
            <span><i class="legend-swatch legend-swatch--pension"></i>${copy.summary.sharePensionFund}</span>
            <span><i class="legend-swatch legend-swatch--additional"></i>${copy.summary.shareAdditionalPension}</span>
          </div>
        </div>

        <div class="detail-grid" aria-label="${copy.summary.breakdownTitle}">
          <article class="detail-card">
            <h3>${copy.summary.breakdownTitle}</h3>
            <dl class="detail-list">
              <div><dt>${copy.summary.grossSalary}</dt><dd data-field="gross-salary"></dd></div>
              <div><dt>${copy.summary.pensionFundAmount}</dt><dd data-field="pension-fund-amount"></dd></div>
              <div><dt>${copy.summary.additionalPensionAmount}</dt><dd data-field="additional-pension-amount"></dd></div>
              <div><dt>${copy.summary.taxableBase}</dt><dd data-field="taxable-base"></dd></div>
              <div><dt>${copy.summary.taxBeforeAllowance}</dt><dd data-field="tax-before-allowance"></dd></div>
              <div><dt>${copy.summary.usedPersonalAllowance}</dt><dd data-field="used-personal-allowance"></dd></div>
              <div><dt>${copy.summary.taxAfterAllowance}</dt><dd data-field="tax-after-allowance"></dd></div>
              <div class="detail-list__total"><dt>${copy.summary.netSalaryLine}</dt><dd data-field="net-salary-line"></dd></div>
            </dl>
          </article>

          <article class="detail-card">
            <h3>${copy.summary.taxBrackets}</h3>
            <ul class="bracket-list" data-field="bracket-list"></ul>
          </article>
        </div>

        <details class="source-panel">
          <summary>${copy.notes.title}</summary>
          <p>${copy.notes.scope}</p>
          <p>${copy.notes.inconsistency}</p>
          <p class="source-panel__heading">${copy.notes.linksTitle}</p>
          <ul class="source-list">${links}</ul>
        </details>
      </section>
    </main>
  `;
}

export function renderCalculator(container: HTMLElement): void {
  container.innerHTML = createMarkup();

  const elements: AppElements = {
    salaryRange: container.querySelector("#salary-range") as HTMLInputElement,
    salaryNumber: container.querySelector("#salary-number") as HTMLInputElement,
    personalAllowanceCheckbox: container.querySelector(
      "#personal-allowance"
    ) as HTMLInputElement,
    pensionFundCheckbox: container.querySelector(
      "#pension-fund"
    ) as HTMLInputElement,
    additionalPensionRange: container.querySelector(
      "#additional-pension"
    ) as HTMLInputElement,
    additionalPensionValue: container.querySelector(
      "#additional-pension-value"
    ) as HTMLElement,
    netSalaryValue: container.querySelector(
      '[data-field="net-salary"]'
    ) as HTMLElement,
    takeHomeShareValue: container.querySelector(
      '[data-field="take-home-share"]'
    ) as HTMLElement,
    distributionBar: container.querySelector(
      '[data-field="distribution-bar"]'
    ) as HTMLElement,
    grossSalaryValue: container.querySelector(
      '[data-field="gross-salary"]'
    ) as HTMLElement,
    pensionFundValue: container.querySelector(
      '[data-field="pension-fund-amount"]'
    ) as HTMLElement,
    additionalPensionAmountValue: container.querySelector(
      '[data-field="additional-pension-amount"]'
    ) as HTMLElement,
    taxableBaseValue: container.querySelector(
      '[data-field="taxable-base"]'
    ) as HTMLElement,
    taxBeforeAllowanceValue: container.querySelector(
      '[data-field="tax-before-allowance"]'
    ) as HTMLElement,
    usedPersonalAllowanceValue: container.querySelector(
      '[data-field="used-personal-allowance"]'
    ) as HTMLElement,
    taxAfterAllowanceValue: container.querySelector(
      '[data-field="tax-after-allowance"]'
    ) as HTMLElement,
    netSalaryLineValue: container.querySelector(
      '[data-field="net-salary-line"]'
    ) as HTMLElement,
    bracketList: container.querySelector(
      '[data-field="bracket-list"]'
    ) as HTMLElement
  };

  const state = { ...defaultState };

  const syncSalaryInputs = (value: number) => {
    const normalized = clampSalary(value);
    state.grossSalary = normalized;
    elements.salaryRange.value = normalized.toString();
    elements.salaryNumber.value = normalized.toString();
  };

  const render = () => {
    const result = calculatePayroll(state);

    elements.additionalPensionValue.textContent =
      `${state.additionalPensionPercent}%`;
    elements.netSalaryValue.textContent =
      `${formatCurrency(result.netSalary)} kr.`;
    elements.takeHomeShareValue.textContent =
      `${formatPercent(result.netShare)}%`;
    elements.grossSalaryValue.textContent =
      `${formatCurrency(result.grossSalary)} kr.`;
    elements.pensionFundValue.textContent =
      `${formatCurrency(result.pensionFundAmount)} kr.`;
    elements.additionalPensionAmountValue.textContent =
      `${formatCurrency(result.additionalPensionAmount)} kr.`;
    elements.taxableBaseValue.textContent =
      `${formatCurrency(result.taxableBase)} kr.`;
    elements.taxBeforeAllowanceValue.textContent =
      `${formatCurrency(result.taxBeforeAllowance)} kr.`;
    elements.usedPersonalAllowanceValue.textContent =
      `${formatCurrency(result.usedPersonalAllowance)} kr.`;
    elements.taxAfterAllowanceValue.textContent =
      `${formatCurrency(result.taxAfterAllowance)} kr.`;
    elements.netSalaryLineValue.textContent =
      `${formatCurrency(result.netSalary)} kr.`;

    elements.distributionBar.innerHTML = `
      <span class="distribution-segment distribution-segment--net" style="width:${result.netShare * 100}%"></span>
      <span class="distribution-segment distribution-segment--tax" style="width:${result.taxShare * 100}%"></span>
      <span class="distribution-segment distribution-segment--pension" style="width:${result.pensionShare * 100}%"></span>
      <span class="distribution-segment distribution-segment--additional" style="width:${result.additionalPensionShare * 100}%"></span>
    `;

    elements.bracketList.innerHTML = result.bracketBreakdown
      .map(
        (bracket) => `
          <li>
            <div class="bracket-row">
              <strong>${bracket.label}</strong>
              <span>${formatPercent(bracket.rate)}%</span>
            </div>
            <div class="bracket-row bracket-row--subtle">
              <span>${formatCurrency(bracket.taxableAmount)} kr. í þrepinu</span>
              <span>${formatCurrency(bracket.taxAmount)} kr. í skatt</span>
            </div>
          </li>
        `
      )
      .join("");
  };

  elements.salaryRange.addEventListener("input", (event) => {
    syncSalaryInputs(Number((event.target as HTMLInputElement).value));
    render();
  });

  elements.salaryNumber.addEventListener("input", (event) => {
    syncSalaryInputs(Number((event.target as HTMLInputElement).value));
    render();
  });

  elements.personalAllowanceCheckbox.addEventListener("change", (event) => {
    state.usePersonalAllowance = (event.target as HTMLInputElement).checked;
    render();
  });

  elements.pensionFundCheckbox.addEventListener("change", (event) => {
    state.usePensionFund = (event.target as HTMLInputElement).checked;
    render();
  });

  elements.additionalPensionRange.addEventListener("input", (event) => {
    state.additionalPensionPercent = getAdditionalPensionPercent(
      (event.target as HTMLInputElement).value
    );
    render();
  });

  syncSalaryInputs(defaultState.grossSalary);
  render();
}
