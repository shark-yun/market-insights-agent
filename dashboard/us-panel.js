/* US snapshots and publisher headlines, rendered as text with source links. */
function renderUSPanel(report, lang) {
  const en = lang === 'en';
  const t = (zh, english) => en ? english : zh;
  const market = report?.usMarket || {};
  const title = (id, label) => { const el = document.getElementById(id); if (el) el.textContent = label; };
  const paragraph = text => { const p = document.createElement('p'); p.textContent = text; return p; };
  const link = (label, url) => {
    const a = document.createElement('a');
    try { const parsed = new URL(url); if (!['http:','https:'].includes(parsed.protocol)) return paragraph(label); a.href = parsed.href; } catch { return paragraph(label); }
    a.textContent = label; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
  };
  title('us-sectors-title',t('產業 ETF 表現','Sector ETF performance'));
  title('us-risk-title',t('波動風險 · VIX','Volatility risk · VIX'));
  title('us-news-title',t('市場新聞 · 原文來源','Market news · Publisher sources'));
  title('us-context-title',t('選舉與行情觀察','Election & market context'));
  title('us-channels-title',t('美股頻道分析','US channel analysis'));
  title('us-channels-status',t('待接入','Pending'));
  const freshness = document.getElementById('us-data-status');
  const indices = report?.indices || {};
  if (freshness) freshness.textContent = t('定時資料快照 · 美股交易日（紐約時間）：','Scheduled snapshot · US trading dates (New York): ') + ['GSPC','IXIC','DJI','VIX'].map(key => `${key} ${indices[key]?.marketDate || '—'}`).join(' · ');
  const sectors = document.getElementById('us-sectors'); sectors.replaceChildren();
  const rows = (market.sectors || []).filter(s => Number.isFinite(s.pct));
  const max = Math.max(1,...rows.map(s => Math.abs(s.pct)));
  rows.sort((a,b)=>b.pct-a.pct).forEach(row => {
    const item = document.createElement('div'); item.className = 'sector-row';
    const name = document.createElement('div'); name.className = 'sector-name'; name.textContent = `${en ? row.name : (US_SECTOR_ZH[row.name] || row.name)} (${row.symbol})`;
    const track = document.createElement('div'); track.className = 'sector-bar-track';
    const bar = document.createElement('div'); bar.className = `sector-bar-fill ${row.pct >= 0 ? 'pos':'neg'}`;
    bar.style.width = Math.max(12,Math.abs(row.pct)/max*95)+'%'; bar.textContent = `${row.pct >= 0 ? '+':''}${row.pct.toFixed(2)}%`;
    track.append(bar); item.append(name,track); sectors.append(item);
  });
  sectors.append(paragraph(rows.length ? t('以產業 ETF 漲跌作為代理指標；資料日期：','Sector ETFs are proxies; dates: ')+[...new Set(rows.map(s=>s.marketDate))].join(', ') : t('資料待更新','Waiting for data')));
  const vix = indices.VIX;
  const risk = document.getElementById('us-risk'); risk.replaceChildren();
  risk.append(paragraph(vix && Number.isFinite(vix.price) ? `VIX ${vix.price.toFixed(2)} · ${vix.pct >= 0 ? '+':''}${vix.pct.toFixed(2)}% · ${vix.marketDate}` : t('VIX 待更新','VIX pending')));
  risk.append(paragraph(t('VIX 反映預期波動；數值上升通常表示避險需求增加。這裡保留原始市場指標，新聞情緒由策略室另行判讀。','VIX measures expected volatility. Rising values often indicate greater hedging demand. News sentiment is assessed separately in the strategy room.')));
  const news = document.getElementById('us-news'); news.replaceChildren();
  (market.news || []).forEach(row => {
    const article = document.createElement('article'); article.className = 'us-news-item';
    article.append(link(row.title,row.url),paragraph(`${row.source} · ${row.publishedAt?.replace('T',' ').replace('+00:00',' UTC') || '—'}`)); news.append(article);
  });
  if (!market.news?.length) news.append(paragraph(t('新聞來源待更新；不顯示模擬貼文。','News feed pending.')));
  const context = document.getElementById('us-context'); context.replaceChildren();
  context.append(paragraph(t('2026/11/4：選後早盤曾出現賣壓，之後主要指數回升。盤前、盤中與收盤是不同時間點，需分別閱讀。','Nov 4, 2026: Initial election-related selling was followed by a rebound. Premarket, intraday and closing moves describe different points in time.')));
  context.append(link(t('Reuters：早盤期指收復跌幅（11/4）','Reuters: Futures reverse early losses (Nov 4)'),'https://www.fidelity.com/news/article/us-markets/202611040334RTRSNEWSCOMBINED_KCN3WF10E-OUSBS_1'));
  context.append(paragraph(t('AP 收盤報導：S&P 500 約上漲 1.6%，道瓊約上漲 3%，Nasdaq 約上漲 1.4%。後續走勢以最新行情快照為準。','AP closing report: S&P 500 about +1.6%, Dow about +3%, Nasdaq about +1.4%. See the snapshots for subsequent market moves.')));
  context.append(link(t('AP：11/4 收盤報導','AP: Nov 4 closing report'),'https://apnews.com/article/c0be7ca45b5875abe758e0570cb9a265'));
  const channels = document.getElementById('us-channels');
  const data = (report?.channels || []).filter(c=>c.market === 'us');
  if (data.length) { renderChannelList(data,'us-channels'); title('us-channels-status',t('來源已載入','Sources loaded')); }
  else channels.replaceChildren(paragraph(t('頻道來源尚未接通。先參考市場數據與新聞，專家評語待分析。','Channel research is pending. Market data and publisher news are available above.')));
  const architecture = document.getElementById('architecture-title');
  if (architecture) architecture.textContent = t('系統架構 · 原始設計圖','System architecture · Original design');
  title('architecture-note',t('設計藍圖：三路資料分析後交由 Fusion 整合。目前已接通行情、成交量、新聞標題與規則摘要；Podcast、財報及多 agent 完整協作仍在規劃。','Design blueprint: three research streams feed Fusion. Market data, turnover, news headlines and rule summaries are implemented. Podcasts, financial statements and full multi-agent coordination remain planned.'));
  window.applyUSStockSnapshots?.(market.stocks || []);
}
