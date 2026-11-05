/* ═══ Stock Search, Modal & Comparison ═══ */

// ── Demo Stock Database ──
const stockDB = window.demoStockData;
window.applyUSStockSnapshots = function(rows) {
  stockDB.us = rows.filter(row => ['price','change','pct'].every(key=>Number.isFinite(row[key]))).map(row => ({...row, pe:'—', vol:Number.isFinite(row.volume) ? row.volume.toLocaleString()+' shares' : '—', discussions:[]}));
  window.renderWatchlist?.();
};

// ── Search Logic ──
function setupSearch(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const sugBox = document.getElementById(suggestionsId);
  if (!input || !sugBox) return;

  // Flatten all stocks across markets into one searchable array
  const allStocks = () => Object.keys(stockDB).flatMap(market => stockDB[market].map(s => ({ ...s, market })));

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) { sugBox.classList.remove('show'); return; }
    
    const results = allStocks().filter(s =>
      s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 6);
    
    if (results.length === 0) { sugBox.classList.remove('show'); return; }
    
    sugBox.innerHTML = results.map(s => `
      <div class="suggestion-item" data-ticker="${s.ticker}" data-market="${s.market}">
        <span class="suggestion-ticker">${s.ticker} <span style="font-size:0.65rem;color:var(--text3);font-weight:400;border:1px solid var(--glass-border);padding:1px 4px;border-radius:4px;">${s.market.toUpperCase()}</span></span>
        <span class="suggestion-name">${s.name}</span>
        <span class="suggestion-sector">${s.sector}</span>
      </div>`).join('');
    sugBox.classList.add('show');
    
    sugBox.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        openStockModal(el.dataset.ticker, el.dataset.market);
        sugBox.classList.remove('show');
        input.value = '';
      });
    });
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim().toLowerCase();
      const match = allStocks().find(s =>
        s.ticker.toLowerCase() === q || s.name.toLowerCase().includes(q)
      );
      if (match) { openStockModal(match.ticker, match.market); sugBox.classList.remove('show'); input.value = ''; }
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.stock-search-wrap')) sugBox.classList.remove('show');
  });
}

setupSearch('tw-stock-search', 'tw-search-suggestions');
setupSearch('us-stock-search', 'us-search-suggestions');

// ── Stock Modal ──
const overlay = document.getElementById('stock-modal-overlay');
const modalClose = document.getElementById('modal-close');

const getLang = () => localStorage.getItem('lang') || 'zh';

function openStockModal(ticker, market) {
  const stock = stockDB[market].find(s => s.ticker === ticker);
  if (!stock) return;

  const isEn = getLang() === 'en';
  document.getElementById('modal-ticker').textContent = stock.ticker;
  document.getElementById('modal-name').textContent = stock.name + (market === 'us' ? ` · ${stock.marketDate} USD` : (isEn ? ' · DEMO' : ' · 示範資料'));
  const marketLabels = { tw: 'TWSE', us: 'US', hk: 'HKEX' };
  document.getElementById('modal-market').textContent = marketLabels[market] || market.toUpperCase();

  document.getElementById('modal-price').textContent = stock.price.toLocaleString();
  const changeEl = document.getElementById('modal-change');
  const isPos = stock.change >= 0;
  changeEl.textContent = `${isPos ? '▲' : '▼'} ${Math.abs(stock.change).toFixed(2)} (${isPos ? '+' : ''}${stock.pct.toFixed(2)}%)`;
  changeEl.className = `stock-change ${isPos ? 'positive' : 'negative'}`;

  // Chart
  const canvas = document.getElementById('modal-chart');
  const w = 700, h = 180;
  canvas.width = w; canvas.height = h;
  canvas.style.width = '100%'; canvas.style.height = '180px';
  const data = market === 'us' ? stock.sparkline : [];
  if (market !== 'us') {
    let v = stock.price - stock.change;
    for (let i = 0; i < 80; i++) { v += stock.change / 80 + (Math.random() - .5) * stock.price * .003; data.push(v); }
  }
  drawSparkline(canvas, data, isPos ? '#34d399' : '#f87171');

  // Metrics
  const metricsEl = document.getElementById('modal-metrics');
  const metrics = [
    { label: isEn ? 'Open' : '開盤', value: stock.open },
    { label: isEn ? 'High' : '最高', value: stock.high },
    { label: isEn ? 'Low' : '最低', value: stock.low },
    { label: isEn ? 'Volume' : '成交量', value: stock.vol },
    { label: isEn ? 'P/E Ratio' : '本益比', value: stock.pe },
    { label: isEn ? 'Change' : '漲跌', value: (isPos ? '+' : '') + stock.change.toFixed(2), cls: isPos ? 'pos' : 'neg' },
  ];
  metricsEl.innerHTML = metrics.map(m =>
    `<div class="metric-item"><div class="metric-label">${m.label}</div><div class="metric-value ${m.cls || ''}">${m.value}</div></div>`
  ).join('');

  // Capital Flow
  const flowEl = document.getElementById('modal-flow');
  if (market === 'tw' && stock.foreign != null) {
    const flowData = [
      { label: isEn ? 'Foreign' : '外資', amount: stock.foreign },
      { label: isEn ? 'Mutual Fund' : '投信', amount: stock.trust },
      { label: isEn ? 'Dealer' : '自營', amount: stock.dealer },
    ];
    const maxAmt = Math.max(...flowData.map(f => Math.abs(f.amount)));
    flowEl.innerHTML = flowData.map(f => {
      const isBuy = f.amount >= 0;
      const pct = maxAmt > 0 ? (Math.abs(f.amount) / maxAmt) * 100 : 0;
      return `<div class="stock-flow-row">
        <div class="stock-flow-label">${f.label}</div>
        <div class="stock-flow-bar-track">
          <div class="stock-flow-bar ${isBuy ? 'buy' : 'sell'}" style="width:${pct}%">
            ${isBuy ? '+' : ''}${f.amount.toLocaleString()} ${isEn ? 'Lots' : '張'}
          </div>
        </div>
      </div>`;
    }).join('');
  } else {
    flowEl.innerHTML = `<div style="color:var(--text3);font-size:.8rem;padding:12px 0;">${isEn ? 'US stocks do not provide institutional flows' : '美股不提供三大法人資料'}</div>`;
  }

  // Discussions
  const discEl = document.getElementById('modal-discussions');
  const noDiscEl = document.getElementById('modal-no-discussions');
  const countEl = document.getElementById('modal-discussion-count');
  if (stock.discussions.length > 0) {
    discEl.style.display = '';
    noDiscEl.style.display = 'none';
    countEl.textContent = isEn ? `${stock.discussions.length} Discussions` : `${stock.discussions.length} 則相關`;
    discEl.innerHTML = stock.discussions.map(d => {
      const stColor = d.stance === 'bull' ? 'background:rgba(52,211,153,.12);color:#34d399' :
        d.stance === 'bear' ? 'background:rgba(248,113,113,.12);color:#f87171' : 'background:rgba(251,191,36,.12);color:#fbbf24';
      const displayStanceText = isEn ? (d.stance === 'bull' ? 'Bullish' : d.stance === 'bear' ? 'Bearish' : 'Neutral') : d.stanceText;
      return `<div class="disc-item">
        <div class="disc-header">
          <div class="disc-avatar">${d.avatar}</div>
          <div class="disc-name">${d.channel}</div>
          <div class="disc-time">${d.date}</div>
        </div>
        <a class="disc-video" href="${d.videoUrl}" target="_blank" rel="noopener">🎥 ${d.video}</a>
        <div class="disc-quote">${d.quote}</div>
        <div class="disc-stance" style="${stColor}">${d.stance === 'bull' ? '📈' : d.stance === 'bear' ? '📉' : '⚖️'} ${displayStanceText}</div>
      </div>`;
    }).join('');
  } else {
    discEl.style.display = 'none';
    noDiscEl.style.display = '';
    countEl.textContent = isEn ? '0 discussions' : '0 則';
    
    const noDiscTextEl = noDiscEl.querySelector('.no-disc-text');
    if (noDiscTextEl) {
      noDiscTextEl.textContent = isEn ? 'No discussion found for this stock in tracked channels' : '目前追蹤的頻道尚無討論此個股';
    }
  }

  // Show compare and watchlist buttons
  if (market !== 'us') updateCompareBtn(stock, market);
  const compareBtn = document.getElementById('modal-compare-btn');
  if (compareBtn) compareBtn.style.display = market === 'us' ? 'none' : '';
  updateWatchlistBtn(stock);

  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}


function closeModal() {
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}
modalClose?.addEventListener('click', closeModal);
overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Compare Feature ──
let compareList = []; // { ticker, name, market, data[], color }
const compareColors = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#22d3ee'];

function updateCompareBtn(stock, market) {
  // Add a "compare" button to modal header area
  let btn = document.getElementById('modal-compare-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'modal-compare-btn';
    btn.style.cssText = 'background:var(--blue);color:#fff;border:none;padding:6px 16px;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;margin-left:12px;transition:all .2s;';
    document.querySelector('.stock-id-wrap')?.appendChild(btn);
  }
  const isEn = getLang() === 'en';
  const already = compareList.find(c => c.ticker === stock.ticker);
  btn.textContent = already ? (isEn ? '✓ Compared' : '✓ 已加入比較') : (isEn ? '+ Compare' : '+ 加入比較');
  btn.style.background = already ? 'var(--green)' : 'var(--blue)';
  btn.onclick = () => {
    if (already) {
      compareList = compareList.filter(c => c.ticker !== stock.ticker);
    } else if (compareList.length < 6) {
      compareList.push({ ticker: stock.ticker, name: stock.name, market, color: compareColors[compareList.length], basePct: stock.pct });
    }
    updateCompareBtn(stock, market);
    regenerateCompareData();
    renderComparePanel();
  };
}

let comparePeriod = 'YTD';
function regenerateCompareData() {
  const points = comparePeriod === '1M' ? 20 : comparePeriod === '3M' ? 60 : comparePeriod === 'YTD' ? 80 : 250;
  compareList.forEach(c => {
    const data = [];
    let v = 100;
    for (let i = 0; i < points; i++) {
      v += (c.basePct / points) + (Math.random() - 0.5) * 0.8;
      data.push(v);
    }
    c.data = data;
  });
}

function renderComparePanel() {
  let panel = document.getElementById('compare-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'compare-panel';
    panel.className = 'glass-card';
    panel.style.cssText = 'position:fixed;bottom:36px;left:50%;transform:translateX(-50%);z-index:150;width:90%;max-width:900px;padding:16px 20px;display:none;';
    document.body.appendChild(panel);
  }

  if (compareList.length === 0) {
    panel.style.display = 'none';
    return;
  }

  const isEn = getLang() === 'en';
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:700;font-size:.9rem;">${isEn ? '📊 Stock Comparison' : '📊 股票比較'}</span>
        <div style="display:flex;gap:4px;margin-left:8px;" id="compare-period-tabs">
          ${['1M', '3M', 'YTD', '1Y'].map(p => `
            <button onclick="setComparePeriod('${p}')" style="background:${comparePeriod === p ? 'rgba(96,165,250,.15)' : 'var(--bg)'};color:${comparePeriod === p ? 'var(--blue)' : 'var(--text3)'};border:1px solid ${comparePeriod === p ? 'var(--blue)' : 'var(--glass-border)'};border-radius:4px;font-size:.7rem;padding:2px 8px;cursor:pointer;">${p}</button>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        ${compareList.map(c => `
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:.75rem;padding:3px 10px;border-radius:12px;background:${c.color}20;color:${c.color};font-weight:600;cursor:pointer;" onclick="removeCompare('${c.ticker}')">${c.ticker} ✕</span>
        `).join('')}
        <button onclick="clearCompare()" style="background:var(--bg3);border:1px solid var(--glass-border);color:var(--text3);font-size:.7rem;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:inherit;">${isEn ? 'Clear All' : '清除全部'}</button>
      </div>
    </div>
    <div style="position:relative;width:100%;height:200px;">
      <canvas id="compare-canvas" width="860" height="200" style="cursor:crosshair;position:absolute;left:0;top:0;width:100%;height:100%;"></canvas>
      <div id="compare-crosshair" style="position:absolute;pointer-events:none;display:none;width:1px;background:rgba(148,163,184,.5);top:0;bottom:0;z-index:5;"></div>
      <div id="compare-tooltip" style="position:absolute;pointer-events:none;display:none;background:rgba(15,23,42,.85);border:1px solid rgba(255,255,255,.1);padding:10px 14px;border-radius:8px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);font-size:0.75rem;z-index:10;color:#fff;backdrop-filter:blur(8px);min-width:140px;white-space:nowrap;"></div>
    </div>
    <div id="compare-legend" style="display:flex;gap:16px;margin-top:12px;flex-wrap:wrap;"></div>
  `;

  drawCompareChart();
}

function drawCompareChart() {
  const canvas = document.getElementById('compare-canvas');
  if (!canvas || compareList.length === 0) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = 860, h = 200;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = '100%'; canvas.style.height = '200px';
  ctx.scale(dpr, dpr);

  // Find global min/max across all series
  let allVals = [];
  compareList.forEach(c => allVals.push(...c.data));
  const gMin = Math.min(...allVals), gMax = Math.max(...allVals);
  const range = gMax - gMin || 1;

  // Grid lines
  ctx.strokeStyle = 'rgba(148,163,184,.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw 100 baseline
  const baseY = h - ((100 - gMin) / range) * h * 0.85 - h * 0.075;
  ctx.strokeStyle = 'rgba(148,163,184,.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(w, baseY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(148,163,184,.4)';
  ctx.font = '10px Inter';
  ctx.fillText('100', 4, baseY - 4);

  // Draw each series
  compareList.forEach(c => {
    const step = w / (c.data.length - 1);
    ctx.beginPath();
    c.data.forEach((v, i) => {
      const x = i * step;
      const y = h - ((v - gMin) / range) * h * 0.85 - h * 0.075;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // End label
    const lastY = h - ((c.data[c.data.length - 1] - gMin) / range) * h * 0.85 - h * 0.075;
    ctx.fillStyle = c.color;
    ctx.font = 'bold 11px Inter';
    ctx.fillText(c.ticker, w - ctx.measureText(c.ticker).width - 4, lastY - 6);
  });

  // Y-axis min/max labels
  ctx.fillStyle = 'rgba(148,163,184,.6)';
  ctx.font = '10px Inter';
  ctx.fillText(gMax.toFixed(1), 4, 12);
  ctx.fillText(gMin.toFixed(1), 4, h - 4);
  ctx.fillText(((gMax+gMin)/2).toFixed(1), 4, h/2 + 4);

  // Hover Interaction
  const tooltip = document.getElementById('compare-tooltip');
  const crosshair = document.getElementById('compare-crosshair');
  const isEn = getLang() === 'en';
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dataLen = compareList[0].data.length;
    const step = rect.width / (dataLen - 1);
    let index = Math.round(x / step);
    if (index < 0) index = 0;
    if (index >= dataLen) index = dataLen - 1;
    
    const snappedX = index * step;
    
    crosshair.style.display = 'block';
    crosshair.style.left = snappedX + 'px';
    
    tooltip.style.display = 'block';
    let tooltipX = snappedX + 15;
    if (tooltipX + 160 > rect.width) tooltipX = snappedX - 160;
    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = Math.max(10, y - 40) + 'px';
    
    let html = `<div style="margin-bottom:6px;color:rgba(255,255,255,.5);font-weight:600;font-size:0.65rem;text-transform:uppercase;">${isEn ? 'Relative Baseline (100)' : '相對基準 (100)'}</div>`;
    compareList.forEach(c => {
      const val = c.data[index];
      const chg = ((val - 100) / 100 * 100).toFixed(2);
      const isPos = val >= 100;
      html += `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${c.color};"></span>
        <span style="font-weight:600;min-width:45px;">${c.ticker}</span>
        <span style="color:${isPos ? '#34d399' : '#f87171'};font-variant-numeric: tabular-nums;">${val.toFixed(1)} (${isPos?'+':''}${chg}%)</span>
      </div>`;
    });
    tooltip.innerHTML = html;
  });
  
  canvas.addEventListener('mouseleave', () => {
    crosshair.style.display = 'none';
    tooltip.style.display = 'none';
  });

  // Legend
  const legend = document.getElementById('compare-legend');
  if (legend) {
    legend.innerHTML = compareList.map(c => {
      const lastVal = c.data[c.data.length - 1];
      const chg = ((lastVal - 100) / 100 * 100).toFixed(2);
      const isPos = lastVal >= 100;
      return `<div style="display:flex;align-items:center;gap:6px;font-size:.78rem;">
        <span style="width:12px;height:3px;border-radius:2px;background:${c.color};"></span>
        <span style="font-weight:600;">${c.ticker}</span>
        <span style="color:var(--text3);">${c.name}</span>
        <span style="color:${isPos ? 'var(--green)' : 'var(--red)'};font-weight:600;">${isPos ? '+' : ''}${chg}% <span style="font-size:0.65rem;color:var(--text3)">(${comparePeriod})</span></span>
      </div>`;
    }).join('');
  }
}


// Global functions for inline onclick
window.removeCompare = function(ticker) {
  compareList = compareList.filter(c => c.ticker !== ticker);
  renderComparePanel();
};

window.clearCompare = function() {
  compareList = [];
  renderComparePanel();
};

window.setComparePeriod = function(period) {
  comparePeriod = period;
  regenerateCompareData();
  renderComparePanel();
};

// ── Watchlist (Favorites) Feature ──
let watchlist = JSON.parse(localStorage.getItem('market-insights-watchlist') || '[]');

function updateWatchlistBtn(stock) {
  let btn = document.getElementById('modal-fav-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'modal-fav-btn';
    btn.style.cssText = 'background:transparent;border:1px solid var(--glass-border);color:var(--text);padding:6px 12px;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;font-family:inherit;margin-left:8px;transition:all .2s;display:inline-flex;align-items:center;gap:4px;';
    document.querySelector('.stock-id-wrap')?.appendChild(btn);
  }
  const isEn = getLang() === 'en';
  const isFav = watchlist.includes(stock.ticker);
  btn.innerHTML = isFav ? `<span style="color:#fbbf24">★</span> ${isEn ? 'Tracked' : '已追蹤'}` : `<span style="color:var(--text3)">☆</span> ${isEn ? 'Watch' : '加入自選'}`;
  btn.style.borderColor = isFav ? '#fbbf24' : 'var(--glass-border)';
  btn.onclick = () => {
    if (isFav) {
      watchlist = watchlist.filter(t => t !== stock.ticker);
    } else {
      watchlist.push(stock.ticker);
    }
    localStorage.setItem('market-insights-watchlist', JSON.stringify(watchlist));
    updateWatchlistBtn(stock);
    renderWatchlist();
  };
}


window.renderWatchlist = function() {
  const section = document.getElementById('watchlist-section');
  const grid = document.getElementById('watchlist-grid');
  if (!section || !grid) return;
  
  if (watchlist.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  // Get stock details for each ticker in watchlist from stockDB
  const allStocks = Object.keys(stockDB).flatMap(m => stockDB[m].map(s => ({...s, market: m})));
  
  grid.innerHTML = watchlist.map(ticker => {
    const s = allStocks.find(x => x.ticker === ticker);
    if (!s) return '';
    const isPos = s.change >= 0;
    return `
      <div class="glass-card" style="min-width:160px; padding:12px 16px; cursor:pointer; flex-shrink:0; transition:transform 0.2s, background 0.2s;" onclick="openStockModal('${s.ticker}', '${s.market}')" onmouseover="this.style.transform='translateY(-2px)';this.style.background='var(--bg3)'" onmouseout="this.style.transform='none';this.style.background='var(--glass-bg)'">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:700; font-size:.9rem;">${s.ticker}</span>
          <span style="font-size:.65rem; color:var(--text3); border:1px solid var(--glass-border); border-radius:4px; padding:1px 4px;">${s.market.toUpperCase()}</span>
        </div>
        <div style="font-size:.75rem; color:var(--text3); margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</div>
        <div style="display:flex; align-items:baseline; gap:6px;">
          <span style="font-size:1.1rem; font-weight:700;">${s.price}</span>
          <span style="font-size:.75rem; font-weight:600; color:${isPos ? 'var(--green)' : 'var(--red)'}">${isPos?'+':''}${s.pct}%</span>
        </div>
      </div>
    `;
  }).join('');
};

// Initialize Watchlist on load
document.addEventListener('DOMContentLoaded', renderWatchlist);

// Handle a cached report resolving before this script finishes loading.
if (typeof loadedData !== 'undefined') {
  window.applyUSStockSnapshots(loadedData?.usMarket?.stocks || []);
}
