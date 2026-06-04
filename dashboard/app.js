/* ═══════════════════════════════════════════
   Market Insights Dashboard — app.js
   ═══════════════════════════════════════════ */

// ── Language Toggle & Translation Support ──
let currentLang = localStorage.getItem('lang') || 'zh';

window.TW_SECTOR_EN = {
  '半導體': 'Semiconductor', '電子工業': 'Electronics', '金融保險': 'Finance/Insurance',
  '航運': 'Shipping', '生技醫療': 'Biomedical', '食品': 'Food', '化學': 'Chemicals',
  '鋼鐵': 'Steel', '電機': 'Machinery', '油電燃氣': 'Oil/Gas', '玻璃陶瓷': 'Glass/Ceramic',
  '造紙': 'Paper', '電器電纜': 'Electrical Cable', '建材營造': 'Construction',
  '觀光餐旅': 'Tourism/F&B', '資訊服務': 'IT Services', '汽車': 'Automotive',
  '其他電子': 'Other Electronics', '光電': 'Optoelectronics', '通信網路': 'Communications',
  '電子零組件': 'Electronic Parts', '電腦周邊': 'Computer Peripherals', '水泥': 'Cement',
  '塑膠': 'Plastics', '紡織纖維': 'Textile', '橡膠': 'Rubber', '貿易百貨': 'Trading/Retail',
  '綠能環保': 'Green Energy', '數位雲端': 'Digital/Cloud', '運動休閒': 'Sports/Leisure',
  '居家生活': 'Home Life', '其他': 'Others'
};

window.RISK_EN = {
  '美元指數 DXY': 'US Dollar Index (DXY)',
  '美國10年期公債': 'US 10Y Treasury Yield',
  '黃金 Gold': 'Gold Spot',
  '原油 WTI': 'WTI Crude Oil'
};

const US_SECTOR_ZH = {
  'Technology': '科技', 'Healthcare': '醫療保健', 'Financials': '金融',
  'Energy': '能源', 'Consumer': '消費品', 'Industrials': '工業',
  'Materials': '材料', 'Real Estate': '房地產', 'Utilities': '公用事業',
  'Comm Svc': '通訊服務'
};

function applyTranslations() {
  const isEn = currentLang === 'en';
  
  // Tab labels
  const tabTw = document.querySelector('#tab-tw span[data-i18n="tw_stocks"]');
  if (tabTw) tabTw.textContent = isEn ? 'TW Stock' : '台股';
  const tabUs = document.querySelector('#tab-us span[data-i18n="us_stocks"]');
  if (tabUs) tabUs.textContent = isEn ? 'US Stock' : '美股';
  const tabOverview = document.querySelector('#tab-overview span[data-i18n="ai_strategy"]');
  if (tabOverview) tabOverview.textContent = isEn ? 'AI Strategy Room' : 'AI 策略室';
  
  // Watchlist title
  const wlTitle = document.querySelector('#watchlist-section h2');
  if (wlTitle) {
    wlTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      ${isEn ? 'My Watchlist' : '我的自選股 (Watchlist)'}
    `;
  }
  
  // TAIEX Label
  const twIndexLabel = document.querySelector('#panel-tw .index-label');
  if (twIndexLabel) twIndexLabel.textContent = isEn ? 'TAIEX Index' : '加權指數 TAIEX';

  // Volume, high, low labels
  const volLabel = document.querySelector('#btn-show-volume .meta-label');
  if (volLabel) volLabel.textContent = isEn ? 'Volume 📈' : '成交量 📈';
  const highLabel = document.querySelector('#panel-tw .meta-item:nth-child(2) .meta-label');
  if (highLabel) highLabel.textContent = isEn ? 'High' : '最高';
  const lowLabel = document.querySelector('#panel-tw .meta-item:nth-child(3) .meta-label');
  if (lowLabel) lowLabel.textContent = isEn ? 'Low' : '最低';

  // Search input placeholders
  const twSearch = document.getElementById('tw-stock-search');
  if (twSearch) twSearch.placeholder = isEn ? 'Search TW stock (e.g., 2330, 2317)' : '搜尋個股（例如：2330 台積電、2317 鴻海）';
  const usSearch = document.getElementById('us-stock-search');
  if (usSearch) usSearch.placeholder = isEn ? 'Search US stock (e.g., AAPL, NVDA, TSLA)' : 'Search stock (e.g. AAPL, NVDA, TSLA)';

  // Heatmap card title
  const twHeatmapTitle = document.querySelector('#panel-tw .glass-card:nth-child(3) .card-title');
  if (twHeatmapTitle) {
    twHeatmapTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
      ${isEn ? 'Sector Rotation' : '產業板塊輪動'}
    `;
  }
  const twHeatmapBadge = document.querySelector('#panel-tw .glass-card:nth-child(3) .card-badge');
  if (twHeatmapBadge) twHeatmapBadge.textContent = isEn ? 'Live' : '即時';

  // Capital flow card title
  const twFlowTitle = document.querySelector('#panel-tw .glass-card:nth-child(4) .card-title');
  if (twFlowTitle) {
    twFlowTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
      ${isEn ? 'Institutional Net Flows' : '三大法人買賣超'}
    `;
  }
  const twFlowSelect = document.getElementById('tw-flow-period');
  if (twFlowSelect) {
    twFlowSelect.options[0].text = isEn ? 'Today' : '今日';
    twFlowSelect.options[1].text = isEn ? '1 Week' : '近一週';
    twFlowSelect.options[2].text = isEn ? '1 Month' : '近一月';
  }

  // Hot topics card title
  const twTopicsTitle = document.querySelector('#panel-tw .glass-card:nth-child(5) .card-title');
  if (twTopicsTitle) {
    twTopicsTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      ${isEn ? 'Hot Topics Tracking' : '熱門題材追蹤'}
    `;
  }

  // Top 10 Card Title
  const twInstTitle = document.querySelector('#panel-tw .glass-card:nth-child(6) .card-title');
  if (twInstTitle) {
    twInstTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      ${isEn ? 'Institutional Top 10 Buy/Sell' : '三大法人買賣超 Top 10'}
    `;
  }
  const btnInstBuy = document.getElementById('btn-inst-buy');
  if (btnInstBuy) btnInstBuy.textContent = isEn ? '🔼 Net Buy Top 10' : '🔼 買超 Top 10';
  const btnInstSell = document.getElementById('btn-inst-sell');
  if (btnInstSell) btnInstSell.textContent = isEn ? '🔽 Net Sell Top 10' : '🔽 賣超 Top 10';

  // Top 10 Table headers
  const ths = document.querySelectorAll('#inst-table-wrap th');
  if (ths && ths.length >= 5) {
    ths[0].textContent = isEn ? 'Stock' : '股票';
    ths[1].textContent = isEn ? 'Total (Lots)' : '三大(張)';
    ths[2].textContent = isEn ? 'Foreign' : '外資';
    ths[3].textContent = isEn ? 'Trust' : '投信';
    ths[4].textContent = isEn ? 'Dealer' : '自營';
  }

  // Channel Summaries Title
  const twChannelTitle = document.querySelector('#panel-tw .channel-panel .card-title');
  if (twChannelTitle) {
    twChannelTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
      ${isEn ? 'Channel Analysis Summary' : '頻道分析摘要'}
    `;
  }
  const twChannelBadge = document.querySelector('#panel-tw .channel-panel .card-badge');
  if (twChannelBadge) twChannelBadge.textContent = isEn ? 'Updated' : '已更新';

  // US Panel Sector Performance
  const usSectorsTitle = document.querySelector('#panel-us .glass-card:nth-child(3) .card-title');
  if (usSectorsTitle) {
    usSectorsTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
      </svg>
      ${isEn ? 'Sector Performance' : '產業表現'}
    `;
  }

  // US Panel Sentiment
  const usSentimentTitle = document.querySelector('#panel-us .glass-card:nth-child(4) .card-title');
  if (usSentimentTitle) {
    usSentimentTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
      ${isEn ? 'Market Sentiment Index' : '市場情緒指數'}
    `;
  }
  const gaugeScale = document.querySelector('.gauge-scale');
  if (gaugeScale) {
    gaugeScale.innerHTML = isEn ? `
      <span>Extreme Fear</span><span>Fear</span><span>Neutral</span><span>Greed</span><span>Extreme Greed</span>
    ` : `
      <span>極度恐慌</span><span>恐慌</span><span>中立</span><span>貪婪</span><span>極度貪婪</span>
    `;
  }

  // US Trump Posts
  const trumpTitle = document.querySelector('#panel-us .glass-card:nth-child(5) .card-title');
  if (trumpTitle) {
    trumpTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
      ${isEn ? 'Trump Social Viewpoints Analysis' : '川普社群觀點分析 (Trump Posts)'}
    `;
  }

  // US Events Calendar
  const usEventsTitle = document.querySelector('#panel-us .col-right .glass-card:nth-child(1) .card-title');
  if (usEventsTitle) {
    usEventsTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      ${isEn ? 'Earnings & Key Events Calendar' : '重要財報 / 事件行事曆'}
    `;
  }

  // US Channels
  const usChannelsTitle = document.querySelector('#panel-us .channel-panel .card-title');
  if (usChannelsTitle) {
    usChannelsTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
      ${isEn ? 'US Channel Analysis' : '美股頻道分析'}
    `;
  }
  const usChannelBadge = document.querySelector('#panel-us .channel-panel .card-badge');
  if (usChannelBadge) usChannelBadge.textContent = isEn ? 'Updated' : '已更新';

  // Overview Tab Signal Cards
  const scoreHeader = document.querySelector('.score-header');
  if (scoreHeader) scoreHeader.textContent = isEn ? 'Daily Market Health Score' : '今日綜合市場評分';
  const scoreDesc = document.querySelector('.score-desc');
  if (scoreDesc) scoreDesc.textContent = isEn ? 'Combines TW & US market metrics, capital flows, sentiment indicators, and channel consensus' : '綜合台美股市場數據、資金流向、情緒指標與頻道觀點';
  
  const twSignalTitle = document.querySelector('.overview-signals .signal-card:nth-child(1) .signal-title');
  if (twSignalTitle) twSignalTitle.textContent = isEn ? 'TW Stock Trend' : '台股趨勢';
  const usSignalTitle = document.querySelector('.overview-signals .signal-card:nth-child(2) .signal-title');
  if (usSignalTitle) usSignalTitle.textContent = isEn ? 'US Stock Trend' : '美股趨勢';
  const fundSignalTitle = document.querySelector('.overview-signals .signal-card:nth-child(3) .signal-title');
  if (fundSignalTitle) fundSignalTitle.textContent = isEn ? 'Capital Flows' : '資金動能';
  const moodSignalTitle = document.querySelector('.overview-signals .signal-card:nth-child(4) .signal-title');
  if (moodSignalTitle) moodSignalTitle.textContent = isEn ? 'Market Sentiment' : '市場情緒';

  // AI Verdict Card Title
  const aiVerdictTitle = document.querySelector('#panel-overview .col-left .glass-card .card-title');
  if (aiVerdictTitle) {
    aiVerdictTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
      ${isEn ? 'AI Comprehensive Analysis' : 'AI 綜合研判'}
    `;
  }
  const aiVerdictBadge = document.querySelector('#panel-overview .col-left .glass-card .card-badge');
  if (aiVerdictBadge) aiVerdictBadge.textContent = isEn ? 'Gemini AI' : 'Gemini 分析';

  // Expert Consensus Card Title
  const consensusTitle = document.querySelector('#panel-overview .col-right .glass-card:nth-child(1) .card-title');
  if (consensusTitle) {
    consensusTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      ${isEn ? 'Expert Consensus Across Channels' : '各頻道觀點共識'}
    `;
  }
  
  // Consensus labels
  const consensusLabels = document.querySelectorAll('.consensus-bar-wrap .consensus-label');
  if (consensusLabels && consensusLabels.length >= 3) {
    consensusLabels[0].textContent = isEn ? 'Bullish' : '看多';
    consensusLabels[1].textContent = isEn ? 'Neutral' : '中立';
    consensusLabels[2].textContent = isEn ? 'Bearish' : '看空';
  }

  // Cross-market Themes Card Title
  const themesTitle = document.querySelector('#panel-overview .col-right .glass-card:nth-child(2) .card-title');
  if (themesTitle) {
    themesTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
      ${isEn ? 'Key Themes Across Markets' : '跨市場關鍵主題'}
    `;
  }

  // Technical Indicators Title
  const techTitle = document.querySelector('#panel-overview .glass-card:nth-child(3) .card-title');
  if (techTitle) {
    techTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
      ${isEn ? 'Technical Indicators Dashboard' : '技術指標儀表板'}
    `;
  }

  // Risk Radar Title
  const riskTitle = document.querySelector('#panel-overview .glass-card:nth-child(4) .card-title');
  if (riskTitle) {
    riskTitle.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      ${isEn ? 'Risk Radar Monitor' : '風險雷達'}
    `;
  }

  // Volume Modal Header
  const volModalTitle = document.querySelector('#volume-modal .stock-name');
  if (volModalTitle) volModalTitle.textContent = isEn ? 'Historical Volume (TAIEX)' : '歷史成交量 (大盤)';
  const volThs = document.querySelectorAll('#volume-modal th');
  if (volThs && volThs.length >= 3) {
    volThs[0].textContent = isEn ? 'Date' : '日期';
    volThs[1].textContent = isEn ? 'Close Index' : '收盤指數';
    volThs[2].textContent = isEn ? 'Volume' : '成交量';
  }

  // Stock Detail Modal Titles
  const trendTitle = document.querySelector('#stock-modal .stock-chart-section .card-title');
  if (trendTitle) trendTitle.textContent = isEn ? '📈 Price Trend' : '📈 今日走勢';
  const periodBtns = document.querySelectorAll('#stock-modal .chart-period-tabs button');
  if (periodBtns && periodBtns.length >= 3) {
    periodBtns[0].textContent = isEn ? 'Day' : '日';
    periodBtns[1].textContent = isEn ? 'Week' : '週';
    periodBtns[2].textContent = isEn ? 'Month' : '月';
  }
  const modalInfoTitle = document.querySelector('#stock-modal .stock-detail-left .glass-card:nth-child(1) .card-title');
  if (modalInfoTitle) modalInfoTitle.textContent = isEn ? '📊 Trading Info' : '📊 交易資訊';
  const modalFlowTitle = document.querySelector('#stock-modal .stock-detail-left .glass-card:nth-child(2) .card-title');
  if (modalFlowTitle) modalFlowTitle.textContent = isEn ? '💰 Stock Capital Flow' : '💰 個股資金流向';
  const modalDiscussionTitle = document.querySelector('#stock-modal .stock-detail-right .card-title');
  if (modalDiscussionTitle) modalDiscussionTitle.textContent = isEn ? '🎙️ Channel Discussion' : '🎙️ 專家 / 頻道討論';

  // Toggle button content
  const btnLang = document.getElementById('btn-lang');
  if (btnLang) btnLang.textContent = isEn ? '🌐 中文' : '🌐 EN';
}

function translateSignals() {
  const isEn = currentLang === 'en';
  const signals = [
    { id: 'ov-tw-signal', zh: '偏多', en: 'Bullish' },
    { id: 'ov-us-signal', zh: '偏多', en: 'Bullish' },
    { id: 'ov-fund-signal', zh: '中性', en: 'Neutral' },
    { id: 'ov-mood-signal', zh: '樂觀', en: 'Optimistic' }
  ];
  signals.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) {
      const currentText = el.textContent.trim();
      if (currentText === '偏多' || currentText === 'Bullish' || currentText === '看多') el.textContent = isEn ? 'Bullish' : '偏多';
      if (currentText === '偏空' || currentText === 'Bearish' || currentText === '看空') el.textContent = isEn ? 'Bearish' : '偏空';
      if (currentText === '中性' || currentText === 'Neutral') el.textContent = isEn ? 'Neutral' : '中性';
      if (currentText === '樂觀' || currentText === 'Optimistic') el.textContent = isEn ? 'Optimistic' : '樂觀';
    }
  });
}

function translateAIAnalysisHeaders() {
  const isEn = currentLang === 'en';
  const headers = document.querySelectorAll('#ov-analysis h3');
  if (headers && headers.length >= 4) {
    headers[0].textContent = isEn ? '🎯 Core Outlook' : '🎯 核心觀點';
    headers[1].textContent = isEn ? '📊 Key Data' : '📊 關鍵數據';
    headers[2].textContent = isEn ? '⚡ Actionable Advice' : '⚡ 操作建議';
    headers[3].textContent = isEn ? '⚠️ Risk Warnings' : '⚠️ 風險提示';
  }
}

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
  const locale = currentLang === 'en' ? 'en-US' : 'zh-TW';
  document.getElementById('clock-time').textContent =
    now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('last-update').textContent =
    now.toLocaleDateString(locale) + ' ' + now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
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
    
    // Update volume and bind click event for volume modal
    const volEl = document.getElementById('tw-volume');
    const highEl = document.getElementById('tw-high');
    const lowEl = document.getElementById('tw-low');
    
    // 單位換算工具：將 Yahoo Finance 的成交量數字轉為 萬張 / 億
    const formatVol = (v) => {
      if (v >= 100000000) return (v / 100000000).toFixed(2) + ' 億';
      if (v >= 10000) return (v / 10000).toFixed(2) + ' 萬張';
      return v.toLocaleString();
    };

    if (volEl && tw.volume_sparkline && tw.volume_sparkline.length > 0) {
      const latestVol = tw.volume_sparkline[tw.volume_sparkline.length - 1];
      volEl.textContent = formatVol(latestVol);
    }
    if (highEl && tw.high) highEl.textContent = tw.high.toLocaleString();
    if (lowEl && tw.low) lowEl.textContent = tw.low.toLocaleString();

    const btnVolume = document.getElementById('btn-show-volume');
    if (btnVolume && tw.dates && tw.volume_sparkline) {
      btnVolume.onclick = () => {
        const tbody = document.getElementById('volume-table-body');
        let html = '';
        // show last 30 days reversed (latest first)
        for (let i = tw.dates.length - 1; i >= Math.max(0, tw.dates.length - 30); i--) {
          const d = tw.dates[i];
          const v = tw.volume_sparkline[i];
          const p = tw.sparkline[i];
          html += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:8px; text-align:left;">${d}</td>
              <td style="padding:8px; font-weight:600;">${p.toLocaleString()}</td>
              <td style="padding:8px;">${formatVol(v)}</td>
            </tr>
          `;
        }
        tbody.innerHTML = html;
        document.getElementById('volume-modal-overlay').style.display = 'flex';
      };
    }
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

// ── TW Heatmap Rendering ──
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

function renderSectors(sectors) {
  const hmContainer = document.getElementById('tw-heatmap');
  if (!hmContainer) return;
  hmContainer.innerHTML = '';

  const isEn = currentLang === 'en';
  if (!sectors || sectors.length === 0) {
    hmContainer.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 20px; color: var(--text3);">${isEn ? 'No Sector Data' : '暫無板塊數據'}</div>`;
    return;
  }

  // 漲跌幅由大到小排序
  const sorted = [...sectors].sort((a, b) => b.pct - a.pct);

  sorted.forEach(s => {
    const cell = document.createElement('div');
    cell.className = 'hm-cell';
    cell.style.background = getHeatColor(s.pct);
    
    // 重量分配：電子、半導體最重要給 span 3，其餘常見板塊給 span 2
    let weight = 1;
    const n = s.name;
    if (n.includes('半導體') || n.includes('電子')) weight = 3;
    else if (n.includes('金融') || n.includes('航運') || n.includes('電腦') || n.includes('生技')) weight = 2;

    cell.style.gridColumn = `span ${weight}`;
    cell.style.color = Math.abs(s.pct) > 1.5 ? '#fff' : '#1e293b';
    
    const displayName = isEn ? (window.TW_SECTOR_EN[s.name] || s.name) : s.name;
    cell.innerHTML = `<div class="hm-name">${displayName}</div><div class="hm-val">${s.pct > 0 ? '+' : ''}${s.pct.toFixed(2)}%</div>`;
    hmContainer.appendChild(cell);
  });
}

// ── Capital Flow Rendering ──
function renderCapitalFlow(flow) {
  const flowBars = document.getElementById('tw-flow-bars');
  const flowSummary = document.getElementById('tw-flow-summary');
  if (!flowBars || !flowSummary) return;

  flowBars.innerHTML = '';
  flowSummary.innerHTML = '';

  const isEn = currentLang === 'en';
  if (!flow) {
    flowBars.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text3);">${isEn ? 'No Institutional Net Flow Data' : '暫無三大法人買賣超數據'}</div>`;
    return;
  }

  const flows = [
    { label: isEn ? 'Foreign' : '外資', amount: flow.foreign },
    { label: isEn ? 'Mutual Fund' : '投信', amount: flow.trust },
    { label: isEn ? 'Dealers' : '自營商', amount: flow.dealer },
  ];

  const maxFlow = Math.max(...flows.map(f => Math.abs(f.amount)), 10.0);

  flows.forEach(f => {
    const isBuy = f.amount >= 0;
    const pct = (Math.abs(f.amount) / maxFlow) * 100;
    const row = document.createElement('div');
    row.className = 'flow-row';
    const fillLabel = isBuy ? (isEn ? 'Buy' : '買超') : (isEn ? 'Sell' : '賣超');
    row.innerHTML = `
      <div class="flow-label">${f.label}</div>
      <div class="flow-bar-track">
        <div class="flow-bar-fill ${isBuy ? 'buy' : 'sell'}" style="width:${pct}%">
          ${fillLabel} ${Math.abs(f.amount).toFixed(2)} ${isEn ? 'B' : '億'}
        </div>
      </div>`;
    flowBars.appendChild(row);
  });

  const isTotalBuy = flow.total >= 0;
  const formattedDate = flow.date ? `${flow.date.slice(0, 4)}/${flow.date.slice(4, 6)}/${flow.date.slice(6, 8)}` : '';

  flowSummary.innerHTML = `
    <div class="flow-tag">${isEn ? 'Total Net Flows' : '合計三大法人'}：<span class="val ${isTotalBuy ? 'pos' : 'neg'}">${isTotalBuy ? '+' : ''}${flow.total.toFixed(2)} ${isEn ? 'B' : '億'}</span></div>
    <div class="flow-tag">${isEn ? 'Foreign Direction' : '外資本日動向'}：<span class="val ${flow.foreign >= 0 ? 'pos' : 'neg'}">${flow.foreign >= 0 ? (isEn ? 'Net Buy' : '買超') : (isEn ? 'Net Sell' : '賣超')}</span></div>
    <div class="flow-tag">${isEn ? 'Data Date' : '資料日期'}：<span class="val">${formattedDate}</span></div>`;
}

// ── Three Big Players Top 10 Buy/Sell Stocks ──
let currentInstData = null;
function renderInstitutional(inst) {
  if (!inst) return;
  currentInstData = inst;
  
  const dateEl = document.getElementById('institutional-date');
  if (dateEl && inst.date) {
    dateEl.textContent = `${inst.date.slice(0,4)}/${inst.date.slice(4,6)}/${inst.date.slice(6,8)}`;
  }
  showInstTab('buy');
}

window.showInstTab = function(type) {
  const tbody = document.getElementById('inst-table-body');
  const btnBuy = document.getElementById('btn-inst-buy');
  const btnSell = document.getElementById('btn-inst-sell');
  if (!tbody || !currentInstData) return;

  const isEn = currentLang === 'en';
  if (type === 'buy') {
    btnBuy.style.background = 'rgba(52,211,153,0.15)';
    btnBuy.style.color = '#34d399';
    btnSell.style.background = 'var(--bg3)';
    btnSell.style.color = 'var(--text2)';
  } else {
    btnSell.style.background = 'rgba(239,68,68,0.15)';
    btnSell.style.color = '#f87171';
    btnBuy.style.background = 'var(--bg3)';
    btnBuy.style.color = 'var(--text2)';
  }

  const list = type === 'buy' ? currentInstData.topBuy : currentInstData.topSell;
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:16px; text-align:center; color:var(--text3);">${isEn ? 'No Details' : '暫無個股明細'}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const isNetPos = item.net_lots >= 0;
    const rankColor = type === 'buy' ? '#34d399' : '#f87171';
    return `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <td style="padding:8px 6px; text-align:left; font-weight:600;">
          <span style="color:${rankColor}; margin-right:4px;">${idx + 1}.</span>
          ${item.name} <span style="font-size:0.7rem; color:var(--text3); font-weight:normal;">(${item.code})</span>
        </td>
        <td style="padding:8px 6px; text-align:right; font-weight:700; color:${isNetPos ? 'var(--green)' : 'var(--red)'};">
          ${isNetPos ? '+' : ''}${item.net_lots.toLocaleString()}
        </td>
        <td style="padding:8px 6px; text-align:right; color:${item.foreign_lots >= 0 ? 'var(--green)' : 'var(--red)'};">
          ${item.foreign_lots >= 0 ? '+' : ''}${item.foreign_lots.toLocaleString()}
        </td>
        <td style="padding:8px 6px; text-align:right; color:${item.trust_lots >= 0 ? 'var(--green)' : 'var(--red)'};">
          ${item.trust_lots >= 0 ? '+' : ''}${item.trust_lots.toLocaleString()}
        </td>
        <td style="padding:8px 6px; text-align:right; color:${item.dealer_lots >= 0 ? 'var(--green)' : 'var(--red)'};">
          ${item.dealer_lots >= 0 ? '+' : ''}${item.dealer_lots.toLocaleString()}
        </td>
      </tr>
    `;
  }).join('');
};

// ── Hot Topics Rendering (Derived 100% Dynamically from Stock Buys) ──
function renderHotTopics(inst) {
  const topicsGrid = document.getElementById('tw-topics');
  if (!topicsGrid) return;
  topicsGrid.innerHTML = '';

  const isEn = currentLang === 'en';
  if (!inst || !inst.topBuy || inst.topBuy.length === 0) {
    topicsGrid.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 20px; color: var(--text3);">${isEn ? 'No Hot Topics Data' : '暫無題材數據'}</div>`;
    return;
  }

  const top1 = inst.topBuy[0];
  const topForeign = [...inst.topBuy].sort((a,b) => b.foreign_lots - a.foreign_lots)[0];
  const topTrust = [...inst.topBuy].sort((a,b) => b.trust_lots - a.trust_lots)[0];
  const consensusList = inst.topBuy.filter(x => x.foreign_lots > 0 && x.trust_lots > 0).slice(0, 2);

  const topics = [
    {
      icon: '🔥',
      name: isEn ? 'Dual Inst. Heavy Buying' : '雙法人聯手買超',
      sentiment: 'positive',
      strength: 95,
      detail: consensusList.length > 0 ? consensusList.map(x => x.name).join(', ') + (isEn ? ' bought by Foreign & Trust' : ' 獲外資投信共識敲進') : (isEn ? 'No clear consensus today' : '今日無明顯共識股')
    },
    {
      icon: '🔼',
      name: isEn ? 'Net Buy Leader' : '三大法人買超冠軍',
      sentiment: 'positive',
      strength: 90,
      detail: isEn ? `${top1.name} (${top1.code}) bought ${top1.net_lots.toLocaleString()} lots` : `${top1.name} (${top1.code}) 單日大買 ${top1.net_lots.toLocaleString()} 張`
    },
    {
      icon: '🏦',
      name: isEn ? 'Foreign Heavy Position' : '外資重倉佈局',
      sentiment: 'positive',
      strength: 85,
      detail: isEn ? `${topForeign.name} foreign added ${topForeign.foreign_lots.toLocaleString()} lots` : `${topForeign.name} 外資單日加碼 ${topForeign.foreign_lots.toLocaleString()} 張`
    },
    {
      icon: '🎯',
      name: isEn ? 'Mutual Fund Lock-in' : '投信鎖碼飆股',
      sentiment: 'positive',
      strength: 88,
      detail: isEn ? `${topTrust.name} mutual funds added ${topTrust.trust_lots.toLocaleString()} lots` : `${topTrust.name} 投信積極買超 ${topTrust.trust_lots.toLocaleString()} 張`
    }
  ];

  topics.forEach(t => {
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <div class="topic-icon">${t.icon}</div>
      <div class="topic-name">${t.name}</div>
      <div class="topic-sentiment positive">${isEn ? '🔥 Bullish' : '🔥 看多'}</div>
      <div class="topic-bar" style="margin-top:6px"><div class="topic-bar-fill" style="width:${t.strength}%;background:var(--green)"></div></div>
      <div style="font-size:.7rem;color:var(--text3);margin-top:4px">${t.detail}</div>`;
    topicsGrid.appendChild(card);
  });
}

// ── TW Channel Summaries (loaded from main.py output) ──
const twChannelsFallback = [
  { name: '財女珍妮', avatar: '珍', date: '(demo)', videoTitle: '尚未執行 main.py 產生報告', videoUrl: 'https://www.youtube.com/@jennymarket', stance: 'neutral', stanceText: '待分析', summary: '請先執行 python main.py 產生 dashboard/data/report.json，頻道分析資料將自動載入。' },
];

function renderChannelList(channels, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const isEn = currentLang === 'en';
  channels.forEach(c => {
    const item = document.createElement('div');
    item.className = 'channel-item';
    const displayStanceText = isEn ? (c.stance === 'bull' ? 'Bullish' : c.stance === 'bear' ? 'Bearish' : 'Neutral') : c.stanceText;
    item.innerHTML = `
      <div class="channel-top">
        <div class="channel-avatar">${c.avatar}</div>
        <div class="channel-name">${c.name}</div>
        <div class="channel-time">${c.date}</div>
      </div>
      <a class="channel-video-title" href="${c.videoUrl}" target="_blank" rel="noopener">🎥 ${c.videoTitle}</a>
      <div class="channel-stance ${c.stance}">${c.stance === 'bull' ? '📈' : c.stance === 'bear' ? '📉' : '⚖️'} ${displayStanceText}</div>
      <div class="channel-summary">${c.summary}</div>`;
    container.appendChild(item);
  });
}

// ── Technical Indicators Rendering ──
function renderTechnicals(technicals) {
  const grid = document.getElementById('tech-indicators-grid');
  if (!grid || !technicals || technicals.length === 0) return;
  const isEn = currentLang === 'en';
  grid.innerHTML = technicals.map(t => {
    const sigColor = t.signal === 'bull' ? 'var(--green)' : t.signal === 'bear' ? 'var(--red)' : 'var(--amber)';
    const sigBg = t.signal === 'bull' ? 'rgba(52,211,153,.1)' : t.signal === 'bear' ? 'rgba(248,113,113,.1)' : 'rgba(251,191,36,.1)';
    const rsiColor = t.rsi > 70 ? 'var(--red)' : t.rsi < 30 ? 'var(--green)' : 'var(--text)';
    const rsiLabel = isEn ? (t.rsi > 70 ? 'Overbought' : t.rsi < 30 ? 'Oversold' : 'Neutral') : (t.rsi > 70 ? '過熱' : t.rsi < 30 ? '過冷' : '正常');
    const displaySignalText = isEn ? (t.signal === 'bull' ? 'Bullish ↑' : t.signal === 'bear' ? 'Bearish ↓' : 'Consolidating ↔') : t.signalText;
    
    let displayName = t.name;
    if (isEn) {
      if (t.name === '台股加權') displayName = 'TAIEX';
      else if (t.name === '台積電') displayName = 'TSMC';
      else if (t.name === '鴻海') displayName = 'Foxconn';
    }

    return `<div style="background:var(--bg3);border-radius:12px;padding:16px;border:1px solid var(--glass-border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <span style="font-weight:700;font-size:0.95rem;">${displayName}</span>
          <span style="color:var(--text3);font-size:0.75rem;margin-left:6px;">${t.symbol}</span>
        </div>
        <span style="background:${sigBg};color:${sigColor};padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;">${displaySignalText}</span>
      </div>
      <div style="font-size:1.3rem;font-weight:800;margin-bottom:8px;">${t.price.toLocaleString()}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:0.72rem;color:var(--text2);">
        <div>MA5<div style="font-weight:600;color:var(--text);">${t.ma5.toLocaleString()}</div></div>
        <div>MA20<div style="font-weight:600;color:var(--text);">${t.ma20.toLocaleString()}</div></div>
        <div>MA60<div style="font-weight:600;color:var(--text);">${t.ma60.toLocaleString()}</div></div>
      </div>
      <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:0.72rem;color:var(--text2);">RSI(14)</span>
        <div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden;">
          <div style="width:${t.rsi}%;height:100%;background:${rsiColor};border-radius:3px;transition:width .3s;"></div>
        </div>
        <span style="font-size:0.75rem;font-weight:600;color:${rsiColor};">${t.rsi} ${rsiLabel}</span>
      </div>
    </div>`;
  }).join('');
}

// ── Risk Dashboard Rendering ──
function renderRisks(risks) {
  const grid = document.getElementById('risk-dashboard');
  if (!grid || !risks || risks.length === 0) return;
  const isEn = currentLang === 'en';
  grid.innerHTML = risks.map(r => {
    const isPos = r.change >= 0;
    const color = isPos ? 'var(--green)' : 'var(--red)';
    const displayName = isEn ? (window.RISK_EN[r.name] || r.name) : r.name;
    return `<div style="background:var(--bg3);border-radius:12px;padding:14px;border:1px solid var(--glass-border);text-align:center;">
      <div style="font-size:1.4rem;margin-bottom:4px;">${r.icon}</div>
      <div style="font-size:0.72rem;color:var(--text3);margin-bottom:4px;">${displayName}</div>
      <div style="font-size:1.2rem;font-weight:800;">${r.price.toLocaleString()}</div>
      <div style="font-size:0.78rem;font-weight:600;color:${color};margin-top:2px;">${isPos ? '+' : ''}${r.pct.toFixed(2)}%</div>
    </div>`;
  }).join('');
}

// ── Fetch & Global Render Orchestration ──
let loadedData = null;
let twChannels = twChannelsFallback;

function renderAllDynamic() {
  const data = loadedData;
  const isEn = currentLang === 'en';
  
  if (data && data.indices) {
    renderMarketIndices(data.indices);
  }
  
  if (data && data.channels) {
    twChannels = data.channels.filter(c => c.market === 'tw');
    if (twChannels.length > 0) {
      renderChannelList(twChannels, 'tw-channels');
    } else {
      renderChannelList(twChannelsFallback, 'tw-channels');
    }
    const usFromReport = data.channels.filter(c => c.market === 'us');
    if (usFromReport.length > 0) {
      renderChannelList(usFromReport, 'us-channels');
    }
  } else {
    renderChannelList(twChannelsFallback, 'tw-channels');
    renderChannelList(usChannels, 'us-channels');
  }
  
  if (data && data.technicals) {
    renderTechnicals(data.technicals);
  }
  
  if (data && data.risks) {
    renderRisks(data.risks);
  }
  
  if (data && data.sectors) {
    renderSectors(data.sectors);
  }
  
  if (data && data.institutional_flow) {
    renderCapitalFlow(data.institutional_flow);
  }
  
  if (data && data.institutional) {
    renderInstitutional(data.institutional);
    renderHotTopics(data.institutional);
  }
  
  if (data && data.generatedAt) {
    document.getElementById('last-update').textContent = data.generatedAt.slice(0, 16).replace('T', ' ');
  }

  // App UI labels
  applyTranslations();
  translateSignals();
  translateAIAnalysisHeaders();
  updateClock();
  updateSentimentGauge(65);
  
  // Render static datasets
  renderUSSectors();
  renderUSEvents();
  renderTrumpPosts();
  renderConsensus();
  renderKeyThemes();
}

// Fetch report.json on page load
fetch('data/report.json?t=' + Date.now())
  .then(r => { if (!r.ok) throw new Error('no report'); return r.json(); })
  .then(data => {
    loadedData = data;
    renderAllDynamic();
  })
  .catch(() => {
    console.log('ℹ️ report.json 不存在，使用 demo 資料。請執行 python main.py 產生。');
    renderAllDynamic();
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

function renderUSSectors() {
  const sectorContainer = document.getElementById('us-sectors');
  if (!sectorContainer) return;
  sectorContainer.innerHTML = '';
  
  const isEn = currentLang === 'en';
  const maxSector = Math.max(...usSectors.map(s => Math.abs(s.pct)));
  const sorted = [...usSectors].sort((a, b) => b.pct - a.pct);
  sorted.forEach(s => {
    const isPos = s.pct >= 0;
    const pct = (Math.abs(s.pct) / maxSector) * 80;
    const displayName = isEn ? s.name : (US_SECTOR_ZH[s.name] || s.name);
    const row = document.createElement('div');
    row.className = 'sector-row';
    row.innerHTML = `
      <div class="sector-name">${displayName}</div>
      <div class="sector-bar-track">
        <div class="sector-bar-fill ${isPos ? 'pos' : 'neg'}" style="width:${pct}%">${s.pct > 0 ? '+' : ''}${s.pct.toFixed(2)}%</div>
      </div>`;
    sectorContainer.appendChild(row);
  });
}

// ── US Events ──
const events = [
  { day: '5', month: 'MAY', title: 'Apple (AAPL) 財報', titleEn: 'Apple (AAPL) Earnings', desc: 'Q2 財報公佈，關注 iPhone 銷售及 AI 策略', descEn: 'Q2 earnings release, focusing on iPhone sales & AI strategy', tag: 'earnings' },
  { day: '7', month: 'MAY', title: 'FOMC 會議紀要', titleEn: 'FOMC Minutes', desc: '市場密切關注降息路徑與縮表計畫', descEn: 'Markets closely watch the rate cut path and balance sheet reduction plan', tag: 'fed' },
  { day: '10', month: 'MAY', title: 'CPI 數據公佈', titleEn: 'CPI Data Release', desc: '核心 CPI 預期 +3.2%，影響降息時程判斷', descEn: 'Core CPI expected +3.2%, impacting the timing of rate cuts', tag: 'data' },
  { day: '12', month: 'MAY', title: 'NVIDIA 財報', titleEn: 'NVIDIA Earnings', desc: 'AI 晶片需求指標，Blackwell 出貨進度更新', descEn: 'AI chip demand indicator, Blackwell shipment progress update', tag: 'earnings' },
  { day: '15', month: 'MAY', title: '零售銷售數據', titleEn: 'Retail Sales Data', desc: '消費者支出動能觀察，經濟軟著陸風向球', descEn: 'Consumer spending momentum observation, economic soft landing indicator', tag: 'data' },
];

function renderUSEvents() {
  const eventsContainer = document.getElementById('us-events');
  if (!eventsContainer) return;
  eventsContainer.innerHTML = '';
  const isEn = currentLang === 'en';
  events.forEach(e => {
    const displayTitle = isEn ? e.titleEn : e.title;
    const displayDesc = isEn ? e.descEn : e.desc;
    const displayTag = isEn ? (e.tag === 'earnings' ? '📊 Earnings' : e.tag === 'fed' ? '🏛️ Fed' : '📈 Econ Data') : (e.tag === 'earnings' ? '📊 財報' : e.tag === 'fed' ? '🏛️ 聯準會' : '📈 經濟數據');
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `
      <div class="event-date"><div class="event-day">${e.day}</div><div class="event-month">${e.month}</div></div>
      <div class="event-body">
        <div class="event-title">${displayTitle}</div>
        <div class="event-desc">${displayDesc}</div>
        <span class="event-tag ${e.tag}">${displayTag}</span>
      </div>`;
    eventsContainer.appendChild(item);
  });
}

// ── US Channels ──
const usChannels = [
  { name: 'Graham Stephan', avatar: 'GS', date: '2026-05-03', videoTitle: 'The Fed Just Changed Everything — Here\'s What To Do', videoUrl: 'https://www.youtube.com/@GrahamStephan', stance: 'bull', stanceText: 'Bullish', summary: 'Believes the rate pause is positive for equities. Recommends DCA into broad index funds with a focus on tech.' },
  { name: 'Meet Kevin', avatar: 'MK', date: '2026-05-02', videoTitle: 'NVIDIA Earnings Preview: AI Bubble or Real Growth?', videoUrl: 'https://www.youtube.com/@MeetKevin', stance: 'bull', stanceText: 'Bullish', summary: 'Expects blowout numbers from NVIDIA. Highlights data center revenue as the key metric to watch.' },
  { name: 'Andrei Jikh', avatar: 'AJ', date: '2026-05-01', videoTitle: 'Is Real Estate About to Crash? The Data Says...', videoUrl: 'https://www.youtube.com/@AndreiJikh', stance: 'neutral', stanceText: 'Neutral', summary: 'Real estate showing mixed signals. Suggests staying diversified and not overweighting property.' },
];

// ── Trump Posts Data (Mock) ──
const trumpPosts = [
  { date: '2 小時前', dateEn: '2 hours ago', content: 'Our economy is doing TERRIBLE! The Fed needs to CUT RATES NOW. China is laughing at us. We will put massive tariffs on their EVs! MAKE AMERICA GREAT AGAIN!', url: 'https://truthsocial.com/@realDonaldTrump', sentiment: 'bear', impact: 'Negative for broad market, Positive for domestic EV makers', impactZh: '對大盤利空，對美國本土電動車商利多' },
  { date: '昨天', dateEn: 'Yesterday', content: 'Big Tech is out of control. We need to look into their monopoly power immediately when I get back.', url: 'https://truthsocial.com/@realDonaldTrump', sentiment: 'bear', impact: 'Negative for Mega-cap Tech (AAPL, GOOGL)', impactZh: '對科技巨頭利空 (AAPL, GOOGL)' },
  { date: '3 天前', dateEn: '3 days ago', content: 'Energy dominance! Drill, baby, drill! We will unleash American oil and gas like never before.', url: 'https://truthsocial.com/@realDonaldTrump', sentiment: 'bull', impact: 'Positive for Traditional Energy (XLE)', impactZh: '對傳統能源利多 (XLE)' }
];

function renderTrumpPosts() {
  const trumpList = document.getElementById('trump-posts');
  if (!trumpList) return;
  trumpList.innerHTML = '';
  const isEn = currentLang === 'en';
  trumpList.innerHTML = trumpPosts.map(p => {
    const stColor = p.sentiment === 'bull' ? 'color:var(--green)' : 'color:var(--red)';
    const icon = isEn ? (p.sentiment === 'bull' ? '📈 Positive' : '📉 Negative') : (p.sentiment === 'bull' ? '📈 利多' : '📉 利空');
    const displayDate = isEn ? p.dateEn : p.date;
    const displayImpact = isEn ? p.impact : p.impactZh;
    const clickText = isEn ? '🔗 Click to view original' : '🔗 點擊查看原文';
    return `<div style="padding:12px 0; border-bottom:1px solid var(--glass-border);">
      <div style="font-size:0.7rem; color:var(--text3); margin-bottom:4px;">${displayDate}</div>
      <a href="${p.url}" target="_blank" rel="noopener" style="display:block; font-size:0.85rem; line-height:1.4; margin-bottom:6px; font-weight:500; color:var(--text); text-decoration:none; transition:color 0.2s;" onmouseover="this.style.color='var(--blue)'; this.style.textDecoration='underline'" onmouseout="this.style.color='var(--text)'; this.style.textDecoration='none'">"${p.content}" <span style="font-size:0.7rem; color:var(--blue); text-decoration:none;">${clickText}</span></a>
      <div style="font-size:0.75rem; background:var(--bg3); padding:6px 10px; border-radius:6px; border-left:2px solid ${p.sentiment === 'bull' ? 'var(--green)' : 'var(--red)'};">
        <span style="${stColor}; font-weight:600; margin-right:6px;">${icon}</span>
        <span style="color:var(--text2)">${displayImpact}</span>
      </div>
    </div>`;
  }).join('');
}

// ── Overview Consensus Detail ──
function renderConsensus() {
  const consensusDetail = document.getElementById('ov-consensus-detail');
  if (!consensusDetail) return;
  consensusDetail.innerHTML = '';
  const isEn = currentLang === 'en';
  const allChannelsList = [...twChannels, ...usChannels.map(c => ({ ...c, name: c.name }))];
  allChannelsList.forEach(c => {
    const stanceText = isEn ? (c.stance === 'bull' ? 'Bullish' : c.stance === 'bear' ? 'Bearish' : 'Neutral') : c.stanceText;
    const stanceClass = c.stance === 'bull' ? 'background:rgba(52,211,153,.12);color:#34d399' :
      c.stance === 'bear' ? 'background:rgba(248,113,113,.12);color:#f87171' : 'background:rgba(251,191,36,.12);color:#fbbf24';
    const item = document.createElement('div');
    item.className = 'consensus-item';
    item.innerHTML = `<span>${c.name}</span><span class="consensus-stance" style="${stanceClass}">${stanceText}</span>`;
    consensusDetail.appendChild(item);
  });
}

// ── Overview Key Themes ──
const keyThemes = [
  { icon: '🤖', name: 'AI 算力軍備競賽', nameEn: 'AI Computing Arms Race', desc: 'NVIDIA、台積電引領，CoWoS / HBM 供不應求，供應鏈受惠明確', descEn: 'Led by NVIDIA and TSMC. CoWoS & HBM in high demand, benefiting supply chains.', markets: ['台股', '美股'], marketsEn: ['TW', 'US'] },
  { icon: '🏛️', name: '聯準會利率政策', nameEn: 'Fed Interest Rate Policy', desc: '暫停升息已確認，降息時程成焦點，債市殖利率走勢影響全球股市', descEn: 'Rate pause confirmed, rate cut timing is key. Bond yields impact global equities.', markets: ['美股', '全球'], marketsEn: ['US', 'Global'] },
  { icon: '⚡', name: '電網基礎建設', nameEn: 'Grid Infrastructure Upgrade', desc: 'AI 資料中心用電暴增，重電、電網升級商機爆發', descEn: 'AI data center power consumption surges, triggering heavy electric & grid upgrade boom.', markets: ['台股'], marketsEn: ['TW'] },
  { icon: '🌏', name: '地緣政治風險', nameEn: 'Geopolitical Risk', desc: '中東局勢與台海議題持續為潛在不確定因素', descEn: 'Middle East conflicts and Taiwan Strait tensions remain potential uncertainties.', markets: ['台股', '美股'], marketsEn: ['TW', 'US'] },
];

function renderKeyThemes() {
  const themesContainer = document.getElementById('ov-themes');
  if (!themesContainer) return;
  themesContainer.innerHTML = '';
  const isEn = currentLang === 'en';
  keyThemes.forEach(t => {
    const displayName = isEn ? t.nameEn : t.name;
    const displayDesc = isEn ? t.descEn : t.desc;
    const displayMarkets = isEn ? t.marketsEn : t.markets;
    const item = document.createElement('div');
    item.className = 'theme-item';
    item.innerHTML = `
      <div class="theme-icon">${t.icon}</div>
      <div class="theme-body"><div class="theme-name">${displayName}</div><div class="theme-desc">${displayDesc}</div></div>
      <div class="theme-markets">${displayMarkets.map(m => `<span class="theme-market-tag">${m}</span>`).join('')}</div>`;
    themesContainer.appendChild(item);
  });
}

// ── Gauge Needle Animation & Setup ──
function setGaugeAngle(value) {
  const angle = -90 + (value / 100) * 180;
  const needle = document.getElementById('gauge-needle');
  if (needle) needle.setAttribute('transform', `rotate(${angle}, 100, 100)`);
}

function updateSentimentGauge(value) {
  const isEn = currentLang === 'en';
  setGaugeAngle(value);
  const valEl = document.getElementById('gauge-value');
  const lblEl = document.getElementById('gauge-label');
  if (valEl) valEl.textContent = value;
  if (lblEl) {
    let text = '';
    if (value >= 75) text = isEn ? 'Extreme Greed' : '極度貪婪';
    else if (value >= 55) text = isEn ? 'Greed' : '貪婪';
    else if (value >= 45) text = isEn ? 'Neutral' : '中立';
    else if (value >= 25) text = isEn ? 'Fear' : '恐慌';
    else text = isEn ? 'Extreme Fear' : '極度恐慌';
    lblEl.textContent = text;
  }
}

// ── Refresh Button ──
document.getElementById('btn-refresh')?.addEventListener('click', () => {
  const btn = document.getElementById('btn-refresh');
  btn.style.transform = 'rotate(360deg)';
  setTimeout(() => btn.style.transform = '', 500);
});

// ── Volume Modal Close ──
document.getElementById('volume-modal-close')?.addEventListener('click', () => {
  document.getElementById('volume-modal-overlay').style.display = 'none';
});
document.getElementById('volume-modal-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'volume-modal-overlay') {
    e.target.style.display = 'none';
  }
});

// ── Language Toggle Event Listener ──
document.getElementById('btn-lang')?.addEventListener('click', () => {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', currentLang);
  renderAllDynamic();
  
  // Re-render Stock modal if open
  const overlay = document.getElementById('stock-modal-overlay');
  if (overlay && overlay.classList.contains('show')) {
    const ticker = document.getElementById('modal-ticker').textContent;
    const marketVal = document.getElementById('modal-market').textContent.toLowerCase();
    const market = marketVal === 'twse' ? 'tw' : (marketVal === 'hkex' ? 'hk' : 'us');
    if (window.openStockModal) {
      window.openStockModal(ticker, market);
    }
  }
});

