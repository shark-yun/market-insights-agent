/* ═══ Stock Search, Modal & Comparison ═══ */

// ── Demo Stock Database ──
const stockDB = {
  tw: [
    { ticker:'2330', name:'台積電', sector:'半導體', price:985, change:15, pct:1.55, open:972, high:988, low:968, vol:'38,521張', pe:'28.3', foreign:12850, trust:3200, dealer:-890, discussions:[
      { channel:'財女珍妮', avatar:'珍', date:'2026-05-03', video:'台股站上兩萬三！半導體多頭行情還能延續嗎？', videoUrl:'https://www.youtube.com/@jennymarket', stance:'bull', stanceText:'看多', quote:'台積電法說會後展望正面，CoWoS 產能持續擴充，目標價上看 1050。' },
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！散熱模組成新焦點', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'台積電是 AI 軍備競賽最大受惠者，先進製程訂單能見度高，建議核心持有。' },
      { channel:'柴鼠兄弟', avatar:'柴', date:'2026-05-03', video:'美國降息時間表更新！對台股影響全面解析', videoUrl:'https://www.youtube.com/@chiratbros', stance:'bull', stanceText:'偏多', quote:'台積電作為權值龍頭，外資回流首選標的。' }
    ]},
    { ticker:'2317', name:'鴻海', sector:'電子代工', price:178.5, change:3.5, pct:2.0, open:175, high:180, low:174.5, vol:'85,230張', pe:'12.1', foreign:8920, trust:1560, dealer:340, discussions:[
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！散熱模組成新焦點', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'鴻海 GB200 伺服器代工訂單明確，下半年營收將顯著成長。' },
      { channel:'投資嗨嗨', avatar:'嗨', date:'2026-05-02', video:'鴻海轉型 AI 有成？最新法說重點整理', videoUrl:'https://www.youtube.com/@investhi', stance:'bull', stanceText:'偏多', quote:'鴻海電動車 + AI 伺服器雙引擎驅動，但需注意毛利率能否持續改善。' }
    ]},
    { ticker:'2454', name:'聯發科', sector:'IC設計', price:1285, change:-15, pct:-1.15, open:1300, high:1305, low:1278, vol:'12,100張', pe:'18.7', foreign:-3200, trust:890, dealer:-120, discussions:[
      { channel:'財女珍妮', avatar:'珍', date:'2026-05-03', video:'台股站上兩萬三！半導體多頭行情還能延續嗎？', videoUrl:'https://www.youtube.com/@jennymarket', stance:'neutral', stanceText:'中立', quote:'聯發科天璣 9400 拉貨狀況需觀察，短線整理後有機會再攻。' }
    ]},
    { ticker:'2603', name:'長榮', sector:'航運業', price:168, change:-4.5, pct:-2.61, open:173, high:174, low:167, vol:'45,600張', pe:'6.2', foreign:-5600, trust:-1200, dealer:-340, discussions:[
      { channel:'投資嗨嗨', avatar:'嗨', date:'2026-05-02', video:'航運股跌到何時？三大觀察指標告訴你', videoUrl:'https://www.youtube.com/@investhi', stance:'bear', stanceText:'偏空', quote:'長榮運價持續下滑，BDI 指數疲弱，短線建議觀望。' }
    ]},
    { ticker:'2881', name:'富邦金', sector:'金融保險', price:82.3, change:0.5, pct:0.61, open:82, high:82.8, low:81.5, vol:'22,340張', pe:'10.5', foreign:1200, trust:560, dealer:120, discussions:[
      { channel:'阿格力', avatar:'阿', date:'2026-05-01', video:'金融股存股策略 2026 更新版！', videoUrl:'https://www.youtube.com/@agreeliu', stance:'neutral', stanceText:'中立', quote:'富邦金殖利率約 4.5%，穩健型投資人可分批布局。' }
    ]},
    { ticker:'3661', name:'世芯-KY', sector:'IC設計', price:2680, change:85, pct:3.28, open:2600, high:2695, low:2590, vol:'4,230張', pe:'35.2', foreign:1890, trust:670, dealer:120, discussions:[] },
    { ticker:'6669', name:'緯穎', sector:'伺服器', price:1850, change:45, pct:2.49, open:1810, high:1865, low:1800, vol:'2,890張', pe:'22.1', foreign:920, trust:340, dealer:80, discussions:[
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'緯穎受惠雲端大廠資本支出增加，訂單能見度至 2027 年。' }
    ]},
  ],
  us: [
    { ticker:'AAPL', name:'Apple Inc.', sector:'Technology', price:189.84, change:2.15, pct:1.15, open:187.5, high:190.2, low:186.8, vol:'52.3M', pe:'29.8', foreign:null, trust:null, dealer:null, discussions:[
      { channel:'Graham Stephan', avatar:'GS', date:'2026-05-03', video:'The Fed Just Changed Everything', videoUrl:'https://www.youtube.com/@GrahamStephan', stance:'bull', stanceText:'Bullish', quote:'Apple\'s services revenue continues to grow. Strong buy on any dip below $185.' },
      { channel:'Meet Kevin', avatar:'MK', date:'2026-05-02', video:'AAPL Earnings Preview', videoUrl:'https://www.youtube.com/@MeetKevin', stance:'neutral', stanceText:'Neutral', quote:'iPhone sales may disappoint, but Vision Pro could be a wildcard catalyst.' }
    ]},
    { ticker:'NVDA', name:'NVIDIA Corp.', sector:'Technology', price:924.50, change:18.30, pct:2.02, open:908, high:928, low:905, vol:'38.1M', pe:'65.2', foreign:null, trust:null, dealer:null, discussions:[
      { channel:'Meet Kevin', avatar:'MK', date:'2026-05-02', video:'NVIDIA Earnings Preview: AI Bubble or Real Growth?', videoUrl:'https://www.youtube.com/@MeetKevin', stance:'bull', stanceText:'Bullish', quote:'Data center revenue will blow past estimates. Blackwell demand is insane. PT $1100.' },
      { channel:'Graham Stephan', avatar:'GS', date:'2026-05-03', video:'The Fed Just Changed Everything', videoUrl:'https://www.youtube.com/@GrahamStephan', stance:'bull', stanceText:'Bullish', quote:'NVIDIA is the pick-and-shovel play of the AI revolution. Core holding.' }
    ]},
    { ticker:'TSLA', name:'Tesla Inc.', sector:'Consumer', price:178.20, change:-3.80, pct:-2.09, open:182, high:183.5, low:177, vol:'88.5M', pe:'48.3', foreign:null, trust:null, dealer:null, discussions:[
      { channel:'Andrei Jikh', avatar:'AJ', date:'2026-05-01', video:'Is Tesla Overvalued?', videoUrl:'https://www.youtube.com/@AndreiJikh', stance:'bear', stanceText:'Bearish', quote:'Margins under pressure from price cuts. Robotaxi timeline remains uncertain.' }
    ]},
    { ticker:'MSFT', name:'Microsoft Corp.', sector:'Technology', price:420.50, change:5.20, pct:1.25, open:416, high:422, low:415, vol:'22.7M', pe:'35.1', foreign:null, trust:null, dealer:null, discussions:[
      { channel:'Graham Stephan', avatar:'GS', date:'2026-05-03', video:'The Fed Just Changed Everything', videoUrl:'https://www.youtube.com/@GrahamStephan', stance:'bull', stanceText:'Bullish', quote:'Azure cloud + Copilot AI integration makes MSFT a long-term compounder.' }
    ]},
    { ticker:'AMZN', name:'Amazon.com', sector:'Consumer', price:186.30, change:1.90, pct:1.03, open:184.5, high:187.1, low:183.8, vol:'31.2M', pe:'58.7', foreign:null, trust:null, dealer:null, discussions:[] },
  ],
  hk: [
    { ticker:'6088', name:'鴻騰精密 (FIT)', sector:'電子零組件', price:2.85, change:0.12, pct:4.39, open:2.75, high:2.88, low:2.72, vol:'12.5M', pe:'15.2', foreign:null, trust:null, dealer:null, discussions:[
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'除了母公司鴻海，旗下零組件廠如 FIT 也能吃到 GB200 水冷接頭商機，值得留意。' }
    ]}
  ]
};

// ── Search Logic ──
function setupSearch(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const sugBox = document.getElementById(suggestionsId);
  if (!input || !sugBox) return;

  // Flatten all stocks across markets into one searchable array
  const allStocks = Object.keys(stockDB).flatMap(market => 
    stockDB[market].map(s => ({ ...s, market }))
  );

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) { sugBox.classList.remove('show'); return; }
    
    const results = allStocks.filter(s =>
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
      const match = allStocks.find(s =>
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

function openStockModal(ticker, market) {
  const stock = stockDB[market].find(s => s.ticker === ticker);
  if (!stock) return;

  document.getElementById('modal-ticker').textContent = stock.ticker;
  document.getElementById('modal-name').textContent = stock.name;
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
  const data = [];
  let v = stock.price - stock.change;
  for (let i = 0; i < 80; i++) {
    v += (stock.change / 80) + (Math.random() - 0.5) * (stock.price * 0.003);
    data.push(v);
  }
  drawSparkline(canvas, data, isPos ? '#34d399' : '#f87171');

  // Metrics
  const metricsEl = document.getElementById('modal-metrics');
  const metrics = [
    { label: '開盤', value: stock.open },
    { label: '最高', value: stock.high },
    { label: '最低', value: stock.low },
    { label: '成交量', value: stock.vol },
    { label: '本益比', value: stock.pe },
    { label: '漲跌', value: (isPos ? '+' : '') + stock.change.toFixed(2), cls: isPos ? 'pos' : 'neg' },
  ];
  metricsEl.innerHTML = metrics.map(m =>
    `<div class="metric-item"><div class="metric-label">${m.label}</div><div class="metric-value ${m.cls || ''}">${m.value}</div></div>`
  ).join('');

  // Capital Flow
  const flowEl = document.getElementById('modal-flow');
  if (market === 'tw' && stock.foreign != null) {
    const flowData = [
      { label: '外資', amount: stock.foreign },
      { label: '投信', amount: stock.trust },
      { label: '自營', amount: stock.dealer },
    ];
    const maxAmt = Math.max(...flowData.map(f => Math.abs(f.amount)));
    flowEl.innerHTML = flowData.map(f => {
      const isBuy = f.amount >= 0;
      const pct = maxAmt > 0 ? (Math.abs(f.amount) / maxAmt) * 100 : 0;
      return `<div class="stock-flow-row">
        <div class="stock-flow-label">${f.label}</div>
        <div class="stock-flow-bar-track">
          <div class="stock-flow-bar ${isBuy ? 'buy' : 'sell'}" style="width:${pct}%">
            ${isBuy ? '+' : ''}${f.amount.toLocaleString()} 張
          </div>
        </div>
      </div>`;
    }).join('');
  } else {
    flowEl.innerHTML = '<div style="color:var(--text3);font-size:.8rem;padding:12px 0;">美股不提供三大法人資料</div>';
  }

  // Discussions
  const discEl = document.getElementById('modal-discussions');
  const noDiscEl = document.getElementById('modal-no-discussions');
  const countEl = document.getElementById('modal-discussion-count');
  if (stock.discussions.length > 0) {
    discEl.style.display = '';
    noDiscEl.style.display = 'none';
    countEl.textContent = `${stock.discussions.length} 則相關`;
    discEl.innerHTML = stock.discussions.map(d => {
      const stColor = d.stance === 'bull' ? 'background:rgba(52,211,153,.12);color:#34d399' :
        d.stance === 'bear' ? 'background:rgba(248,113,113,.12);color:#f87171' : 'background:rgba(251,191,36,.12);color:#fbbf24';
      return `<div class="disc-item">
        <div class="disc-header">
          <div class="disc-avatar">${d.avatar}</div>
          <div class="disc-name">${d.channel}</div>
          <div class="disc-time">${d.date}</div>
        </div>
        <a class="disc-video" href="${d.videoUrl}" target="_blank" rel="noopener">🎥 ${d.video}</a>
        <div class="disc-quote">${d.quote}</div>
        <div class="disc-stance" style="${stColor}">${d.stance === 'bull' ? '📈' : d.stance === 'bear' ? '📉' : '⚖️'} ${d.stanceText}</div>
      </div>`;
    }).join('');
  } else {
    discEl.style.display = 'none';
    noDiscEl.style.display = '';
    countEl.textContent = '0 則';
  }

  // Show compare and watchlist buttons
  updateCompareBtn(stock, market);
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
  const already = compareList.find(c => c.ticker === stock.ticker);
  btn.textContent = already ? '✓ 已加入比較' : '+ 加入比較';
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

  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:700;font-size:.9rem;">📊 股票比較</span>
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
        <button onclick="clearCompare()" style="background:var(--bg3);border:1px solid var(--glass-border);color:var(--text3);font-size:.7rem;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:inherit;">清除全部</button>
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
    
    let html = `<div style="margin-bottom:6px;color:rgba(255,255,255,.5);font-weight:600;font-size:0.65rem;text-transform:uppercase;">相對基準 (100)</div>`;
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
  const isFav = watchlist.includes(stock.ticker);
  btn.innerHTML = isFav ? '<span style="color:#fbbf24">★</span> 已追蹤' : '<span style="color:var(--text3)">☆</span> 加入自選';
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
