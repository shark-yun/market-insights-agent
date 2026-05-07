/* ═══════════════════════════════════════════
   Market Insights Dashboard — app.js
   ═══════════════════════════════════════════ */

// ── Tab Navigation ──
const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.tab-panel');
const indicator = document.getElementById('tab-indicator');

function setTab(tabId) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tabId}`));
  updateIndicator();
}

function updateIndicator() {
  const active = document.querySelector('.tab-btn.active');
  if (!active || !indicator) return;
  indicator.style.width = active.offsetWidth + 'px';
  indicator.style.left = active.offsetLeft + 'px';
}

tabs.forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
window.addEventListener('resize', updateIndicator);
requestAnimationFrame(updateIndicator);

// ── Clock ──
function updateClock() {
  const now = new Date();
  document.getElementById('clock-time').textContent =
    now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('last-update').textContent =
    now.toLocaleDateString('zh-TW') + ' ' + now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

const sparkTooltip = document.createElement('div');
sparkTooltip.style.cssText = 'position:fixed;pointer-events:none;display:none;background:rgba(15,23,42,.85);border:1px solid rgba(255,255,255,.1);padding:4px 8px;border-radius:4px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.5);font-size:0.75rem;z-index:9999;color:#fff;backdrop-filter:blur(8px);font-weight:600;white-space:nowrap;';
document.body.appendChild(sparkTooltip);

// ── Mini Sparkline Drawing ──
function drawSparkline(canvas, data, color) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const step = w / (data.length - 1);
  // gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '00');
  ctx.beginPath();
  ctx.moveTo(0, h);
  data.forEach((v, i) => {
    const x = i * step, y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
    i === 0 ? ctx.lineTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  // line
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step, y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Save base image for hover restoration
  const baseImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  canvas.style.cursor = 'crosshair';
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const hoverStep = rect.width / (data.length - 1);
    let index = Math.round(x / hoverStep);
    if (index < 0) index = 0;
    if (index >= data.length) index = data.length - 1;
    
    // Restore base image
    ctx.putImageData(baseImage, 0, 0);
    
    const snapX = index * (w / (data.length - 1));
    const snapY = h - ((data[index] - min) / range) * h * 0.8 - h * 0.1;
    
    // Draw crosshair
    ctx.beginPath();
    ctx.moveTo(snapX, 0);
    ctx.lineTo(snapX, h);
    ctx.strokeStyle = 'rgba(148,163,184,.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw dot
    ctx.beginPath();
    ctx.arc(snapX, snapY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Show tooltip
    sparkTooltip.style.display = 'block';
    sparkTooltip.textContent = data[index].toFixed(2);
    sparkTooltip.style.left = (e.clientX + 15) + 'px';
    sparkTooltip.style.top = (e.clientY - 25) + 'px';
  });
  
  canvas.addEventListener('mouseleave', () => {
    ctx.putImageData(baseImage, 0, 0);
    sparkTooltip.style.display = 'none';
  });
}

// ── Market Indices Rendering ──
function renderMarketIndices(indices) {
  if (!indices) return;

  // 1. Taiwan TAIEX (Main Banner)
  const tw = indices.TWII;
  if (tw) {
    const priceEl = document.getElementById('tw-index-price');
    const changeEl = document.getElementById('tw-index-change');
    if (priceEl) priceEl.textContent = tw.price.toLocaleString();
    if (changeEl) {
      const isPos = tw.change >= 0;
      changeEl.className = `index-change ${isPos ? 'positive' : 'negative'}`;
      changeEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="${isPos ? 'M12 4l-8 8h5v8h6v-8h5z' : 'M12 20l8-8h-5v-8h-6v8h-5z'}"/>
        </svg>
        <span>${isPos ? '+' : ''}${tw.change.toFixed(2)} (${isPos ? '+' : ''}${tw.pct.toFixed(2)}%)</span>
      `;
    }
    const canvas = document.getElementById('tw-index-chart');
    if (canvas && tw.sparkline) drawSparkline(canvas, tw.sparkline, '#60a5fa');
  }

  // 2. US Indices Cards
  const usMap = {
    'GSPC': 'us-sp500',
    'IXIC': 'us-nasdaq',
    'DJI':  'us-dow',
    'VIX':  'us-vix'
  };

  for (const [sym, id] of Object.entries(usMap)) {
    const data = indices[sym];
    const card = document.getElementById(id);
    if (!data || !card) continue;

    const pEl = card.querySelector('.idx-price');
    const cEl = card.querySelector('.idx-change');
    const canvas = card.querySelector('.idx-spark');

    if (pEl) pEl.textContent = data.price.toLocaleString();
    if (cEl) {
      const isPos = data.change >= 0;
      // VIX usually uses inverted colors (green for down, red for up) but let's stick to standard for now
      cEl.className = `idx-change ${isPos ? 'positive' : 'negative'}`;
      cEl.textContent = `${isPos ? '+' : ''}${data.pct.toFixed(2)}%`;
    }
    if (canvas && data.sparkline) {
      const color = data.change >= 0 ? '#34d399' : '#f87171';
      drawSparkline(canvas, data.sparkline, color);
    }
  }
}

// ── Initial Demo Charts (Will be overwritten if report.json loads) ──
function drawDemoCharts() {
  // TW
  const twCanvas = document.getElementById('tw-index-chart');
  if (twCanvas) {
    const data = []; let v = 23300;
    for (let i = 0; i < 60; i++) { v += (Math.random() - 0.45) * 30; data.push(v); }
    drawSparkline(twCanvas, data, '#60a5fa');
  }
  // US
  document.querySelectorAll('.index-card').forEach(card => {
    const canvas = card.querySelector('.idx-spark');
    if (!canvas) return;
    const isNeg = card.querySelector('.idx-change')?.classList.contains('negative');
    const color = isNeg ? '#f87171' : '#34d399';
    const data = []; let v = 100;
    for (let i = 0; i < 40; i++) { v += (Math.random() - (isNeg ? 0.55 : 0.45)) * 3; data.push(v); }
    drawSparkline(canvas, data, color);
  });
}
drawDemoCharts();

// ═══ Demo Data Rendering ═══

// ── TW Heatmap ──
const twSectors = [
  { name: '半導體', pct: 2.15, weight: 3 },
  { name: '金融保險', pct: -0.42, weight: 2 },
  { name: '電子零件', pct: 1.87, weight: 2 },
  { name: '光電業', pct: 0.63, weight: 1 },
  { name: '航運業', pct: -1.23, weight: 1.5 },
  { name: '生技醫療', pct: 3.21, weight: 1.2 },
  { name: '鋼鐵工業', pct: -0.18, weight: 1 },
  { name: '通信網路', pct: 0.92, weight: 1.3 },
  { name: '電機機械', pct: 1.45, weight: 1 },
  { name: '食品工業', pct: -0.67, weight: 0.8 },
  { name: '塑膠工業', pct: 0.33, weight: 0.8 },
  { name: '紡織纖維', pct: -2.10, weight: 0.7 },
  { name: '汽車工業', pct: 1.05, weight: 0.9 },
  { name: '建材營造', pct: 0.15, weight: 0.8 },
  { name: '觀光餐旅', pct: -0.55, weight: 0.6 },
  { name: '電器電纜', pct: 0.78, weight: 0.7 },
];

function getHeatColor(pct) {
  if (pct >= 3) return '#16a34a';
  if (pct >= 1.5) return '#22c55e';
  if (pct >= 0.5) return '#4ade80';
  if (pct >= 0) return '#86efac';
  if (pct >= -0.5) return '#fca5a5';
  if (pct >= -1.5) return '#f87171';
  if (pct >= -3) return '#ef4444';
  return '#dc2626';
}

const hmContainer = document.getElementById('tw-heatmap');
twSectors.forEach(s => {
  const cell = document.createElement('div');
  cell.className = 'hm-cell';
  cell.style.background = getHeatColor(s.pct);
  cell.style.gridColumn = `span ${Math.round(s.weight)}`;
  cell.style.color = Math.abs(s.pct) > 1.5 ? '#fff' : '#1e293b';
  cell.innerHTML = `<div class="hm-name">${s.name}</div><div class="hm-val">${s.pct > 0 ? '+' : ''}${s.pct.toFixed(2)}%</div>`;
  hmContainer.appendChild(cell);
});

// ── Capital Flow ──
const flows = [
  { label: '外資', amount: 182.5, buy: true },
  { label: '投信', amount: 45.3, buy: true },
  { label: '自營商', amount: -23.8, buy: false },
];
const flowBars = document.getElementById('tw-flow-bars');
const maxFlow = Math.max(...flows.map(f => Math.abs(f.amount)));
flows.forEach(f => {
  const isBuy = f.amount > 0;
  const pct = (Math.abs(f.amount) / maxFlow) * 100;
  const row = document.createElement('div');
  row.className = 'flow-row';
  row.innerHTML = `
    <div class="flow-label">${f.label}</div>
    <div class="flow-bar-track">
      <div class="flow-bar-fill ${isBuy ? 'buy' : 'sell'}" style="width:${pct}%">
        ${isBuy ? '買超' : '賣超'} ${Math.abs(f.amount).toFixed(1)} 億
      </div>
    </div>`;
  flowBars.appendChild(row);
});

const flowSummary = document.getElementById('tw-flow-summary');
flowSummary.innerHTML = `
  <div class="flow-tag">合計三大法人：<span class="val pos">+${(182.5 + 45.3 - 23.8).toFixed(1)} 億</span></div>
  <div class="flow-tag">外資連續買超：<span class="val pos">5 日</span></div>
  <div class="flow-tag">融資餘額：<span class="val">2,341 億</span></div>`;

// ── Hot Topics ──
const topics = [
  { icon: '🤖', name: 'AI 概念股', sentiment: 'positive', strength: 85, detail: '台積電、鴻海領軍' },
  { icon: '🔋', name: '綠能 / 儲能', sentiment: 'positive', strength: 72, detail: '政策利多加持' },
  { icon: '🚗', name: '電動車', sentiment: 'neutral', strength: 55, detail: '等待新訂單消息' },
  { icon: '🏠', name: '重電概念', sentiment: 'positive', strength: 78, detail: '電網升級商機' },
  { icon: '💊', name: '生技新藥', sentiment: 'positive', strength: 68, detail: '臨床數據正面' },
  { icon: '🛳️', name: '航運復甦', sentiment: 'negative', strength: 35, detail: '運價持續下滑' },
];
const topicsGrid = document.getElementById('tw-topics');
topics.forEach(t => {
  const sentimentColor = t.sentiment === 'positive' ? 'var(--green)' : t.sentiment === 'negative' ? 'var(--red)' : 'var(--amber)';
  const sentimentText = t.sentiment === 'positive' ? '🔥 看多' : t.sentiment === 'negative' ? '❄️ 看空' : '⚖️ 中立';
  const card = document.createElement('div');
  card.className = 'topic-card';
  card.innerHTML = `
    <div class="topic-icon">${t.icon}</div>
    <div class="topic-name">${t.name}</div>
    <div class="topic-sentiment ${t.sentiment}">${sentimentText}</div>
    <div class="topic-bar" style="margin-top:6px"><div class="topic-bar-fill" style="width:${t.strength}%;background:${sentimentColor}"></div></div>
    <div style="font-size:.7rem;color:var(--text3);margin-top:4px">${t.detail}</div>`;
  topicsGrid.appendChild(card);
});

// ── TW Channel Summaries (loaded from main.py output) ──
// Fallback demo data in case report.json doesn't exist yet
const twChannelsFallback = [
  { name: '財女珍妮', avatar: '珍', date: '(demo)', videoTitle: '尚未執行 main.py 產生報告', videoUrl: 'https://www.youtube.com/@jennymarket', stance: 'neutral', stanceText: '待分析', summary: '請先執行 python main.py 產生 dashboard/data/report.json，頻道分析資料將自動載入。' },
];

function renderChannelList(channels, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  channels.forEach(c => {
    const item = document.createElement('div');
    item.className = 'channel-item';
    item.innerHTML = `
      <div class="channel-top">
        <div class="channel-avatar">${c.avatar}</div>
        <div class="channel-name">${c.name}</div>
        <div class="channel-time">${c.date}</div>
      </div>
      <a class="channel-video-title" href="${c.videoUrl}" target="_blank" rel="noopener">🎥 ${c.videoTitle}</a>
      <div class="channel-stance ${c.stance}">${c.stance === 'bull' ? '📈' : c.stance === 'bear' ? '📉' : '⚖️'} ${c.stanceText}</div>
      <div class="channel-summary">${c.summary}</div>`;
    container.appendChild(item);
  });
}

// 嘗試載入 main.py 產生的 report.json
let twChannels = twChannelsFallback;
fetch('data/report.json')
  .then(r => { if (!r.ok) throw new Error('no report'); return r.json(); })
  .then(data => {
    // Market Indices
    if (data.indices) {
      renderMarketIndices(data.indices);
    }
    
    twChannels = data.channels.filter(c => c.market === 'tw');
    if (twChannels.length > 0) {
      renderChannelList(twChannels, 'tw-channels');
      console.log(`✅ 已載入 ${twChannels.length} 個台股頻道分析 (${data.date})`);
    } else {
      renderChannelList(twChannelsFallback, 'tw-channels');
    }
    // US channels from report
    const usFromReport = data.channels.filter(c => c.market === 'us');
    if (usFromReport.length > 0) {
      renderChannelList(usFromReport, 'us-channels');
    }
    // Update last update time
    if (data.generatedAt) {
      document.getElementById('last-update').textContent = data.generatedAt.slice(0, 16).replace('T', ' ');
    }
  })
  .catch(() => {
    console.log('ℹ️ report.json 不存在，使用 demo 資料。請執行 python main.py 產生。');
    renderChannelList(twChannelsFallback, 'tw-channels');
  });

// ── US Sectors ──
const usSectors = [
  { name: 'Technology', pct: 1.85 },
  { name: 'Healthcare', pct: 0.62 },
  { name: 'Financials', pct: -0.34 },
  { name: 'Energy', pct: -1.12 },
  { name: 'Consumer', pct: 0.95 },
  { name: 'Industrials', pct: 0.41 },
  { name: 'Materials', pct: -0.28 },
  { name: 'Real Estate', pct: -0.73 },
  { name: 'Utilities', pct: 0.15 },
  { name: 'Comm Svc', pct: 1.22 },
];
const sectorContainer = document.getElementById('us-sectors');
const maxSector = Math.max(...usSectors.map(s => Math.abs(s.pct)));
usSectors.sort((a, b) => b.pct - a.pct);
usSectors.forEach(s => {
  const isPos = s.pct >= 0;
  const pct = (Math.abs(s.pct) / maxSector) * 80;
  const row = document.createElement('div');
  row.className = 'sector-row';
  row.innerHTML = `
    <div class="sector-name">${s.name}</div>
    <div class="sector-bar-track">
      <div class="sector-bar-fill ${isPos ? 'pos' : 'neg'}" style="width:${pct}%">${s.pct > 0 ? '+' : ''}${s.pct.toFixed(2)}%</div>
    </div>`;
  sectorContainer.appendChild(row);
});

// ── US Events ──
const events = [
  { day: '5', month: 'MAY', title: 'Apple (AAPL) 財報', desc: 'Q2 財報公佈，關注 iPhone 銷售及 AI 策略', tag: 'earnings' },
  { day: '7', month: 'MAY', title: 'FOMC 會議紀要', desc: '市場密切關注降息路徑與縮表計畫', tag: 'fed' },
  { day: '10', month: 'MAY', title: 'CPI 數據公佈', desc: '核心 CPI 預期 +3.2%，影響降息時程判斷', tag: 'data' },
  { day: '12', month: 'MAY', title: 'NVIDIA 財報', desc: 'AI 晶片需求指標，Blackwell 出貨進度更新', tag: 'earnings' },
  { day: '15', month: 'MAY', title: '零售銷售數據', desc: '消費者支出動能觀察，經濟軟著陸風向球', tag: 'data' },
];
const eventsContainer = document.getElementById('us-events');
events.forEach(e => {
  const item = document.createElement('div');
  item.className = 'event-item';
  item.innerHTML = `
    <div class="event-date"><div class="event-day">${e.day}</div><div class="event-month">${e.month}</div></div>
    <div class="event-body">
      <div class="event-title">${e.title}</div>
      <div class="event-desc">${e.desc}</div>
      <span class="event-tag ${e.tag}">${e.tag === 'earnings' ? '📊 財報' : e.tag === 'fed' ? '🏛️ 聯準會' : '📈 經濟數據'}</span>
    </div>`;
  eventsContainer.appendChild(item);
});

// ── US Channels ──
const usChannels = [
  { name: 'Graham Stephan', avatar: 'GS', date: '2026-05-03', videoTitle: 'The Fed Just Changed Everything — Here\'s What To Do', videoUrl: 'https://www.youtube.com/@GrahamStephan', stance: 'bull', stanceText: 'Bullish', summary: 'Believes the rate pause is positive for equities. Recommends DCA into broad index funds with a focus on tech.' },
  { name: 'Meet Kevin', avatar: 'MK', date: '2026-05-02', videoTitle: 'NVIDIA Earnings Preview: AI Bubble or Real Growth?', videoUrl: 'https://www.youtube.com/@MeetKevin', stance: 'bull', stanceText: 'Bullish', summary: 'Expects blowout numbers from NVIDIA. Highlights data center revenue as the key metric to watch.' },
  { name: 'Andrei Jikh', avatar: 'AJ', date: '2026-05-01', videoTitle: 'Is Real Estate About to Crash? The Data Says...', videoUrl: 'https://www.youtube.com/@AndreiJikh', stance: 'neutral', stanceText: 'Neutral', summary: 'Real estate showing mixed signals. Suggests staying diversified and not overweighting property.' },
];
const usChannelList = document.getElementById('us-channels');
usChannels.forEach(c => {
  const item = document.createElement('div');
  item.className = 'channel-item';
  item.innerHTML = `
    <div class="channel-top">
      <div class="channel-avatar">${c.avatar}</div>
      <div class="channel-name">${c.name}</div>
      <div class="channel-time">${c.date}</div>
    </div>
    <a class="channel-video-title" href="${c.videoUrl}" target="_blank" rel="noopener">🎥 ${c.videoTitle}</a>
    <div class="channel-stance ${c.stance}">${c.stance === 'bull' ? '📈' : c.stance === 'bear' ? '📉' : '⚖️'} ${c.stanceText}</div>
    <div class="channel-summary">${c.summary}</div>`;
  usChannelList.appendChild(item);
});

// ── Trump Posts Data (Mock) ──
const trumpPosts = [
  { date: '2 小時前', content: 'Our economy is doing TERRIBLE! The Fed needs to CUT RATES NOW. China is laughing at us. We will put massive tariffs on their EVs! MAKE AMERICA GREAT AGAIN!', url: 'https://truthsocial.com/@realDonaldTrump', sentiment: 'bear', impact: 'Negative for broad market, Positive for domestic EV makers' },
  { date: '昨天', content: 'Big Tech is out of control. We need to look into their monopoly power immediately when I get back.', url: 'https://truthsocial.com/@realDonaldTrump', sentiment: 'bear', impact: 'Negative for Mega-cap Tech (AAPL, GOOGL)' },
  { date: '3 天前', content: 'Energy dominance! Drill, baby, drill! We will unleash American oil and gas like never before.', url: 'https://truthsocial.com/@realDonaldTrump', sentiment: 'bull', impact: 'Positive for Traditional Energy (XLE)' }
];

const trumpList = document.getElementById('trump-posts');
if (trumpList) {
  trumpList.innerHTML = trumpPosts.map(p => {
    const stColor = p.sentiment === 'bull' ? 'color:var(--green)' : 'color:var(--red)';
    const icon = p.sentiment === 'bull' ? '📈 利多' : '📉 利空';
    return `<div style="padding:12px 0; border-bottom:1px solid var(--glass-border);">
      <div style="font-size:0.7rem; color:var(--text3); margin-bottom:4px;">${p.date}</div>
      <a href="${p.url}" target="_blank" rel="noopener" style="display:block; font-size:0.85rem; line-height:1.4; margin-bottom:6px; font-weight:500; color:var(--text); text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='var(--blue)'; this.style.textDecoration='underline'" onmouseout="this.style.color='var(--text)'; this.style.textDecoration='none'">"${p.content}" <span style="font-size:0.7rem; color:var(--blue); text-decoration:none;">🔗 點擊查看原文</span></a>
      <div style="font-size:0.75rem; background:var(--bg3); padding:6px 10px; border-radius:6px; border-left:2px solid ${p.sentiment === 'bull' ? 'var(--green)' : 'var(--red)'};">
        <span style="${stColor}; font-weight:600; margin-right:6px;">${icon}</span>
        <span style="color:var(--text2)">${p.impact}</span>
      </div>
    </div>`;
  }).join('');
}

// ── Overview Consensus Detail ──
const allChannels = [...twChannels, ...usChannels.map(c => ({ ...c, name: c.name }))];
const consensusDetail = document.getElementById('ov-consensus-detail');
allChannels.forEach(c => {
  const stanceClass = c.stance === 'bull' ? 'background:rgba(52,211,153,.12);color:#34d399' :
    c.stance === 'bear' ? 'background:rgba(248,113,113,.12);color:#f87171' : 'background:rgba(251,191,36,.12);color:#fbbf24';
  const item = document.createElement('div');
  item.className = 'consensus-item';
  item.innerHTML = `<span>${c.name}</span><span class="consensus-stance" style="${stanceClass}">${c.stanceText}</span>`;
  consensusDetail.appendChild(item);
});

// ── Overview Key Themes ──
const keyThemes = [
  { icon: '🤖', name: 'AI 算力軍備競賽', desc: 'NVIDIA、台積電引領，CoWoS / HBM 供不應求，供應鏈受惠明確', markets: ['台股', '美股'] },
  { icon: '🏛️', name: '聯準會利率政策', desc: '暫停升息已確認，降息時程成焦點，債市殖利率走勢影響全球股市', markets: ['美股', '全球'] },
  { icon: '⚡', name: '電網基礎建設', desc: 'AI 資料中心用電暴增，重電、電網升級商機爆發', markets: ['台股'] },
  { icon: '🌏', name: '地緣政治風險', desc: '中東局勢與台海議題持續為潛在不確定因素', markets: ['台股', '美股'] },
];
const themesContainer = document.getElementById('ov-themes');
keyThemes.forEach(t => {
  const item = document.createElement('div');
  item.className = 'theme-item';
  item.innerHTML = `
    <div class="theme-icon">${t.icon}</div>
    <div class="theme-body"><div class="theme-name">${t.name}</div><div class="theme-desc">${t.desc}</div></div>
    <div class="theme-markets">${t.markets.map(m => `<span class="theme-market-tag">${m}</span>`).join('')}</div>`;
  themesContainer.appendChild(item);
});

// ── Gauge Needle Animation ──
function setGaugeAngle(value) {
  // value 0-100, angle: -90 to 90
  const angle = -90 + (value / 100) * 180;
  const needle = document.getElementById('gauge-needle');
  if (needle) needle.setAttribute('transform', `rotate(${angle}, 100, 100)`);
}
setGaugeAngle(65);

// ── Refresh Button ──
document.getElementById('btn-refresh')?.addEventListener('click', () => {
  const btn = document.getElementById('btn-refresh');
  btn.style.transform = 'rotate(360deg)';
  setTimeout(() => btn.style.transform = '', 500);
});
