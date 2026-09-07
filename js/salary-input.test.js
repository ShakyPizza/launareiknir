import { initPage } from './app.js';
import { MAX_GROSS_SALARY } from './tax-tables.js';

function setup() {
  localStorage.clear();
  document.body.innerHTML = '<div id="current-calculator-root"></div>';
  const { currentController } = initPage();
  const salary = document.querySelector('[data-role="salary-number"]');
  const slider = document.querySelector('[data-role="salary-range"]');
  const enter = (value) => {
    salary.value = value;
    salary.dispatchEvent(new Event('input'));
  };
  return { currentController, salary, slider, enter };
}

describe('salary input', () => {
  it('accepts pasted Icelandic decimal amounts without multiplying the salary', () => {
    const { currentController, enter } = setup();
    enter('850.000,00');
    expect(currentController.state.grossMonthly).toBe(850_000);
  });

  it.each(['-850000', '850oops000', '85.00', '850,000.00'])('rejects invalid input %s without changing the calculation', (value) => {
    const { currentController, salary, enter } = setup();
    enter(value);
    expect(currentController.state.grossMonthly).toBe(850_000);
    expect(salary.getAttribute('aria-invalid')).toBe('true');
    expect(salary.validity.valid).toBe(false);
  });

  it('keeps the slider synchronized throughout the supported range', () => {
    const { currentController, slider, enter } = setup();
    enter('6.000.123');
    expect(slider.max).toBe(String(MAX_GROSS_SALARY));
    expect(slider.value).toBe('6000123');
    expect(currentController.state.grossMonthly).toBe(6_000_123);
  });

  it('clears validation after correction and applies zero and the salary cap consistently', () => {
    const { currentController, salary, slider, enter } = setup();
    enter('-1');
    enter('900.000,50');
    expect(salary.validity.valid).toBe(true);
    expect(salary.hasAttribute('aria-invalid')).toBe(false);
    expect(currentController.state.grossMonthly).toBe(900_001);
    enter('');
    expect(currentController.state.grossMonthly).toBe(0);
    expect(slider.value).toBe('0');
    enter('20.000.000');
    expect(currentController.state.grossMonthly).toBe(MAX_GROSS_SALARY);
    expect(slider.value).toBe(String(MAX_GROSS_SALARY));
    salary.focus();
    salary.blur();
    expect(salary.value).toBe('10.000.000');
  });

  it('preserves the caret while typing and formats after leaving the input', () => {
    const { salary, enter } = setup();
    salary.focus();
    enter('850000');
    salary.setSelectionRange(2, 2);
    salary.dispatchEvent(new Event('input'));
    expect(salary.selectionStart).toBe(2);
    salary.blur();
    expect(salary.value).toBe('850.000');
  });
});
