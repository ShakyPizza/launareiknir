import { initPage } from './app.js';

function setupDom() {
  document.body.innerHTML = `
    <header class="site-header">
      <div class="container">
        <div class="site-header__inner">
          <div></div>
          <div class="site-header__controls">
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.body.innerHTML = '';
    delete document.documentElement.dataset.theme;
  });

  it('renders the current-system calculator and updates it from the salary input', () => {
    setupDom();
    const page = initPage(document);

    const currentRoot = document.getElementById('current-calculator-root');
    if (!currentRoot || !page) {
      throw new Error('Current calculator root fannst ekki.');
    }

    const currentNet = getRequired(currentRoot, '[data-role="net-salary-value"]');
    const initialCurrentNet = currentNet.textContent;

    const currentSalaryRange = /** @type {HTMLInputElement} */ (
      getRequired(currentRoot, '[data-role="salary-range"]')
    );

    currentSalaryRange.value = '1500000';
    currentSalaryRange.dispatchEvent(new Event('input', { bubbles: true }));

    expect(currentNet.textContent).not.toBe(initialCurrentNet);
    expect(getRequired(currentRoot, '[data-role="salary-badge"]').textContent).toBe('1.500.000 kr.');
    expect(page.currentController.taxProfile.key).toBe('current');
  });

  it('does not render the proposal toggle, section, or comparison summary', () => {
    setupDom();
    initPage(document);

    const currentRoot = document.getElementById('current-calculator-root');
    if (!currentRoot) {
      throw new Error('Current calculator root fannst ekki.');
    }

    expect(document.getElementById('proposal-toggle')).toBeNull();
    expect(document.getElementById('proposal-section')).toBeNull();
    expect(document.getElementById('proposal-calculator-root')).toBeNull();
    expect(currentRoot.querySelector('[data-role="net-comparison-summary"]')).toBeNull();
    expect(document.body.textContent).not.toContain('Tillaga Sjálfstæðisflokksins');
    expect(currentRoot.textContent).toContain('Laun og mótframlög samtals');
    expect(currentRoot.textContent).toContain(
      'Tryggingagjald og annar launatengdur kostnaður er ekki innifalinn.',
    );
  });

  it('still initializes when theme storage is unavailable', () => {
    setupDom();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    });

    expect(() => initPage(document)).not.toThrow();
    expect(document.querySelector('[data-role="net-salary-value"]')?.textContent).not.toBe('—');
    expect(() => getRequired(document, '#theme-toggle').click()).not.toThrow();
  });

  it('uses the effective system theme on first click and redraws chart colors', () => {
    setupDom();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn() })));
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      getPropertyValue: (name) => name === '--color-gross'
        ? (document.documentElement.dataset.theme === 'dark' ? '#dark' : '#light')
        : '',
    }));

    initPage(document);
    const chart = getRequired(document, '[data-role="bottom-graph-chart"]');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(chart.innerHTML).toContain('stroke="#dark"');

    getRequired(document, '#theme-toggle').click();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(chart.innerHTML).toContain('stroke="#light"');
  });

  it('follows system theme changes until the user chooses a theme', () => {
    setupDom();
    /** @type {((event: { matches: boolean }) => void)|null} */
    let colorSchemeListener = null;
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: (_eventName, listener) => {
        colorSchemeListener = listener;
      },
    })));
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      getPropertyValue: (name) => name === '--color-gross'
        ? (document.documentElement.dataset.theme === 'dark' ? '#dark' : '#light')
        : '',
    }));

    initPage(document);
    const chart = getRequired(document, '[data-role="bottom-graph-chart"]');
    if (!colorSchemeListener) throw new Error('Litakerfisvaktari var ekki skráður.');
    colorSchemeListener({ matches: true });

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(chart.innerHTML).toContain('stroke="#dark"');
  });

  it('uses one keyboard-accessible control for additional pension', () => {
    setupDom();
    const page = initPage(document);
    if (!page) throw new Error('Calculator initialized ekki.');

    expect(document.querySelector('[data-role="additional-pension-range"]')).toBeNull();
    const fourPercent = /** @type {HTMLButtonElement} */ (
      getRequired(document, '.step-slider__btn[data-value="4"]')
    );
    fourPercent.click();

    expect(page.currentController.state.additionalPensionPct).toBe(4);
    expect(fourPercent.getAttribute('aria-pressed')).toBe('true');
  });

  it('links tabs to panels and supports arrow-key navigation', () => {
    setupDom();
    initPage(document);

    const employeeTab = /** @type {HTMLButtonElement} */ (
      getRequired(document, '[data-tab="employee"]')
    );
    const employerTab = /** @type {HTMLButtonElement} */ (
      getRequired(document, '[data-tab="employer"]')
    );
    const employerPanel = /** @type {HTMLElement} */ (
      getRequired(document, '[data-role="employer-breakdown"]')
    );

    expect(employeeTab.getAttribute('aria-controls')).toBe(
      getRequired(document, '[data-role="breakdown-container"]').id,
    );
    expect(employerPanel.getAttribute('aria-labelledby')).toBe(employerTab.id);
    employeeTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(employerTab.getAttribute('aria-selected')).toBe('true');
    expect(employerTab.tabIndex).toBe(0);
    expect(document.activeElement).toBe(employerTab);
    expect(employerPanel.hidden).toBe(false);
  });

  it('preserves collapsed breakdown groups when inputs rerender results', () => {
    setupDom();
    initPage(document);

    const salaryGroup = /** @type {HTMLDetailsElement} */ (
      getRequired(document, '[data-role="breakdown-container"] details')
    );
    const employerGroup = /** @type {HTMLDetailsElement} */ (
      getRequired(document, '[data-role="employer-breakdown"] details')
    );
    salaryGroup.open = false;
    employerGroup.open = false;
    const salaryRange = /** @type {HTMLInputElement} */ (
      getRequired(document, '[data-role="salary-range"]')
    );
    salaryRange.value = '900000';
    salaryRange.dispatchEvent(new Event('input', { bubbles: true }));

    const rerenderedSalaryGroup = /** @type {HTMLDetailsElement} */ (
      getRequired(document, '[data-role="breakdown-container"] details')
    );
    expect(rerenderedSalaryGroup.open).toBe(false);
    expect(
      /** @type {HTMLDetailsElement} */ (
        getRequired(document, '[data-role="employer-breakdown"] details')
      ).open,
    ).toBe(false);
  });
});
