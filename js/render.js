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

/**
 * Render the bottom XY line chart: net salary and tax as a function of gross salary.
 * X axis: 0–100% of max gross. Y axis: 0 to max gross (ISK).
 *
 * @param {import('./calculator.js').CalculationResult} result — current calculation (for the marker)
 * @param {Array<{ gross: number, net: number, tax: number }>} curve — pre-computed sweep
 */
export function renderBottomGraph(result, curve) {
  const chartEl  = document.getElementById('bottom-graph-chart');
  const legendEl = document.getElementById('bottom-graph-legend');
  if (!chartEl || !legendEl) return;

  if (result.grossSalary === 0 || !curve || curve.length === 0) {
    chartEl.innerHTML  = '';
    legendEl.innerHTML = '';
    return;
  }

  /* ── Layout constants ────────────────────────── */
  const W = 560, H = 200;
  const ML = 60, MR = 12, MT = 12, MB = 32;
  const CW = W - ML - MR;
  const CH = H - MT - MB;
  const MAX = 5_000_000;

  const toX = (gross) => ML + (gross / MAX) * CW;
  const toY = (val)   => MT + CH - (Math.max(val, 0) / MAX) * CH;

  /* ── Colors ──────────────────────────────────── */
  const colorNet    = cssVar('--color-gross');
  const colorTax    = cssVar('--color-tax');
  const colorRule   = cssVar('--color-rule');
  const colorMuted  = cssVar('--color-text-muted');
  const colorAccent = cssVar('--color-accent');

  /* ── Grid lines and Y axis labels ────────────── */
  const yTicks = [0, 1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000];
  const yGrid  = yTicks.map((v) => {
    const y     = toY(v);
    const label = v === 0 ? '0' : `${v / 1_000_000}M`;
    const dash  = v === 0 ? '' : ' stroke-dasharray="3,3"';
    return `<line x1="${ML}" y1="${y}" x2="${ML + CW}" y2="${y}" stroke="${colorRule}" stroke-width="0.5"${dash}/>
      <text x="${ML - 6}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" font-family="Inter,sans-serif" fill="${colorMuted}">${label}</text>`;
  }).join('\n      ');

  /* ── X axis labels ───────────────────────────── */
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const xGrid  = xTicks.map((pct) => {
    const x     = ML + pct * CW;
    const label = `${Math.round(pct * 100)}%`;
    const dash  = pct === 0 ? '' : ' stroke-dasharray="3,3"';
    return `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="0.5"${dash}/>
      <text x="${x}" y="${MT + CH + 16}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" fill="${colorMuted}">${label}</text>`;
  }).join('\n      ');

  /* ── Polyline point strings ──────────────────── */
  const netPoints = curve.map((p) => `${toX(p.gross).toFixed(1)},${toY(p.net).toFixed(1)}`).join(' ');
  const taxPoints = curve.map((p) => `${toX(p.gross).toFixed(1)},${toY(p.tax).toFixed(1)}`).join(' ');

  /* ── Current salary marker ───────────────────── */
  const mx = toX(result.grossSalary).toFixed(1);
  const marker = `
      <line x1="${mx}" y1="${MT}" x2="${mx}" y2="${MT + CH}" stroke="${colorAccent}" stroke-width="1" stroke-dasharray="4,3"/>
      <circle cx="${mx}" cy="${toY(result.netSalary).toFixed(1)}" r="3.5" fill="${colorNet}"/>
      <circle cx="${mx}" cy="${toY(result.taxAfterAllowance).toFixed(1)}" r="3.5" fill="${colorTax}"/>`;

  /* ── Assemble SVG ────────────────────────────── */
  chartEl.innerHTML = `<svg
      class="bottom-graph__svg"
      viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Nettólaun og staðgreiðsla sem fall af brúttólaunum"
    >
      ${yGrid}
      ${xGrid}
      <line x1="${ML}" y1="${MT}" x2="${ML}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="1"/>
      <line x1="${ML}" y1="${MT + CH}" x2="${ML + CW}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="1"/>
      <polyline points="${netPoints}" fill="none" stroke="${colorNet}" stroke-width="1.5" stroke-linejoin="round"/>
      <polyline points="${taxPoints}" fill="none" stroke="${colorTax}" stroke-width="1.5" stroke-linejoin="round"/>
      ${marker}
    </svg>`;

  /* ── Legend ──────────────────────────────────── */
  legendEl.innerHTML = `
    <div class="bottom-graph__item">
      <i class="bottom-graph__swatch" style="background:${colorNet}" aria-hidden="true"></i>
      <span class="bottom-graph__label">Nettólaun</span>
      <span class="bottom-graph__value">${formatISK(result.netSalary)}</span>
    </div>
    <div class="bottom-graph__item">
      <i class="bottom-graph__swatch" style="background:${colorTax}" aria-hidden="true"></i>
      <span class="bottom-graph__label">Staðgreiðsla</span>
      <span class="bottom-graph__value">${formatISK(result.taxAfterAllowance)}</span>
    </div>`;
}
