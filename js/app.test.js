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
  });
});
