import { initPage } from './app.js';

function setupDom() {
  document.body.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="site-header__inner">
          <div></div>
          <div class="site-header__controls">
            <label class="toggle site-header__proposal-toggle">
              <input
                class="toggle__input"
                id="proposal-toggle"
                type="checkbox"
                aria-controls="proposal-section"
              />
              <span class="toggle__track" aria-hidden="true"></span>
              <span class="toggle__text">Tillaga Sjálfstæðisflokksins</span>
            </label>
            <a
              class="site-header__proposal-link"
              href="https://xd.is/2026/03/31/storfelldar-skattalaekkanir-i-efnahagstillogum-sjalfstaedisflokksins/"
            >
              Heimild tillögu
            </a>
            <button class="theme-toggle" id="theme-toggle" type="button"></button>
          </div>
        </div>
      </div>
    </header>
    <main class="site-main">
      <div class="container site-main__stack">
        <section class="calculator-section">
          <div id="current-calculator-root"></div>
        </section>
        <section
          class="calculator-section calculator-section--proposal"
          id="proposal-section"
          aria-labelledby="proposal-section-title"
          hidden
        >
          <div class="calculator-section__header">
            <h2 class="calculator-section__title" id="proposal-section-title" tabindex="-1">
              Tillaga Sjálfstæðisflokksins
            </h2>
          </div>
          <div id="proposal-calculator-root"></div>
        </section>
      </div>
    </main>
  `;
}

function getRequired(root, selector) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`Element fannst ekki: ${selector}`);
  }
  return element;
}

describe('live calculator app', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    delete document.documentElement.dataset.theme;
  });

  it('reuses the original inputs and updates the proposal calculator from the same state', () => {
    setupDom();
    initPage(document);

    const currentRoot = document.getElementById('current-calculator-root');
    const proposalRoot = document.getElementById('proposal-calculator-root');

    if (!currentRoot || !proposalRoot) {
      throw new Error('Calculator roots fundust ekki.');
    }

    const currentNet = getRequired(currentRoot, '[data-role="net-salary-value"]');
    const proposalNet = getRequired(proposalRoot, '[data-role="net-salary-value"]');
    const initialCurrentNet = currentNet.textContent;
    const initialProposalNet = proposalNet.textContent;

    expect(proposalRoot.querySelector('[data-role="salary-range"]')).toBeNull();

    const currentSalaryRange = /** @type {HTMLInputElement} */ (
      getRequired(currentRoot, '[data-role="salary-range"]')
    );

    currentSalaryRange.value = '1500000';
    currentSalaryRange.dispatchEvent(new Event('input', { bubbles: true }));

    expect(currentNet.textContent).not.toBe(initialCurrentNet);
    expect(proposalNet.textContent).not.toBe(initialProposalNet);
    expect(getRequired(currentRoot, '[data-role="salary-badge"]').textContent).toBe('1.500.000 kr.');
  });

  it('reveals the proposal section and renders current-system comparison traces', () => {
    setupDom();

    const proposalSection = /** @type {HTMLElement} */ (document.getElementById('proposal-section'));
    const proposalToggle = /** @type {HTMLInputElement} */ (document.getElementById('proposal-toggle'));

    initPage(document);

    proposalToggle.checked = true;
    proposalToggle.dispatchEvent(new Event('change', { bubbles: true }));

    expect(proposalSection.hidden).toBe(false);

    const proposalRoot = document.getElementById('proposal-calculator-root');
    if (!proposalRoot) {
      throw new Error('Proposal root fannst ekki.');
    }

    const legend = getRequired(proposalRoot, '[data-role="bottom-graph-legend"]');
    const chart = getRequired(proposalRoot, '[data-role="bottom-graph-chart"]');
    const comparisonSummary = getRequired(proposalRoot, '[data-role="net-comparison-summary"]');

    expect(legend.textContent).toContain('Nettólaun — Núverandi kerfi');
    expect(legend.textContent).toContain('Staðgreiðsla — Núverandi kerfi');
    expect(chart.innerHTML).toContain('bottom-graph__polyline--compare-net');
    expect(chart.innerHTML).toContain('bottom-graph__polyline--compare-tax');
    expect(comparisonSummary.textContent).toContain('Tillaga Sjálfstæðisflokksins');
    expect(comparisonSummary.textContent).toContain('Núverandi kerfi');
    expect(comparisonSummary.textContent).toContain('kr.');
    expect(comparisonSummary.textContent).toContain('% af brúttólaunum');
  });

  it('hides the proposal section when the header toggle is false and shows it only when true', () => {
    setupDom();
    initPage(document);

    const proposalSection = /** @type {HTMLElement} */ (document.getElementById('proposal-section'));
    const proposalToggle = /** @type {HTMLInputElement} */ (document.getElementById('proposal-toggle'));

    expect(proposalToggle.checked).toBe(false);
    expect(proposalSection.hidden).toBe(true);

    proposalToggle.checked = true;
    proposalToggle.dispatchEvent(new Event('input', { bubbles: true }));
    expect(proposalSection.hidden).toBe(false);

    proposalToggle.checked = false;
    proposalToggle.dispatchEvent(new Event('input', { bubbles: true }));
    expect(proposalSection.hidden).toBe(true);
  });
});
