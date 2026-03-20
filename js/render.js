/**
 * render.js — DOM mutation and SVG generation.
 * Reads from CalculationResult, writes to DOM. No calculation logic here.
 *
 * @module render
 */

import { formatISK, formatPct } from './calculator.js';

/**
 * Resolve a CSS custom property value from :root.
 *
 * @param {string} varName — e.g. '--color-gross'
 * @returns {string}
 */
function cssVar(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/**
 * Render the net salary hero block.
 *
 * @param {import('./calculator.js').CalculationResult} result
 */
export function renderHero(result) {
  const valueEl = document.getElementById('net-salary-value');
  const shareEl = document.getElementById('net-salary-share');
  if (!valueEl || !shareEl) return;

  valueEl.textContent = formatISK(result.netSalary);
  shareEl.textContent = result.grossSalary > 0
    ? `${formatPct(result.netShare)} af brúttólaunum`
    : '';
}

/**
 * Render the stacked SVG bar visualization.
 *
 * @param {import('./calculator.js').CalculationResult} result
 */
export function renderVisualization(result) {
  const container = document.getElementById('viz-container');
  const labelsEl  = document.getElementById('viz-labels');
  if (!container || !labelsEl) return;

  if (result.grossSalary === 0) {
    container.innerHTML = '';
    labelsEl.innerHTML  = '';
    return;
  }

  const segments = [
    {
      key:   'net',
      label: 'Nettólaun',
      share: result.netShare,
      color: cssVar('--color-gross'),
    },
    {
      key:   'tax',
      label: 'Staðgreiðsla',
      share: result.taxShare,
      color: cssVar('--color-tax'),
    },
    {
      key:   'pension',
      label: 'Lífeyrissjóður',
      share: result.pensionShare,
      color: cssVar('--color-social'),
    },
    {
      key:   'additional',
      label: 'Séreign',
      share: result.additionalPensionShare,
      color: cssVar('--color-deduction'),
    },
  ].filter((s) => s.share > 0);

  /* SVG bar */
  const BAR_H  = 48;
  let   offset = 0;

  const rects = segments.map((seg) => {
    const x     = offset;
    const width = seg.share * 100;
    offset += width;
    return `<rect
      x="${x}%" y="0"
      width="${width}%" height="${BAR_H}"
      fill="${seg.color}"
      class="viz-bar__segment"
    ><title>${seg.label}: ${formatPct(seg.share)}</title></rect>`;
  }).join('\n');

  container.innerHTML = `
    <svg
      class="viz__bar"
      viewBox="0 0 100 ${BAR_H}"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hlutfallsleg skipting launa"
    >${rects}</svg>`;

  /* Proportion labels */
  labelsEl.innerHTML = segments.map((seg) => `
    <div class="viz-label viz-label--${seg.key}" style="flex: ${seg.share}; min-width: 0">
      <span class="viz-label__pct">${formatPct(seg.share)}</span>
      <span class="viz-label__name">${seg.label}</span>
    </div>`).join('\n');
}

/**
 * Render the financial breakdown table.
 *
 * @param {import('./calculator.js').CalculationResult} result
 */
export function renderBreakdown(result) {
  const container = document.getElementById('breakdown-container');
  if (!container) return;

  if (result.grossSalary === 0) {
    container.innerHTML = '';
    return;
  }

  const row = (term, value, modifiers = '') => `
    <div class="breakdown__row ${modifiers}">
      <dt class="breakdown__term">${term}</dt>
      <dd class="breakdown__value ${value < 0 ? 'breakdown__value--negative' : ''}">${
        value < 0 ? '−' + formatISK(Math.abs(value)) : formatISK(value)
      }</dd>
    </div>`;

  const mutedRow = (term, value) => `
    <div class="breakdown__row breakdown__row--sub">
      <dt class="breakdown__term">${term}</dt>
      <dd class="breakdown__value breakdown__value--muted">${formatISK(value)}</dd>
    </div>`;

  const groupHeader = (title) => `
    <div class="breakdown__group-header">${title}</div>`;

  let html = '';

  /* ── Group: Laun ── */
  html += `<div class="breakdown__group">`;
  html += groupHeader('Laun');
  html += row('Brúttólaun', result.grossSalary);
  html += `</div>`;

  /* ── Group: Frádráttur ── */
  html += `<div class="breakdown__group">`;
  html += groupHeader('Frádráttur');

  if (result.pensionFundAmount > 0) {
    html += row('Lífeyrissjóður (4%)', -result.pensionFundAmount);
  }
  if (result.additionalPensionAmount > 0) {
    html += row('Séreign', -result.additionalPensionAmount);
  }

  html += row('Skattstofn', result.taxableBase);
  html += `</div>`;

  /* ── Group: Staðgreiðsla ── */
  html += `<div class="breakdown__group">`;
  html += groupHeader('Staðgreiðsla');
  html += row('Tekjuskattur (fyrir persónuafslátt)', result.taxBeforeAllowance);

  if (result.personalAllowanceUsed > 0) {
    html += row('Persónuafsláttur', -result.personalAllowanceUsed);
  }

  html += row('Staðgreiðsla', -result.taxAfterAllowance);

  /* Bracket sub-rows */
  result.bracketBreakdown
    .filter((b) => b.taxableAmount > 0)
    .forEach((b) => {
      html += mutedRow(
        `${b.label} (${formatPct(b.rate, 2)}) — ${formatISK(b.taxableAmount)} í þrepinu`,
        b.taxAmount,
      );
    });

  html += `</div>`;

  /* ── Total ── */
  html += `<div class="breakdown__group">`;
  html += `<div class="breakdown__row breakdown__row--total">
    <dt class="breakdown__term">Nettólaun</dt>
    <dd class="breakdown__value">${formatISK(result.netSalary)}</dd>
  </div>`;
  html += `</div>`;

  container.innerHTML = html;
}
