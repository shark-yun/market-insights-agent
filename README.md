# Market Insights Agent

台美股市場資料與研究摘要 Dashboard。Python 排程收集行情、證交所成交量及市場新聞，輸出靜態 JSON；前端呈現資料快照、規則摘要，以及可選的 Gemini 分析。

**[線上 Dashboard](https://shark-yun.github.io/market-insights-agent/dashboard/)** · [架構與 Review 導覽](docs/architecture.md) · [分析資料格式](docs/strategy-data.md)

## 目前功能

| 功能 | 狀態與來源 |
| --- | --- |
| 台股指數、技術指標、法人與板塊 | Yahoo Finance／TWSE 資料快照 |
| 台股市場成交量 | TWSE FMTQIK，按完整日期對齊；股數換算萬張 |
| 美股指數、產業 ETF、追蹤個股 | Yahoo Finance 日線快照，附紐約交易日 |
| 市場新聞 | WSJ 公開 RSS 標題、發布時間與原文連結 |
| 基本面／技術、情緒摘要 | 無需模型的規則判讀與觀察重點；規則與 AI 評語分開顯示 |
| Gemini 分析 | 可選；金鑰、額度或模型不可用時顯示待分析，行情仍可更新 |
| YouTube 專家觀點 | 程式已備妥，目前在 config.json 關閉 |
| Podcast、財報、社群與完整 Fusion | 尚待接通，不產生假評分 |
| 台股／港股個股搜尋及比較 | 明確標示的示範資料，集中於 demo-stocks.js |

原始架構圖是設計藍圖，已放在 AI 策略室；不代表圖中全部來源都已實作。

## 本地執行

Python 3.10+；Node.js 只用於 JavaScript 語法檢查，前端無建置流程。

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# 抓取實際資料（會連線；模型／Telegram 若已設定則可能使用）
python main.py

# 僅瀏覽已提交的報告，不呼叫模型或推播
python -m http.server 8000
# http://localhost:8000/dashboard/
```

環境變數皆可留空。`GEMINI_API_KEY` 啟用模型，`GEMINI_MODEL` 可切換模型；Telegram 需要同時設定 `TELEGRAM_TOKEN` 與 `TELEGRAM_CHAT_ID`。憑證只放 `.env` 或 GitHub Secrets。

`config.json` 的 `enable_strategy_analysis` 控制排程是否呼叫策略模型，`enable_youtube_analysis` 控制頻道分析。瀏覽器「查看 AI 分析」只展開報告，不會即時派工。

## 驗證

```bash
python -m unittest discover -s tests -v
python -m compileall -q main.py market_insights
node --check dashboard/app.js
node --check dashboard/us-panel.js
node --check dashboard/strategy-room.js
node --check dashboard/stock-search.js
node --check dashboard/demo-stocks.js
```

Python 以 Black 統一排版，Ruff 檢查基本錯誤（設定於 pyproject.toml）。需要使用時先執行 `pip install -r requirements-dev.txt`。

測試使用離線 fixture 與本機 Git 倉庫，涵蓋缺值、日期對齊、新聞過濾、規則判讀、模型格式、額度失敗與同時發布報告的衝突。CI 不需要 API key，也不發送通知。

## 排程與部署

唯一正式排程為 `.github/workflows/daily_analysis.yml`：台灣時間 06:00、18:00，也可手動觸發。GitHub Actions 可能延遲，並非即時報價。排程提交 `dashboard/data/report.json` 與影片去重紀錄 `history.json`，GitHub Pages 隨後部署。

前端每五分鐘或回到分頁時重新讀取已發布 JSON。行情各自標示交易日，新聞保留發布時間；報告產生時間不等於每個來源的更新時間。
