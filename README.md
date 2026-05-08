# 📈 Market Insights Agent

Market Insights Agent 是一個基於 LLM 的自動化財經資訊管道與視覺化儀表板。它能每天 9:00 AM Pacific Time 匯總多個財經新聞 RSS 與指定 YouTube 財經頻道，利用 Google Gemini 分析新聞對股票與產業的可能影響，產出 HTML Email newsletter，並同步更新 Dashboard 與可選的 Telegram 摘要。

## 🌟 核心功能

* **每日 Newsletter**：每天 9:00 AM Pacific Time 自動寄送市場簡報。
* **多來源聚合**：同時支援 RSS 財經新聞與 YouTube 財經頻道逐字稿。
* **股票影響分析**：採用 Gemini 產生市場脈動、新聞催化因素、受影響股票/產業、信心等級、風險與教育性 action list。
* **視覺化儀表板 (Dashboard)**：
  * **雙市場分析**：分拆台股與美股板塊輪動及頻道觀點。
  * **個股搜尋與比較**：即時查詢個股詳細資訊，並支援跨市場個股疊加比較（標準化 100 基準線）。
  * **動態數據對接**：前端直接讀取 Python 後端產生的 `report.json`，自動渲染 newsletter 與 YouTube 分析資料。
* **多通路推播**：Email 是主要輸出，Telegram Bot 摘要為可選輸出。

> Disclaimer: 產出的股票 action list 是 AI 輔助的教育性資訊，不是個人化投資建議，也不是註冊投資顧問的推薦。請自行驗證來源並評估風險。

## 🚀 快速開始

### 1. 取得必要憑證

* **Gemini API Key**: 前往 Google AI Studio 申請免費 Key。
* **Gmail SMTP**:
  1. 替寄件 Gmail 帳號開啟兩步驟驗證。
  2. 建立 Google App Password。
  3. 將寄件信箱與 App Password 放進 GitHub Secrets。
* **Telegram Bot (可選)**:
  1. 在 Telegram 搜尋 `@BotFather` 並發送 `/newbot` 取得 Token。
  2. 發送訊息給你的 Bot 後，訪問 `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` 找到你的 `chat_id`。

### 2. 設定 GitHub Secrets

將以下變數新增至你的 Repo > Settings > Secrets and variables > Actions:

* `GEMINI_API_KEY`: 你的 Google AI API Key。
* `EMAIL_SENDER`: 寄件 Gmail 地址。
* `GMAIL_APP_PASSWORD`: Gmail App Password。
* `NEWSLETTER_RECIPIENT_EMAIL`: 收件地址，例如 `jiaoao018325@gmail.com`。
* `TELEGRAM_TOKEN`: Telegram 機器人 Token，可選。
* `TELEGRAM_CHAT_ID`: 接收通知的 Chat ID，可選。

### 3. 配置 Newsletter、新聞來源與監控清單

編輯 `config.json` 設定寄送時間、股票 watchlist、RSS 新聞來源，以及想追蹤的 YouTube 頻道（支援 `@頻道名` 或頻道 ID）：

```json
{
  "newsletter": {
    "timezone": "America/Los_Angeles",
    "sendHour": 9,
    "subjectPrefix": "Daily Market Brief"
  },
  "watchlist": [
    { "ticker": "NVDA", "company": "Nvidia", "market": "us" },
    { "ticker": "2330.TW", "company": "台積電", "market": "tw" }
  ],
  "newsFeeds": [
    {
      "name": "Yahoo Finance",
      "url": "https://finance.yahoo.com/news/rssindex",
      "market": "us",
      "limit": 6
    }
  ],
  "channels": [
    { "name": "財女珍妮", "id": "@jennymarket", "market": "tw" },
    { "name": "Graham Stephan", "id": "@GrahamStephan", "market": "us" }
  ]
}
```

### 4. 本地測試與開啟 Dashboard

如果你想在本地環境執行與瀏覽：

```bash
git clone https://github.com/你的帳號/market-insights-agent.git
cd market-insights-agent
pip install -r requirements.txt

# 1. 設定環境變數 (可建立 .env 檔案)
# 2. 執行主程式抓取資料與分析，這會產生 dashboard/data/report.json
python main.py

# Dry run: 產生 newsletter 並印到 terminal，不寄信
python main.py --dry-run --force

# 3. 啟動本地靜態伺服器來瀏覽 Dashboard
cd dashboard
python -m http.server 8000
# 打開瀏覽器訪問 http://localhost:8000
```

## 🌍 如何免費發布上線 (Hosting Online)

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
   * 由於我們已經寫好了 `.github/workflows/daily_analysis.yml` 排程，每天 9:00 AM Pacific Time 執行完分析後，它會寄出 newsletter，並自動把最新的 `report.json` 與 `history.json` 推回 GitHub。
   * GitHub Pages 偵測到檔案變更，就會**自動重新部署**，你的網頁資料永遠是最新的！

## 🛠️ 技術棧

* **後端與爬蟲**: Python 3.10+, `feedparser`, `yt-dlp`, `youtube-transcript-api`
* **AI 模型**: Google Gemini (透過 `google-genai` SDK)
* **前端儀表板**: Vanilla HTML/CSS/JS (Glassmorphism 現代設計, Canvas 繪圖)
* **自動化與部署**: GitHub Actions (CI/CD) & GitHub Pages
* **通知**: Gmail SMTP, Telegram Bot API
