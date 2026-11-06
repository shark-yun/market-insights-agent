# Market Insights Agent

台美股市場資料與研究摘要 Dashboard。Python 排程收集行情、證交所成交量及市場新聞，輸出靜態 JSON；前端呈現資料快照、規則摘要，以及可選的 Gemini 分析。

**[線上 Dashboard](https://shark-yun.github.io/market-insights-agent/dashboard/)** · [架構與 Review 導覽](docs/architecture.md) · [分析資料格式](docs/strategy-data.md)

## 專案結構

| 資料夾 | 用途 |
| --- | --- |
| `market_insights/` | Python 核心：資料抓取、頻道字幕、研究摘要、模型與報告輸出 |
| `dashboard/` | 網頁介面；`assets/` 放圖片，`data/report.json` 是前端讀取的報告快照 |
| `config/` | 功能開關、追蹤頻道與環境變數範本；`settings.json` 為主要設定 |
| `data/` | 排程狀態；`history.json` 記錄已完成分析的影片 ID，避免重複分析 |
| `requirements/` | Python 依賴清單：`runtime.txt` 為執行所需，`dev.txt` 為開發工具 |
| `scripts/` | 輔助腳本，例如將產生的報告與影片紀錄提交回 Repo |
| `tests/` | 資料解析、研究摘要與發布流程的自動化測試 |
| `docs/` | 系統架構與報告資料格式說明 |
| `.github/workflows/` | 自動抓取資料、程式檢查與排程設定 |

根目錄的 `main.py` 是執行入口，`index.html` 將網站首頁導向 Dashboard，`pyproject.toml` 放 Python 工具設定。

## 目前功能

| 功能 | 狀態與來源 |
| --- | --- |
| 台股指數、技術指標、法人與板塊 | Yahoo Finance／TWSE 資料快照 |
| 台股市場成交量 | TWSE FMTQIK，按完整日期對齊；股數換算萬張 |
| 美股指數、產業 ETF、追蹤個股 | Yahoo Finance 日線快照，附紐約交易日 |
| 市場新聞 | WSJ 公開 RSS 標題、發布時間與原文連結 |
| 基本面／技術、情緒摘要 | 無需模型的規則判讀與觀察重點；規則與 AI 評語分開顯示 |
| Gemini 分析 | 可選；金鑰、額度或模型不可用時顯示待分析，行情仍可更新 |
| YouTube 專家觀點 | 官方 RSS／字幕已接通；目前啟用游庭皓與財女珍妮 |
| Podcast、財報、社群與完整 Fusion | 尚待接通，不產生假評分 |
| 台股／港股個股搜尋及比較 | 明確標示的示範資料，集中於 demo-stocks.js |

原始架構圖是設計藍圖，已放在 AI 策略室；不代表圖中全部來源都已實作。

## Fork 與 GitHub 部署

使用者可以直接在 GitHub 完成部署，不需在電腦安裝 Python 或啟動伺服器。

### 1. Fork 專案

點選本 Repo 右上角的 **Fork**，建立自己的副本。預設分支維持 `main`，後續設定與資料更新都在自己的 Repo 進行。

### 2. 啟用 GitHub Actions

進入 Fork 後的 Repo → **Actions**，允許執行 workflows，並啟用 **Daily Market Analysis**。Fork 的排程預設不會自動啟用，需要在自己的 Repo 開啟。[GitHub 說明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)

### 3. 設定可選功能

在 **Settings → Secrets and variables → Actions** 新增自己的 Repository secrets；原作者的 Secrets 不會隨 Fork 複製。

| Secret | 用途 |
| --- | --- |
| `GEMINI_API_KEY` | 啟用 Gemini 影片與策略分析 |
| `TELEGRAM_TOKEN` | 可選的 Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | 可選的 Telegram 接收對象 |

未設定 Gemini 金鑰時，仍可更新行情、新聞、節目來源與規則摘要，模型評語會顯示待分析。Telegram 另需在 `config/settings.json` 將 `enable_telegram_notifications` 設為 `true`。

編輯 `config/settings.json` 可調整追蹤頻道、`enable_youtube_analysis` 與 `enable_strategy_analysis`。

### 4. 啟用 GitHub Pages

進入 **Settings → Pages**，在 **Build and deployment** 設定：

- **Source**：`Deploy from a branch`
- **Branch**：`main`
- **Folder**：`/ (root)`

儲存後，等待 GitHub Pages 完成部署。[GitHub 說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 5. 手動執行第一次更新

進入 **Actions → Daily Market Analysis → Run workflow**，選擇 `main` 執行。完成後可在 Repo 內查看更新的 `dashboard/data/report.json`。

網站網址為 `https://<你的帳號>.github.io/<Repo名稱>/dashboard/`。之後由排程持續更新，不需要保持電腦開機。瀏覽器的「查看 AI 分析」按鈕用來展開已產生的結果。

## 排程與部署

唯一正式排程為 `.github/workflows/daily_analysis.yml`：台灣時間 06:00、18:00，也可手動觸發。GitHub Actions 可能延遲，並非即時報價。排程提交 `dashboard/data/report.json` 與影片去重紀錄 `data/history.json`，GitHub Pages 隨後部署。

前端每五分鐘或回到分頁時重新讀取已發布 JSON。行情各自標示交易日，新聞保留發布時間；報告產生時間不等於每個來源的更新時間。
