# 📈 Market Insights Agent

Market Insights Agent 是一個基於 LLM 的自動化財經資訊管道與視覺化儀表板。它能每天定時監控指定的 YouTube 財經頻道，提取逐字稿並利用 Google Gemini 進行深度市場分析，最後將結構化的精簡報告推送到你的 Telegram，同時在專屬的 Web Dashboard 上呈現。

### 🌟 核心功能
# 🌟 核心功能
* **自動化監控**：利用 GitHub Actions 達成無伺服器 (Serverless) 定時排程。
* **高效摘要**：採用 Gemini 模型處理長文本，精準捕捉多空觀點、關鍵數據與提及個股。
* **YouTube 影片分析**：自動抓取指定財經頻道影片，解析字幕並生成市場洞見。當 Gemini Token 不足時會自動退回簡易摘要或切換至較低成本模型。
* **特朗普貼文分析**：爬取並分析 Donald Trump 社群平台最新貼文，提供情緒與關鍵議題摘要。
* **AI 洞見 (AI Insight)**：結合多來源金融新聞與模型推論，產出每日 AI 投資洞見與策略建議。
* **視覺化儀表板 (Dashboard)**：
  * **雙市場分析**：分拆台股與美股板塊輪動及頻道觀點。
  * **個股搜尋與比較**：即時查詢個股詳細資訊，並支援跨市場個股疊加比較（標準化 100 基準線）。
  * **動態數據對接**：前端直接讀取 Python 後端產生的 `report.json`，自動渲染 YouTube 分析結果。
* **多通路推播**：同時更新 Dashboard 數據並推播至 Telegram Bot。
* **視覺化儀表板 (Dashboard)**：
  * **雙市場分析**：分拆台股與美股板塊輪動及頻道觀點。
  * **個股搜尋與比較**：即時查詢個股詳細資訊，並支援跨市場個股疊加比較（標準化 100 基準線）。
  * **動態數據對接**：前端直接讀取 Python 後端產生的 `report.json`，自動渲染 YouTube 分析結果。
* **多通路推播**：同時更新 Dashboard 數據並推播至 Telegram Bot。

### 🚀 快速開始

#### 1. 取得必要憑證
* **Gemini API Key**: 前往 Google AI Studio 申請免費 Key。
* **Telegram Bot**:
  1. 在 Telegram 搜尋 `@BotFather` 並發送 `/newbot` 取得 Token。
  2. 發送訊息給你的 Bot 後，訪問 `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` 找到你的 `chat_id`。

#### 2. 設定 GitHub Secrets
將以下變數新增至你的 Repo > Settings > Secrets and variables > Actions:
* `GEMINI_API_KEY`: 你的 Google AI API Key。
* `TELEGRAM_TOKEN`: Telegram 機器人 Token。
* `TELEGRAM_CHAT_ID`: 接收通知的 Chat ID。

#### 3. 配置監控清單
編輯 `config.json` 加入你想追蹤的頻道（支援 `@頻道名` 或頻道 ID），並加上市場標籤：

```json
{
  "channels": [
    { "name": "財女珍妮", "id": "@jennymarket", "market": "tw" },
    { "name": "Graham Stephan", "id": "@GrahamStephan", "market": "us" }
  ]
}
```

#### 4. 本地測試與開啟 Dashboard
如果你想在本地環境執行與瀏覽：

```bash
git clone https://github.com/你的帳號/market-insights-agent.git
cd market-insights-agent
pip install -r requirements.txt

# 1. 設定環境變數 (可建立 .env 檔案)
# 2. 執行主程式抓取資料與分析，這會產生 dashboard/data/report.json
python main.py

# 3. 啟動本地靜態伺服器來瀏覽 Dashboard
cd dashboard
python -m http.server 8000
# 打開瀏覽器訪問 http://localhost:8000
```

### 🌍 如何免費發布上線 (Hosting Online)
因為我們的架構是純前端加上 GitHub Actions 產生的靜態 JSON，**完全不需要租用伺服器**！最推薦的方法是使用 **GitHub Pages**：

1. **上傳專案**：將這個專案 Push 到你的 GitHub Repository。
2. **開啟 Pages 功能**：
   * 在你的 GitHub Repo 頁面，點擊上方的 **Settings**。
   * 點選左側選單的 **Pages**。
   * 在 "Build and deployment" 區塊，**Source** 選擇 `Deploy from a branch`。
   * 在 **Branch** 選擇 `main`，資料夾選擇 `/ (root)`，然後點擊 **Save**。
3. **完成上線**：
   * 等待大約 1~2 分鐘，你的網站就會上線了！
   * 網址會是：`https://<你的GitHub帳號>.github.io/<專案名稱>/dashboard/`
4. **自動更新機制**：
   * 由於我們已經寫好了 `.github/workflows/daily_analysis.yml` 排程，每天 10:00 和 20:00 執行完分析後，它會自動把最新的 `report.json` 推回 GitHub。
   * GitHub Pages 偵測到檔案變更，就會**自動重新部署**，你的網頁資料永遠是最新的！

### 🛠️ 技術棧
* **後端與爬蟲**: Python 3.10+, `yt-dlp`, `youtube-transcript-api`
* **AI 模型**: Google Gemini (透過 `google-genai` SDK)
* **前端儀表板**: Vanilla HTML/CSS/JS (Glassmorphism 現代設計, Canvas 繪圖)
* **自動化與部署**: GitHub Actions (CI/CD) & GitHub Pages
* **通知**: Telegram Bot API
