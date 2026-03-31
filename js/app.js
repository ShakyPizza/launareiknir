/**
 * app.js — Thin orchestration layer for the live calculator page.
 * Builds one or more calculator instances with shared rendering logic.
 *
 * @module app
 */

import { calculate, clampSalary, buildCurveData } from './calculator.js';
import { CURRENT_TAX_PROFILE, PROPOSAL_TAX_PROFILE } from './tax-tables.js';
import {
  renderHero,
  renderBreakdown,
  renderEmployerBreakdown,
  renderBottomGraph,
} from './render.js';

const DEFAULT_STATE = Object.freeze({
  grossMonthly:         850_000,
  usePersonalAllowance: true,
  useSpouseAllowance:   false,
  usePensionFund:       true,
  additionalPensionPct: 2,
  unionFeePct:          0,
});

/**
 * Apply a theme and persist the preference.
 *
 * @param {'dark'|'light'} theme
 * @param {HTMLButtonElement|null} themeToggle
 */
function applyTheme(theme, themeToggle) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);

  if (themeToggle) {
    themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Skipta yfir í ljóst þema' : 'Skipta yfir í dökkt þema',
    );
  }
}

/**
 * Initialize the theme toggle for the page.
 *
 * @param {Document} doc
 */
function initTheme(doc) {
  const themeToggle = /** @type {HTMLButtonElement|null} */ (doc.getElementById('theme-toggle'));

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme, themeToggle);
  }

  if (!themeToggle) return;

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.dataset.theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, themeToggle);
  });
}

/**
 * Format a number for the salary badge using Icelandic locale.
 *
 * @param {number} value
 * @returns {string}
 */
function formatBadge(value) {
  return `${new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(value)} kr.`;
}

/**
 * Build a namespaced id for a calculator control.
 *
 * @param {string} prefix
 * @param {string} name
 * @returns {string}
 */
function controlId(prefix, name) {
  return `${prefix}-${name}`;
}

/**
 * Render the full calculator markup into a container root.
 *
 * @param {HTMLElement} root
 * @param {{ prefix: string, graphHint: string }} options
 */
function renderCalculatorMarkup(root, { prefix, graphHint }) {
  const salaryRangeId = controlId(prefix, 'salary-range');
  const salaryNumberId = controlId(prefix, 'input-gross');
  const allowanceId = controlId(prefix, 'toggle-allowance');
  const spouseAllowanceId = controlId(prefix, 'toggle-spouse-allowance');
  const pensionId = controlId(prefix, 'toggle-pension');
  const additionalPensionId = controlId(prefix, 'input-additional-pension');
  const unionFeeId = controlId(prefix, 'input-union-fee');

  root.innerHTML = `
    <div class="calculator">
      <section class="calculator__inputs" aria-label="Inntaksgögn">
        <div class="inputs-fields">
          <div class="field field--salary">
            <div class="field__header">
              <label class="field__label" for="${salaryNumberId}">Brúttólaun á mánuði</label>
              <span class="field__badge" data-role="salary-badge">${formatBadge(DEFAULT_STATE.grossMonthly)}</span>
            </div>
            <input
              class="salary-slider"
              type="range"
              id="${salaryRangeId}"
              min="0"
              max="5000000"
              step="1000"
              value="${DEFAULT_STATE.grossMonthly}"
              aria-label="Brúttólaun á mánuði (sleðareiknir)"
              data-role="salary-range"
            >
            <div class="field__row">
              <div class="field__wrapper">
                <input
                  class="field__input"
                  type="number"
                  id="${salaryNumberId}"
                  name="gross"
                  min="0"
                  max="10000000"
                  step="1000"
                  value="${DEFAULT_STATE.grossMonthly}"
                  inputmode="numeric"
                  aria-label="Brúttólaun á mánuði (tölur)"
                  data-role="salary-number"
                >
                <span class="field__suffix" aria-hidden="true">kr.</span>
              </div>
            </div>
          </div>

          <div class="field field--toggles">
            <span class="field__label">Stillingar</span>
            <div class="toggle-group">
              <label class="toggle" for="${allowanceId}">
                <input
                  class="toggle__input"
                  type="checkbox"
                  id="${allowanceId}"
                  name="usePersonalAllowance"
                  checked
                  data-role="toggle-allowance"
                >
                <span class="toggle__track" aria-hidden="true"></span>
                <span class="toggle__text">Persónuafsláttur</span>
              </label>
              <label class="toggle" for="${spouseAllowanceId}">
                <input
                  class="toggle__input"
                  type="checkbox"
                  id="${spouseAllowanceId}"
                  name="useSpouseAllowance"
                  data-role="toggle-spouse-allowance"
                >
                <span class="toggle__track" aria-hidden="true"></span>
                <span class="toggle__text">Persónuafsláttur maka</span>
              </label>
              <label class="toggle" for="${pensionId}">
                <input
                  class="toggle__input"
                  type="checkbox"
                  id="${pensionId}"
                  name="usePensionFund"
                  checked
                  data-role="toggle-pension"
                >
                <span class="toggle__track" aria-hidden="true"></span>
                <span class="toggle__text">Lífeyrissjóður (4%)</span>
              </label>
            </div>
          </div>

          <div class="field field--additional-pension">
            <div class="field__header">
              <label class="field__label" for="${additionalPensionId}">Séreignarsparnaður</label>
              <span class="field__badge" data-role="additional-pension-badge">${DEFAULT_STATE.additionalPensionPct}%</span>
            </div>
            <div class="step-slider" role="group" aria-label="Séreignarhlutfall" data-role="step-slider">
              <button class="step-slider__btn" data-value="0" type="button" aria-pressed="false">0%</button>
              <button class="step-slider__btn" data-value="2" type="button" aria-pressed="true">2%</button>
              <button class="step-slider__btn" data-value="4" type="button" aria-pressed="false">4%</button>
            </div>
            <input
              class="sr-only"
              type="range"
              id="${additionalPensionId}"
              min="0"
              max="4"
              step="2"
              value="${DEFAULT_STATE.additionalPensionPct}"
              data-role="additional-pension-range"
            >
            <p class="field__hint">Frádráttarbær séreign (0, 2, 4% af brúttólaunum)</p>
          </div>

          <div class="field field--union-fee">
            <div class="field__header">
              <label class="field__label" for="${unionFeeId}">Iðgjald stéttarfélags</label>
            </div>
            <div class="field__row">
              <div class="field__wrapper">
                <input
                  class="field__input"
                  type="number"
                  id="${unionFeeId}"
                  name="unionFee"
                  min="0"
                  max="10"
                  step="0.1"
                  value="0"
                  inputmode="decimal"
                  aria-label="Iðgjald í stéttarfélag sem hlutfall af brúttólaunum"
                  data-role="union-fee-input"
                >
                <span class="field__suffix" aria-hidden="true">%</span>
              </div>
            </div>
            <p class="field__hint">Dregið frá eftir skatt (venjulega 0,5-1% af brúttólaunum)</p>
          </div>
        </div>
      </section>

      <section
        class="calculator__results"
        aria-label="Niðurstöður"
        aria-live="polite"
        aria-atomic="true"
      >
        <div class="result-hero">
          <div class="result-hero__label">Nettólaun á mánuði</div>
          <div class="result-hero__value" data-role="net-salary-value">—</div>
          <div class="result-hero__share" data-role="net-salary-share"></div>
        </div>

        <div class="tab-nav" role="tablist" aria-label="Úttaksyfirlit">
          <button
            class="tab-nav__btn tab-nav__btn--active"
            role="tab"
            aria-selected="true"
            data-role="tab-btn"
            data-tab="employee"
            type="button"
          >Starfsmaður</button>
          <button
            class="tab-nav__btn"
            role="tab"
            aria-selected="false"
            data-role="tab-btn"
            data-tab="employer"
            type="button"
          >Launagreiðandi</button>
        </div>

        <div class="breakdown" data-role="breakdown-container" role="tabpanel"></div>
        <div class="breakdown" data-role="employer-breakdown" role="tabpanel" hidden></div>
      </section>

      <div class="calculator__graph">
        <section class="bottom-graph" aria-labelledby="${controlId(prefix, 'bottom-graph-title')}">
          <div class="bottom-graph__header">
            <h2 class="bottom-graph__title" id="${controlId(prefix, 'bottom-graph-title')}">Nettólaun og skattur sem fall af brúttólaunum</h2>
            <p class="bottom-graph__hint">${graphHint}</p>
          </div>
          <div class="bottom-graph__chart" data-role="bottom-graph-chart" aria-hidden="true"></div>
          <div class="bottom-graph__legend" data-role="bottom-graph-legend" aria-hidden="true"></div>
        </section>
      </div>
    </div>
  `;
}

/**
 * Find a required element within a calculator root.
 *
 * @template {Element} T
 * @param {ParentNode} root
 * @param {string} selector
 * @returns {T}
 */
function getRequired(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Element fannst ekki: ${selector}`);
  }
  return /** @type {T} */ (element);
}

/**
 * Create a fully interactive calculator instance inside a root container.
 *
 * @param {HTMLElement} root
 * @param {{
 *   prefix: string,
 *   taxProfile: typeof CURRENT_TAX_PROFILE,
 *   comparisonTaxProfile?: typeof CURRENT_TAX_PROFILE | null,
 *   graphHint: string,
 * }} options
 */
function createCalculatorController(root, options) {
  renderCalculatorMarkup(root, {
    prefix: options.prefix,
    graphHint: options.graphHint,
  });

  let activeTab = 'employee';
  const state = { ...DEFAULT_STATE };

  const elements = {
    salaryRange: getRequired(root, '[data-role="salary-range"]'),
    salaryNumber: getRequired(root, '[data-role="salary-number"]'),
    salaryBadge: getRequired(root, '[data-role="salary-badge"]'),
    toggleAllowance: getRequired(root, '[data-role="toggle-allowance"]'),
    toggleSpouseAllowance: getRequired(root, '[data-role="toggle-spouse-allowance"]'),
    togglePension: getRequired(root, '[data-role="toggle-pension"]'),
    unionFeeInput: getRequired(root, '[data-role="union-fee-input"]'),
    additionalPensionRange: getRequired(root, '[data-role="additional-pension-range"]'),
    additionalBadge: getRequired(root, '[data-role="additional-pension-badge"]'),
    stepButtons: /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll('.step-slider__btn')),
    tabButtons: /** @type {NodeListOf<HTMLButtonElement>} */ (root.querySelectorAll('[data-role="tab-btn"]')),
    employeePanel: getRequired(root, '[data-role="breakdown-container"]'),
    employerPanel: getRequired(root, '[data-role="employer-breakdown"]'),
  };

  /**
   * Sync both salary inputs and badge to a new clamped value.
   *
   * @param {number} value
   */
  function syncSalary(value) {
    const clamped = clampSalary(value);
    state.grossMonthly = clamped;
    elements.salaryRange.value = String(clamped);
    elements.salaryNumber.value = String(clamped);
    elements.salaryBadge.textContent = formatBadge(clamped);
  }

  /**
   * Activate a tab panel and update aria-selected on tab buttons.
   *
   * @param {'employee'|'employer'} tabId
   */
  function switchTab(tabId) {
    activeTab = tabId;
    elements.tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === tabId;
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.classList.toggle('tab-nav__btn--active', isActive);
    });
    elements.employeePanel.hidden = tabId !== 'employee';
    elements.employerPanel.hidden = tabId !== 'employer';
  }

  /**
   * Sync step-slider button visuals and hidden range value.
   *
   * @param {number} selectedValue
   */
  function syncStepButtons(selectedValue) {
    elements.stepButtons.forEach((button) => {
      const isSelected = Number(button.dataset.value) === selectedValue;
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      button.classList.toggle('step-slider__btn--active', isSelected);
    });

    elements.additionalPensionRange.value = String(selectedValue);
    elements.additionalBadge.textContent = `${selectedValue}%`;
  }

  function render() {
    const result = calculate(state, options.taxProfile);
    const curve = buildCurveData(state, options.taxProfile);
    const graphMax = state.grossMonthly > 5_000_000 ? 10_000_000 : 5_000_000;

    const comparisonResult = options.comparisonTaxProfile
      ? calculate(state, options.comparisonTaxProfile)
      : null;
    const comparisonCurve = options.comparisonTaxProfile
      ? buildCurveData(state, options.comparisonTaxProfile)
      : null;

    renderHero(root, result);
    renderBreakdown(root, result);
    renderEmployerBreakdown(root, result);
    renderBottomGraph(root, result, curve, graphMax, {
      comparisonResult,
      comparisonCurve,
      comparisonLabel: options.comparisonTaxProfile?.shortLabel ?? '',
    });
  }

  elements.salaryRange.addEventListener('input', () => {
    syncSalary(Number(elements.salaryRange.value));
    render();
  });

  elements.salaryNumber.addEventListener('input', () => {
    syncSalary(Number(elements.salaryNumber.value));
    render();
  });

  elements.toggleAllowance.addEventListener('change', () => {
    state.usePersonalAllowance = elements.toggleAllowance.checked;
    render();
  });

  elements.toggleSpouseAllowance.addEventListener('change', () => {
    state.useSpouseAllowance = elements.toggleSpouseAllowance.checked;
    render();
  });

  elements.togglePension.addEventListener('change', () => {
    state.usePensionFund = elements.togglePension.checked;
    render();
  });

  elements.unionFeeInput.addEventListener('input', () => {
    const raw = parseFloat(elements.unionFeeInput.value);
    state.unionFeePct = Number.isFinite(raw) && raw >= 0 ? Math.min(raw, 10) : 0;
    render();
  });

  elements.stepButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = Number(button.dataset.value);
      if (!Number.isInteger(value) || value < 0 || value > 4) return;

      state.additionalPensionPct = value;
      syncStepButtons(value);
      render();
    });
  });

  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      if (tabId === 'employee' || tabId === 'employer') {
        switchTab(tabId);
      }
    });
  });

  syncSalary(state.grossMonthly);
  syncStepButtons(state.additionalPensionPct);
  switchTab(activeTab);
  render();

  return {
    root,
    state,
    render,
    taxProfile: options.taxProfile,
  };
}

/**
 * Initialize the header CTA that reveals and scrolls to the proposal section.
 *
 * @param {Document} doc
 */
function initProposalToggle(doc) {
  const proposalButton = /** @type {HTMLButtonElement|null} */ (doc.getElementById('proposal-toggle'));
  const proposalSection = /** @type {HTMLElement|null} */ (doc.getElementById('proposal-section'));

  if (!proposalButton || !proposalSection) return;

  proposalButton.addEventListener('click', () => {
    if (proposalSection.hidden) {
      proposalSection.hidden = false;
    }

    proposalButton.setAttribute('aria-expanded', 'true');

    if (typeof proposalSection.scrollIntoView === 'function') {
      proposalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const focusTarget = proposalSection.querySelector('.calculator-section__title');
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    }
  });
}

/**
 * Initialize the live calculator page.
 *
 * @param {Document} [doc=document]
 * @returns {{ currentController: ReturnType<typeof createCalculatorController>, proposalController: ReturnType<typeof createCalculatorController>|null } | null}
 */
export function initPage(doc = document) {
  const currentRoot = /** @type {HTMLElement|null} */ (doc.getElementById('current-calculator-root'));
  if (!currentRoot) return null;

  const proposalRoot = /** @type {HTMLElement|null} */ (doc.getElementById('proposal-calculator-root'));

  initTheme(doc);
  initProposalToggle(doc);

  const currentController = createCalculatorController(currentRoot, {
    prefix: 'current',
    taxProfile: CURRENT_TAX_PROFILE,
    graphHint: 'X-ás: brúttólaun (kr.) · Y-ás: hlutfall af brúttólaunum',
  });

  const proposalController = proposalRoot
    ? createCalculatorController(proposalRoot, {
      prefix: 'proposal',
      taxProfile: PROPOSAL_TAX_PROFILE,
      comparisonTaxProfile: CURRENT_TAX_PROFILE,
      graphHint: 'X-ás: brúttólaun (kr.) · Y-ás: hlutfall af brúttólaunum · brotalínur sýna núverandi kerfi',
    })
    : null;

  return {
    currentController,
    proposalController,
  };
}

initPage();
