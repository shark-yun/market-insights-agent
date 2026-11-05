/* Agent results are supplied by report.strategy; missing results never imply neutral. */
function renderStrategyRoom(report, lang) {
  const root = document.getElementById('agent-strategy-room');
  if (!root) return;
  const openPanels = new Set([...root.querySelectorAll('[data-agent-panel]:not([hidden])')].map(el => el.dataset.agentPanel));
  const en = lang === 'en';
  const t = (zh, english) => en ? english : zh;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const strategy = report?.strategy || {};
  const roles = [
    ['fundamental', '01', t('基本面／技術 Agent', 'Fundamental & Technical Agent'), t('財報 · 籌碼 · 價量訊號', 'Financials · Flows · Price signals')],
    ['expert', '02', t('專家觀點 Agent', 'Expert Agent'), t('影片 · Podcast · 觀點整理', 'Video · Podcasts · Expert views')],
    ['sentiment', '03', t('市場情緒 Agent', 'Sentiment Agent'), t('新聞 · 社群 · 事件影響', 'News · Social · Event impact')]
  ];
  const statuses = {complete:t('分析完成','Complete'), partial:t('資料不完整','Partial'), failed:t('分析失敗','Failed'), running:t('分析中','Running'), pending:t('待分析','Pending')};
  const reasons = {no_key:t('未設定模型金鑰','Model key not configured'), disabled:t('AI 分析已關閉','AI analysis disabled'), quota:t('模型額度不足或流量受限','Quota or rate limit reached'), model_unavailable:t('模型暫時無法使用','Model unavailable'), invalid_response:t('模型回應格式不完整','Invalid model response'), missing_sources:t('資料來源尚未齊備','Sources incomplete'), partial_sources:t('已有部分分析；來源仍不完整','Partial analysis; sources incomplete')};
  function card(id, number, name, description, fusion = false) {
    const result = (fusion ? strategy.fusion : strategy.agents?.[id]) || {};
    const status = Object.hasOwn(statuses, result.status) ? result.status : 'pending';
    const usable = ['complete','partial'].includes(status);
    const score = usable && typeof result.score === 'number' && Number.isFinite(result.score) && result.score >= 0 && result.score <= 100 ? result.score : null;
    const tone = score === null ? 'pending' : score >= 60 ? 'bull' : score <= 40 ? 'bear' : 'neutral';
    const direction = score === null ? t('尚無評分','Not scored') : score >= 60 ? t('偏多','Bullish') : score <= 40 ? t('偏空','Bearish') : t('中性','Neutral');
    const date = Date.parse(result.asOf);
    const stale = Number.isFinite(date) && Date.now() - date > 48 * 3600000;
    const text = (value, fallback) => esc(typeof value === 'string' && value.trim() ? value : fallback);
    const sources = Array.isArray(result.sources) ? result.sources : [];
    const sourceHTML = sources.map(source => {
      if (!source || typeof source !== 'object') return '';
      try { const url = new URL(source.url); if (!['https:','http:'].includes(url.protocol)) return ''; return `<li><a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${esc(source.title || url.hostname)}</a></li>`; } catch { return ''; }
    }).join('');
    return `<article class="glass-card agent-card ${fusion ? 'agent-fusion' : ''}">
      <div class="agent-heading"><span class="agent-number">${number}</span><span class="agent-status">${result.observation && status === 'pending' ? t('摘要就緒 · AI 待分析','Summary ready · AI pending') : statuses[status]}${stale ? ' · '+t('資料已過期','Stale') : ''}</span></div>
      <h3>${name}</h3><p class="agent-description">${description}</p>
      <div class="agent-metrics">${(Array.isArray(result.metrics) ? result.metrics : []).map(m => `<div><span>${esc(m.label)}</span><strong>${esc(m.value)}</strong></div>`).join('') || `<p>${t('正在等待數據摘要','Waiting for data summary')}</p>`}</div>
      <p class="agent-data-summary">${text(result.dataSummary,t('尚無來源資料。','No source data yet.'))}</p>
      ${result.observation ? `<div class="agent-observation"><strong>${t('資料判讀 · 規則摘要','Data interpretation · Rule summary')}</strong><p>${esc(result.observation)}</p><strong>${t('接下來觀察','Watch next')}</strong><p>${esc(result.watchpoints || '')}</p></div>` : ''}
      <button type="button" class="agent-analysis-toggle" data-agent-toggle="${id}" aria-controls="agent-analysis-${id}" aria-expanded="${openPanels.has(id)}">${openPanels.has(id) ? t('收合 AI 分析','Hide AI analysis') : t('查看 AI 分析','View AI analysis')}</button>
      <div id="agent-analysis-${id}" data-agent-panel="${id}" ${openPanels.has(id) ? '' : 'hidden'}>
      <p class="agent-analysis-state">${statuses[status]} · ${reasons[result.reason] || t('尚未產生模型結果','No model result yet')}</p>
      <div class="agent-score ${tone}"><strong>${score === null ? '—' : esc(score)}</strong><span>/ 100 · ${direction}</span></div>
      <div class="agent-meter" aria-hidden="true"><span class="${tone}" style="width:${score ?? 0}%"></span></div>
      <dl><dt>${t('評語','Assessment')}</dt><dd>${text(result.comment, t('尚未產生分析，等待此角色的研究結果。','No assessment yet. Waiting for this agent’s research.'))}</dd>
      <dt>${t('建議','Recommendation')}</dt><dd>${text(result.recommendation, t('暫不提供操作建議；需先完成分析與來源驗證。','No recommendation until analysis and source verification are complete.'))}</dd></dl>
      ${fusion ? `<dl><dt>${t('共識與分歧','Agreement & disagreement')}</dt><dd>${text(result.disagreements,t('等待三位 agent 的結果，尚無可比較的觀點。','Waiting for agent results before comparing views.'))}</dd></dl>` : ''}
      </div>
      <div class="agent-meta">${t('分析時間','As of')}: ${Number.isFinite(date) ? esc(new Date(date).toLocaleString(en ? 'en-GB':'zh-TW', {timeZone:'Asia/Taipei'}))+' (UTC+8)' : '—'}<br>${t('標的／範圍','Scope')}: ${text(result.scope,'—')} · ${t('期間','Horizon')}: ${text(result.horizon,'—')}</div>
      <details><summary>${t('查看依據與來源','Evidence & sources')} (${sources.length})</summary><p>${text(result.rationale,t('尚無評分依據。','No scoring rationale yet.'))}</p>${sourceHTML ? `<ul>${sourceHTML}</ul>` : `<p>${t('尚無可查證的來源連結。','No verifiable source links yet.')}</p>`}</details>
    </article>`;
  }
  root.innerHTML = `<header class="strategy-heading"><div><div class="strategy-eyebrow">AGENT RESEARCH DESK</div><h2>${t('三種視角，一份綜合判斷','Three perspectives. One synthesis.')}</h2><p>${t('分別檢視每位 agent 的評語、分數與建議，再追溯最終結論。','Inspect each agent’s assessment, score and recommendation before reviewing the synthesis.')}</p></div><span class="agent-status">${roles.filter(([id]) => strategy.agents?.[id]?.observation).length} / 3 ${t('資料摘要就緒','summaries ready')}</span></header>
    <p class="strategy-note">${t('方向分數：0 偏空 → 50 中性 → 100 偏多；不代表勝率或信心。缺少分析以 — 顯示，超過 48 小時標示過期。','Direction score: 0 bearish → 50 neutral → 100 bullish; not probability or confidence. Missing scores show —; results older than 48 hours are marked stale.')}</p>
    <div class="agent-grid">${roles.map(role => card(...role)).join('')}</div>
    <div class="agent-connector">↓ ${t('比較證據 · 辨識分歧 · 綜合研判','Compare evidence · Identify disagreement · Synthesize')}</div>
    <p class="strategy-note">${t('按鈕只展開排程產生的分析，不會即時呼叫模型；無額度或來源不足時顯示待分析。','Buttons reveal scheduled analysis; they do not call a model. Missing quota or sources leaves analysis pending.')}</p>
    ${card('fusion','Σ',t('Fusion Decision Agent · 綜合研判','Fusion Decision Agent'),t('保留各方依據與資料缺口，不將不同期間的觀點直接平均。','Preserves evidence and data gaps; views across different horizons are not simply averaged.'),true)}`;
  root.querySelectorAll('[data-agent-toggle]').forEach(button => button.addEventListener('click', () => {
    const panel = document.getElementById('agent-analysis-' + button.dataset.agentToggle);
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    button.textContent = panel.hidden ? t('查看 AI 分析','View AI analysis') : t('收合 AI 分析','Hide AI analysis');
  }));

}
