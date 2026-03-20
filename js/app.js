/**
 * app.js — Thin orchestration layer.
 * Reads form state → calls calculate() → calls render functions.
 * Contains zero calculation logic and zero tax data.
 *
 * @module app
 */

import { calculate, clampSalary } from './calculator.js';
import { renderHero, renderVisualization, renderBreakdown } from './render.js';

/* ── Default state ─────────────────────────────────── */

const state = {
  grossMonthly:        850_000,
  usePersonalAllowance: true,
  usePensionFund:       true,
  additionalPensionPct: 2,
};

/* ── Element references ────────────────────────────── */

const elSalaryRange          = /** @type {HTMLInputElement} */ (document.getElementById('salary-range'));
const elSalaryNumber         = /** @type {HTMLInputElement} */ (document.getElementById('input-gross'));
const elSalaryBadge          = document.getElementById('salary-badge');
const elToggleAllowance      = /** @type {HTMLInputElement} */ (document.getElementById('toggle-allowance'));
const elTogglePension        = /** @type {HTMLInputElement} */ (document.getElementById('toggle-pension'));
const elAdditionalBadge      = document.getElementById('additional-pension-badge');
const elStepBtns             = /** @type {NodeListOf<HTMLButtonElement>} */ (
  document.querySelectorAll('.step-slider__btn')
);

/* ── Helpers ───────────────────────────────────────── */

/** Format a number for the salary badge using Icelandic locale. */
function formatBadge(value) {
  return new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(value) + ' kr.';
}

/** Sync both salary inputs and badge to a new clamped value. */
function syncSalary(value) {
  const clamped          = clampSalary(value);
  state.grossMonthly     = clamped;
  elSalaryRange.value    = String(clamped);
  elSalaryNumber.value   = String(clamped);
  if (elSalaryBadge) elSalaryBadge.textContent = formatBadge(clamped);
}

/** Sync step-slider button pressed states. */
function syncStepBtns(selectedValue) {
  elStepBtns.forEach((btn) => {
    const isSelected = Number(btn.dataset.value) === selectedValue;
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
  if (elAdditionalBadge) elAdditionalBadge.textContent = `${selectedValue}%`;
}

/* ── Render pipeline ───────────────────────────────── */

function render() {
  const result = calculate(state);
  renderHero(result);
  renderVisualization(result);
  renderBreakdown(result);
}

/* ── Event listeners ───────────────────────────────── */

elSalaryRange.addEventListener('input', () => {
  syncSalary(Number(elSalaryRange.value));
  render();
});

elSalaryNumber.addEventListener('input', () => {
  syncSalary(Number(elSalaryNumber.value));
  render();
});

elToggleAllowance.addEventListener('change', () => {
  state.usePersonalAllowance = elToggleAllowance.checked;
  render();
});

elTogglePension.addEventListener('change', () => {
  state.usePensionFund = elTogglePension.checked;
  render();
});

elStepBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const value = Number(btn.dataset.value);
    if (!Number.isInteger(value) || value < 0 || value > 4) return;
    state.additionalPensionPct = value;
    syncStepBtns(value);
    render();
  });
});

/* ── Initial render ────────────────────────────────── */

syncSalary(state.grossMonthly);
syncStepBtns(state.additionalPensionPct);
render();
