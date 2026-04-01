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
 * @param {string} [fallback='']
 * @returns {string}
 */
function cssVar(varName, fallback = '') {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

/**
 * Find a required element within a calculator root.
 *
 * @param {ParentNode} root
 * @param {string} role
 * @returns {HTMLElement}
 */
function getRole(root, role) {
  const element = root.querySelector(`[data-role="${role}"]`);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Element með data-role="${role}" fannst ekki.`);
  }
  return element;
}

/**
 * Render the net salary hero block.
 *
 * @param {HTMLElement} root
 * @param {import('./calculator.js').CalculationResult} result
 */
export function renderHero(root, result) {
  const valueEl = getRole(root, 'net-salary-value');
  const shareEl = getRole(root, 'net-salary-share');

  valueEl.textContent = formatISK(result.netSalary);
  shareEl.textContent = result.grossSalary > 0
    ? `${formatPct(result.netShare)} af brúttólaunum`
    : '';
}

/**
 * Render a proposal-vs-current net salary comparison block.
 *
 * @param {HTMLElement} root
 * @param {import('./calculator.js').CalculationResult} result
 * @param {import('./calculator.js').CalculationResult|null} comparisonResult
 * @param {string} [comparisonLabel='Núverandi kerfi']
 */
export function renderNetComparison(root, result, comparisonResult, comparisonLabel = 'Núverandi kerfi') {
  const container = getRole(root, 'net-comparison-summary');

  if (!comparisonResult) {
    container.hidden = true;
    return;
  }

  getRole(root, 'proposal-net-label').textContent = 'Tillaga Sjálfstæðisflokksins';
  getRole(root, 'proposal-net-amount').textContent = formatISK(result.netSalary);
  getRole(root, 'proposal-net-share').textContent = `${formatPct(result.netShare)} af brúttólaunum`;

  getRole(root, 'comparison-net-label').textContent = comparisonLabel;
  getRole(root, 'comparison-net-amount').textContent = formatISK(comparisonResult.netSalary);
  getRole(root, 'comparison-net-share').textContent = `${formatPct(comparisonResult.netShare)} af brúttólaunum`;

  container.hidden = false;
}

/**
 * Render the financial breakdown table.
 *
 * @param {HTMLElement} root
 * @param {import('./calculator.js').CalculationResult} result
 */
export function renderBreakdown(root, result) {
  const container = getRole(root, 'breakdown-container');

  if (result.grossSalary === 0) {
    container.innerHTML = '';
    return;
  }

  const row = (term, value, modifiers = '') => `
    <div class="breakdown__row ${modifiers}">
      <span class="breakdown__term">${term}</span>
      <span class="breakdown__value ${value < 0 ? 'breakdown__value--negative' : ''}">${
        value < 0 ? '−' + formatISK(Math.abs(value)) : formatISK(value)
      }</span>
    </div>`;

  const mutedRow = (term, value) => `
    <div class="breakdown__row breakdown__row--sub">
      <span class="breakdown__term">${term}</span>
      <span class="breakdown__value breakdown__value--muted">${formatISK(value)}</span>
    </div>`;

  const groupOpen = (title) =>
    `<details class="breakdown__group" open>` +
    `<summary class="breakdown__group-header">${title}</summary>` +
    `<div class="breakdown__group-body">`;

  const groupClose = '</div></details>';

  let html = '';

  html += groupOpen('Laun');
  html += row('Brúttólaun', result.grossSalary);
  if (result.vacationPayAmount > 0) {
    html += row('Orlof greitt út með launum', result.vacationPayAmount);
  }
  html += groupClose;

  html += groupOpen('Frádráttur');

  if (result.pensionFundAmount > 0) {
    html += row('Lífeyrissjóður (4%)', -result.pensionFundAmount);
  }
  if (result.additionalPensionAmount > 0) {
    html += row('Séreign', -result.additionalPensionAmount);
  }

  html += row('Skattstofn', result.taxableBase);
  html += groupClose;

  html += groupOpen('Staðgreiðsla');
  html += row('Tekjuskattur (fyrir persónuafslátt)', result.taxBeforeAllowance);

  if (result.personalAllowanceUsed > 0) {
    html += row('Persónuafsláttur', -result.personalAllowanceUsed);
  }
  if (result.spouseAllowanceUsed > 0) {
    html += row('Persónuafsláttur maka', -result.spouseAllowanceUsed);
  }

  html += row('Staðgreiðsla', -result.taxAfterAllowance);

  result.bracketBreakdown
    .filter((bracket) => bracket.taxableAmount > 0)
    .forEach((bracket) => {
      html += mutedRow(
        `${bracket.label} (${formatPct(bracket.rate, 2)}) — ${formatISK(bracket.taxableAmount)} í þrepinu`,
        bracket.taxAmount,
      );
    });

  html += groupClose;

  if (result.unionFeeAmount > 0) {
    html += groupOpen('Aðrar greiðslur');
    html += row('Iðgjald stéttarfélags', -result.unionFeeAmount);
    html += groupClose;
  }

  html += `<div class="breakdown__group breakdown__group--total">
    <div class="breakdown__row breakdown__row--total">
      <span class="breakdown__term">Nettólaun</span>
      <span class="breakdown__value">${formatISK(result.netSalary)}</span>
    </div>
  </div>`;

  container.innerHTML = html;
}

/**
 * Render the employer cost breakdown table.
 *
 * @param {HTMLElement} root
 * @param {import('./calculator.js').CalculationResult} result
 */
export function renderEmployerBreakdown(root, result) {
  const container = getRole(root, 'employer-breakdown');

  if (result.grossSalary === 0) {
    container.innerHTML = '';
    return;
  }

  const row = (term, value) => `
    <div class="breakdown__row">
      <span class="breakdown__term">${term}</span>
      <span class="breakdown__value">${formatISK(value)}</span>
    </div>`;

  const groupOpen = (title) =>
    `<details class="breakdown__group" open>` +
    `<summary class="breakdown__group-header">${title}</summary>` +
    `<div class="breakdown__group-body">`;

  const groupClose = '</div></details>';

  let html = '';

  html += groupOpen('Kostnaður launagreiðanda');
  html += row('Brúttólaun', result.grossSalary);
  if (result.vacationPayAmount > 0) {
    html += row('Orlof greitt út með launum', result.vacationPayAmount);
  }
  html += row('Mótframlag í lífeyrissjóð (11,5%)', result.employerPensionAmount);
  if (result.employerSereignMatch > 0) {
    html += row('Séreign — viðbót launagreiðanda (2%)', result.employerSereignMatch);
  }
  html += groupClose;

  html += `<div class="breakdown__group breakdown__group--total">
    <div class="breakdown__row breakdown__row--total">
      <span class="breakdown__term">Heildarkostnaður</span>
      <span class="breakdown__value">${formatISK(result.totalEmployerCost)}</span>
    </div>
  </div>`;

  container.innerHTML = html;
}

/**
 * Render the bottom XY line chart.
 * X axis: gross salary. Y axis: share of gross with a dynamic ceiling.
 *
 * @param {HTMLElement} root
 * @param {import('./calculator.js').CalculationResult} result
 * @param {Array<{ gross: number, net: number, tax: number, pension: number, additionalPension: number, unionFee: number, employerPension: number, employerSereignMatch: number, totalCompensation: number }>} curve
 * @param {number} [graphMax=5_000_000]
 * @param {{
 *   comparisonResult?: import('./calculator.js').CalculationResult|null,
 *   comparisonCurve?: Array<{ gross: number, net: number, tax: number, pension: number, additionalPension: number, unionFee: number, employerPension: number, employerSereignMatch: number, totalCompensation: number }> | null,
 *   comparisonLabel?: string,
 * }} [options]
 */
export function renderBottomGraph(root, result, curve, graphMax = 5_000_000, options = {}) {
  const chartEl = getRole(root, 'bottom-graph-chart');
  const legendEl = getRole(root, 'bottom-graph-legend');

  if (result.grossSalary === 0 || !curve || curve.length === 0) {
    chartEl.innerHTML = '';
    legendEl.innerHTML = '';
    return;
  }

  const comparisonResult = options.comparisonResult ?? null;
  const comparisonCurve = options.comparisonCurve ?? null;
  const comparisonLabel = options.comparisonLabel ?? 'Núverandi kerfi';

  const W = 560;
  const H = 280;
  const ML = 44;
  const MR = 12;
  const MT = 12;
  const MB = 26;
  const CW = W - ML - MR;
  const CH = H - MT - MB;
  const MAX = graphMax;

  const toX = (gross) => ML + (gross / MAX) * CW;

  const colorNet = cssVar('--color-gross', '#164b59');
  const colorTax = cssVar('--color-tax', '#8b3018');
  const colorPension = cssVar('--color-social', '#7c654b');
  const colorAdditional = cssVar('--color-deduction', '#9e6b2e');
  const colorUnion = cssVar('--color-union', '#4f5d75');
  const colorTotal = cssVar('--color-text-muted', '#6e6a63');
  const colorRule = cssVar('--color-rule', '#d8d2c7');
  const colorMuted = cssVar('--color-text-muted', '#6e6a63');
  const colorAccent = cssVar('--color-accent', '#164b59');
  const colorBg = cssVar('--color-bg', '#fffdf8');

  const hasPension = result.pensionFundAmount > 0;
  const hasAdditional = result.additionalPensionAmount > 0;
  const hasUnion = result.unionFeeAmount > 0;
  const totalShare = result.totalCompensationShare;

  const shareValues = curve
    .filter((point) => point.gross > 0)
    .flatMap((point) => [
      point.net / point.gross,
      point.tax / point.gross,
      point.pension / point.gross,
      point.additionalPension / point.gross,
      point.unionFee / point.gross,
      point.totalCompensation / point.gross,
    ]);

  if (comparisonCurve) {
    comparisonCurve
      .filter((point) => point.gross > 0)
      .forEach((point) => {
        shareValues.push(point.net / point.gross, point.tax / point.gross);
      });
  }

  const maxShare = shareValues.length > 0 ? Math.max(...shareValues) : 1;
  const yMax = Math.max(1, Math.ceil(maxShare / 0.25) * 0.25);
  const toY = (share) => MT + CH - (Math.max(share, 0) / yMax) * CH;

  const yTicks = [];
  for (let tick = 0; tick <= yMax + 0.001; tick += 0.25) {
    yTicks.push(Number(tick.toFixed(2)));
  }
  const yGrid = yTicks.map((pct) => {
    const y = toY(pct);
    const label = `${Math.round(pct * 100)}%`;
    const dash = pct === 0 ? '' : ' stroke-dasharray="3,3"';
    return `<line x1="${ML}" y1="${y}" x2="${ML + CW}" y2="${y}" stroke="${colorRule}" stroke-width="0.5"${dash}/>
      <text x="${ML - 5}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" font-family="Inter,sans-serif" fill="${colorMuted}">${label}</text>`;
  }).join('\n      ');

  const xTicks = graphMax > 5_000_000
    ? [0, 2_000_000, 4_000_000, 6_000_000, 8_000_000, 10_000_000]
    : [0, 1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000];
  const xGrid = xTicks.map((value) => {
    const x = toX(value);
    const label = value === 0 ? '0' : `${value / 1_000_000}M`;
    const dash = value === 0 ? '' : ' stroke-dasharray="3,3"';
    return `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="0.5"${dash}/>
      <text x="${x}" y="${MT + CH + 14}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" fill="${colorMuted}">${label}</text>`;
  }).join('\n      ');

  const pts = (points, getter) => {
    const real = points.filter((point) => point.gross > 0);
    if (real.length === 0) return '';

    const startShare = getter(real[0]) / real[0].gross;
    const anchor = `${toX(0).toFixed(1)},${toY(startShare).toFixed(1)}`;
    return [anchor, ...real.map((point) =>
      `${toX(point.gross).toFixed(1)},${toY(getter(point) / point.gross).toFixed(1)}`),
    ].join(' ');
  };

  const netPoints = pts(curve, (point) => point.net);
  const taxPoints = pts(curve, (point) => point.tax);
  const pensionPoints = pts(curve, (point) => point.pension);
  const additionalPoints = pts(curve, (point) => point.additionalPension);
  const unionPoints = pts(curve, (point) => point.unionFee);
  const totalPoints = pts(curve, (point) => point.totalCompensation);

  const comparisonNetPoints = comparisonCurve
    ? pts(comparisonCurve, (point) => point.net)
    : '';
  const comparisonTaxPoints = comparisonCurve
    ? pts(comparisonCurve, (point) => point.tax)
    : '';

  const mx = toX(result.grossSalary).toFixed(1);

  const solidDot = (share, color) =>
    `<circle cx="${mx}" cy="${toY(share).toFixed(1)}" r="3" fill="${color}"/>`;

  const compareDot = (share, color) =>
    `<circle cx="${mx}" cy="${toY(share).toFixed(1)}" r="2.5" fill="${colorBg}" stroke="${color}" stroke-width="1.25"/>`;

  const marker = `
      <line x1="${mx}" y1="${MT}" x2="${mx}" y2="${MT + CH}" stroke="${colorAccent}" stroke-width="1" stroke-dasharray="4,3"/>
      ${solidDot(result.netShare, colorNet)}
      ${solidDot(result.taxShare, colorTax)}
      ${hasPension ? solidDot(result.pensionShare, colorPension) : ''}
      ${hasAdditional ? solidDot(result.additionalPensionShare, colorAdditional) : ''}
      ${hasUnion ? solidDot(result.unionFeeShare, colorUnion) : ''}
      ${solidDot(totalShare, colorTotal)}
      ${comparisonResult ? compareDot(comparisonResult.netShare, colorNet) : ''}
      ${comparisonResult ? compareDot(comparisonResult.taxShare, colorTax) : ''}`;

  chartEl.innerHTML = `<svg
      class="bottom-graph__svg"
      viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hlutfall launa og skatts af brúttólaunum"
    >
      ${yGrid}
      ${xGrid}
      <line x1="${ML}" y1="${MT}" x2="${ML}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="1"/>
      <line x1="${ML}" y1="${MT + CH}" x2="${ML + CW}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="1"/>
      ${hasPension ? `<polyline class="bottom-graph__polyline bottom-graph__polyline--pension" points="${pensionPoints}" fill="none" stroke="${colorPension}" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
      ${hasAdditional ? `<polyline class="bottom-graph__polyline bottom-graph__polyline--additional" points="${additionalPoints}" fill="none" stroke="${colorAdditional}" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
      ${hasUnion ? `<polyline class="bottom-graph__polyline bottom-graph__polyline--union" points="${unionPoints}" fill="none" stroke="${colorUnion}" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
      ${comparisonCurve ? `<polyline class="bottom-graph__polyline bottom-graph__polyline--compare-net" points="${comparisonNetPoints}" fill="none" stroke="${colorNet}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="5,4" stroke-opacity="0.45"/>` : ''}
      ${comparisonCurve ? `<polyline class="bottom-graph__polyline bottom-graph__polyline--compare-tax" points="${comparisonTaxPoints}" fill="none" stroke="${colorTax}" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="5,4" stroke-opacity="0.45"/>` : ''}
      <polyline class="bottom-graph__polyline bottom-graph__polyline--tax" points="${taxPoints}" fill="none" stroke="${colorTax}" stroke-width="1.5" stroke-linejoin="round"/>
      <polyline class="bottom-graph__polyline bottom-graph__polyline--net" points="${netPoints}" fill="none" stroke="${colorNet}" stroke-width="1.5" stroke-linejoin="round"/>
      <polyline class="bottom-graph__polyline bottom-graph__polyline--total" points="${totalPoints}" fill="none" stroke="${colorTotal}" stroke-width="1" stroke-linejoin="round"/>
      ${marker}
    </svg>`;

  const legendItem = (key, label, value, modifiers = '') => `
    <div class="bottom-graph__item ${modifiers}">
      <i class="bottom-graph__swatch bottom-graph__swatch--${key}" aria-hidden="true"></i>
      <span class="bottom-graph__label">${label}</span>
      <span class="bottom-graph__value">${value}</span>
    </div>`;

  const comparisonDivider = comparisonResult
    ? `<div class="bottom-graph__legend-divider" aria-hidden="true"></div>`
    : '';

  legendEl.innerHTML = [
    legendItem('net', 'Nettólaun', formatPct(result.netShare)),
    legendItem('tax', 'Staðgreiðsla', formatPct(result.taxShare)),
    hasPension ? legendItem('pension', 'Lífeyrissjóður', formatPct(result.pensionShare)) : '',
    hasAdditional ? legendItem('additional', 'Séreign', formatPct(result.additionalPensionShare)) : '',
    hasUnion ? legendItem('union', 'Iðgjald stéttarfélags', formatPct(result.unionFeeShare)) : '',
    legendItem('total', 'Nettólaun, orlofsgreiðslur og sjóðir samtals', formatPct(totalShare)),
    comparisonDivider,
    comparisonResult
      ? legendItem('compare-net', `Nettólaun — ${comparisonLabel}`, formatPct(comparisonResult.netShare), 'bottom-graph__item--compare')
      : '',
    comparisonResult
      ? legendItem('compare-tax', `Staðgreiðsla — ${comparisonLabel}`, formatPct(comparisonResult.taxShare), 'bottom-graph__item--compare')
      : '',
  ].join('');
}
