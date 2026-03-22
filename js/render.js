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
    {
      key:   'union',
      label: 'Iðgjald stéttarfélags',
      share: result.unionFeeShare,
      color: cssVar('--color-union'),
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
    <div class="viz-label viz-label--${seg.key}">
      <i class="viz-label__swatch" aria-hidden="true"></i>
      <span class="viz-label__name">${seg.label}</span>
      <span class="viz-label__value">${formatPct(seg.share)}</span>
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
  if (result.spouseAllowanceUsed > 0) {
    html += row('Persónuafsláttur maka', -result.spouseAllowanceUsed);
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

  /* ── Group: Aðrar greiðslur ── */
  if (result.unionFeeAmount > 0) {
    html += `<div class="breakdown__group">`;
    html += groupHeader('Aðrar greiðslur');
    html += row('Iðgjald stéttarfélags', -result.unionFeeAmount);
    html += `</div>`;
  }

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
 * Render the bottom XY line chart.
 * X axis: gross salary 0–5M kr. Y axis: share of gross 0–100%.
 * Net% line falls and tax% line rises as gross increases — the key story.
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
  const ML = 44, MR = 12, MT = 12, MB = 26;
  const CW = W - ML - MR;
  const CH = H - MT - MB;
  const MAX = 5_000_000;

  /* X = gross salary (kr), Y = share of gross (0–1, inverted for SVG) */
  const toX = (gross) => ML + (gross / MAX) * CW;
  const toY = (share) => MT + CH - Math.max(share, 0) * CH;

  /* ── Colors ──────────────────────────────────── */
  const colorNet        = cssVar('--color-gross');
  const colorTax        = cssVar('--color-tax');
  const colorPension    = cssVar('--color-social');
  const colorAdditional = cssVar('--color-deduction');
  const colorUnion      = cssVar('--color-union');
  const colorTotal      = cssVar('--color-text-muted');
  const colorRule       = cssVar('--color-rule');
  const colorMuted      = cssVar('--color-text-muted');
  const colorAccent     = cssVar('--color-accent');

  const hasPension    = result.pensionFundAmount > 0;
  const hasAdditional = result.additionalPensionAmount > 0;
  const hasUnion      = result.unionFeeAmount > 0;

  const totalShare = result.netShare + result.pensionShare + result.additionalPensionShare + result.unionFeeShare;

  /* ── Y axis: 0–100% share of gross ──────────── */
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const yGrid  = yTicks.map((pct) => {
    const y     = toY(pct);
    const label = `${Math.round(pct * 100)}%`;
    const dash  = pct === 0 ? '' : ' stroke-dasharray="3,3"';
    return `<line x1="${ML}" y1="${y}" x2="${ML + CW}" y2="${y}" stroke="${colorRule}" stroke-width="0.5"${dash}/>
      <text x="${ML - 5}" y="${y}" text-anchor="end" dominant-baseline="middle" font-size="9" font-family="Inter,sans-serif" fill="${colorMuted}">${label}</text>`;
  }).join('\n      ');

  /* ── X axis: gross salary 0–5M kr ───────────── */
  const xTicks = [0, 1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000];
  const xGrid  = xTicks.map((v) => {
    const x     = toX(v);
    const label = v === 0 ? '0' : `${v / 1_000_000}M`;
    const dash  = v === 0 ? '' : ' stroke-dasharray="3,3"';
    return `<line x1="${x}" y1="${MT}" x2="${x}" y2="${MT + CH}" stroke="${colorRule}" stroke-width="0.5"${dash}/>
      <text x="${x}" y="${MT + CH + 14}" text-anchor="middle" font-size="9" font-family="Inter,sans-serif" fill="${colorMuted}">${label}</text>`;
  }).join('\n      ');

  /* ── Polyline helpers ────────────────────────── */
  const pts = (getter) => curve.map((p) => {
    const share = p.gross > 0 ? getter(p) / p.gross : 0;
    return `${toX(p.gross).toFixed(1)},${toY(share).toFixed(1)}`;
  }).join(' ');

  const netPoints        = pts((p) => p.net);
  const taxPoints        = pts((p) => p.tax);
  const pensionPoints    = pts((p) => p.pension);
  const additionalPoints = pts((p) => p.additionalPension);
  const unionPoints      = pts((p) => p.unionFee);
  const totalPoints      = pts((p) => p.net + p.pension + p.additionalPension + p.unionFee);

  /* ── Current salary marker (vertical rule) ───── */
  const mx = toX(result.grossSalary).toFixed(1);

  const dot = (share, color) =>
    `<circle cx="${mx}" cy="${toY(share).toFixed(1)}" r="3" fill="${color}"/>`;

  const marker = `
      <line x1="${mx}" y1="${MT}" x2="${mx}" y2="${MT + CH}" stroke="${colorAccent}" stroke-width="1" stroke-dasharray="4,3"/>
      ${dot(result.netShare, colorNet)}
      ${dot(result.taxShare, colorTax)}
      ${hasPension    ? dot(result.pensionShare, colorPension)             : ''}
      ${hasAdditional ? dot(result.additionalPensionShare, colorAdditional) : ''}
      ${hasUnion      ? dot(result.unionFeeShare, colorUnion)              : ''}
      ${dot(totalShare, colorTotal)}`;

  /* ── Assemble SVG ────────────────────────────── */
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
      ${hasPension    ? `<polyline points="${pensionPoints}"    fill="none" stroke="${colorPension}"    stroke-width="1.5" stroke-linejoin="round"/>` : ''}
      ${hasAdditional ? `<polyline points="${additionalPoints}" fill="none" stroke="${colorAdditional}" stroke-width="1.5" stroke-linejoin="round"/>` : ''}
      ${hasUnion      ? `<polyline points="${unionPoints}"      fill="none" stroke="${colorUnion}"      stroke-width="1.5" stroke-linejoin="round"/>` : ''}
      <polyline points="${taxPoints}"   fill="none" stroke="${colorTax}"   stroke-width="1.5" stroke-linejoin="round"/>
      <polyline points="${netPoints}"   fill="none" stroke="${colorNet}"   stroke-width="1.5" stroke-linejoin="round"/>
      <polyline points="${totalPoints}" fill="none" stroke="${colorTotal}" stroke-width="1"   stroke-linejoin="round" stroke-dasharray="5,3"/>
      ${marker}
    </svg>`;

  /* ── Legend ──────────────────────────────────── */
  const legendItem = (color, label, value) => `
    <div class="bottom-graph__item">
      <i class="bottom-graph__swatch" style="background:${color}" aria-hidden="true"></i>
      <span class="bottom-graph__label">${label}</span>
      <span class="bottom-graph__value">${value}</span>
    </div>`;

  legendEl.innerHTML = [
    legendItem(colorNet,   'Nettólaun',              formatPct(result.netShare)),
    legendItem(colorTax,   'Staðgreiðsla',           formatPct(result.taxShare)),
    hasPension    ? legendItem(colorPension,    'Lífeyrissjóður',        formatPct(result.pensionShare))           : '',
    hasAdditional ? legendItem(colorAdditional, 'Séreign',               formatPct(result.additionalPensionShare)) : '',
    hasUnion      ? legendItem(colorUnion,      'Iðgjald stéttarfélags', formatPct(result.unionFeeShare))          : '',
    legendItem(colorTotal, 'Nettólaun og sjóðir samtals', formatPct(totalShare)),
  ].join('');
}
