import os
import json
import requests
import xml.etree.ElementTree as ET
import google.generativeai as genai
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
import yt_dlp
import yfinance as yf

# 1. 環境變數載入與檢查
load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
TG_TOKEN = os.getenv("TELEGRAM_TOKEN")
TG_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

if not GEMINI_KEY:
    raise ValueError("錯誤: 請設定 GEMINI_API_KEY 環境變數")

# 2. 設定 Gemini
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')




# import yt_dlp
# import whisper # 或使用 OpenAI API

# # 1. 下載音訊
# def download_audio(url):
#     ydl_opts = {
#         'format': 'm4a/bestaudio/best',
#         'postprocessors': [{
#             'key': 'FFmpegExtractAudio',
#             'preferredcodec': 'm4a',
#         }],
#         'outtmpl': 'temp_audio.m4a'
#     }
#     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#         ydl.download([url])

# # 2. 轉錄 (這裡以本地 Whisper 為例)
# def transcribe():
#     model = whisper.load_model("base") # 可選 base, small, medium, large
#     result = model.transcribe("temp_audio.m4a", initial_prompt="台股投資、個股分析、盤後直播")
#     return result["text"]

# # 3. 接下來將 text 丟給 Gemini 或 GPT-4 進行摘要



import yt_dlp


def fetch_market_indices():
    """
    用 yfinance 抓取大盤指數最新資料
    回傳格式供 report.json 與 Dashboard 使用
    """
    symbols_meta = {
        '^TWII': { 'key': 'TWII', 'label': '台灣加權指數', 'market': 'tw' },
        '^GSPC': { 'key': 'GSPC', 'label': 'S&P 500',      'market': 'us' },
        '^IXIC': { 'key': 'IXIC', 'label': 'NASDAQ',       'market': 'us' },
        '^DJI':  { 'key': 'DJI',  'label': 'DOW JONES',    'market': 'us' },
        '^VIX':  { 'key': 'VIX',  'label': 'VIX',          'market': 'us' },
    }
    indices = {}

    for symbol, meta in symbols_meta.items():
        try:
            print(f"🔄 正在抓取 {meta['label']} ({symbol})...")
            # 用 yf.download 比 Ticker.history 更穩定
            hist5 = yf.download(symbol, period='5d', interval='1d', progress=False)
            print(f"   5d 資料筆數: {len(hist5)}")
            if hist5.empty or len(hist5) < 1:
                print(f"   ⚠️ 無資料，跳過")
                continue

            # 取最新與前一日收盤價
            close_col = hist5['Close']
            # yf.download 可能回傳 MultiIndex columns，處理一下
            if hasattr(close_col, 'columns'):
                close_col = close_col.iloc[:, 0]
            
            latest_price = float(close_col.iloc[-1])
            prev_price = float(close_col.iloc[-2]) if len(close_col) >= 2 else latest_price
            price  = round(latest_price, 2)
            change = round(latest_price - prev_price, 2)
            pct    = round((latest_price - prev_price) / prev_price * 100, 2) if prev_price != 0 else 0.0

            # 抓取今日最高/最低
            high_col = hist5['High']
            low_col  = hist5['Low']
            if hasattr(high_col, 'columns'):
                high_col = high_col.iloc[:, 0]
                low_col  = low_col.iloc[:, 0]
            high = round(float(high_col.iloc[-1]), 2)
            low  = round(float(low_col.iloc[-1]), 2)

            # 抓 1 個月日線資料當走勢圖使用
            hist30 = yf.download(symbol, period='1mo', interval='1d', progress=False)
            spark_col = hist30['Close']
            vol_col = hist30['Volume']
            if hasattr(spark_col, 'columns'):
                spark_col = spark_col.iloc[:, 0]
                vol_col = vol_col.iloc[:, 0]
            
            sparkline = [round(float(v), 2) for v in spark_col.tolist()]
            volume_sparkline = [int(v) for v in vol_col.tolist()]
            dates = [d.strftime('%m-%d') for d in hist30.index.tolist()]

            indices[meta['key']] = {
                'label':     meta['label'],
                'market':    meta['market'],
                'price':     price,
                'change':    change,
                'pct':       pct,
                'high':      high,
                'low':       low,
                'sparkline': sparkline,
                'volume_sparkline': volume_sparkline,
                'dates': dates,
            }
            print(f"   📈 {meta['label']}: {price} ({'+' if pct >= 0 else ''}{pct}%)")
        except Exception as e:
            import traceback
            print(f"   ⚠️ 無法取得 {symbol} 資料: {e}")
            traceback.print_exc()
    
    print(f"\n📊 共成功抓取 {len(indices)} 個指數")
    return indices


def fetch_technical_indicators():
    """
    抓取關鍵股票的技術指標（MA 均線、RSI）
    """
    tickers = {
        '^TWII':  '台股加權',
        '2330.TW': '台積電',
        '2317.TW': '鴻海',
        'AAPL':   'Apple',
        'NVDA':   'NVIDIA',
        'TSLA':   'Tesla',
    }
    results = []
    for symbol, name in tickers.items():
        try:
            hist = yf.download(symbol, period='3mo', interval='1d', progress=False)
            if hist.empty or len(hist) < 20:
                continue
            close = hist['Close']
            if hasattr(close, 'columns'):
                close = close.iloc[:, 0]
            
            price = round(float(close.iloc[-1]), 2)
            ma5  = round(float(close.rolling(5).mean().iloc[-1]), 2)
            ma20 = round(float(close.rolling(20).mean().iloc[-1]), 2)
            ma60 = round(float(close.rolling(min(60, len(close))).mean().iloc[-1]), 2)
            
            # RSI 14
            delta = close.diff()
            gain = delta.where(delta > 0, 0).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            rsi = round(float((100 - (100 / (1 + rs))).iloc[-1]), 1)
            
            # 判斷信號
            if ma5 > ma20 > ma60:
                signal = 'bull'
                signal_text = '多頭排列 ↑'
            elif ma5 < ma20 < ma60:
                signal = 'bear'
                signal_text = '空頭排列 ↓'
            else:
                signal = 'neutral'
                signal_text = '整理中 ↔'

            results.append({
                'symbol': symbol.replace('.TW', '').replace('^', ''),
                'name': name,
                'price': price,
                'ma5': ma5, 'ma20': ma20, 'ma60': ma60,
                'rsi': rsi,
                'signal': signal,
                'signalText': signal_text,
            })
            print(f"   📉 {name}: RSI={rsi}, MA信號={signal_text}")
        except Exception as e:
            print(f"   ⚠️ 無法取得 {symbol} 技術指標: {e}")
    return results


def fetch_risk_indicators():
    """
    抓取風險監控指標（美元指數、公債殖利率、黃金、原油）
    """
    risk_tickers = {
        'DX-Y.NYB': { 'name': '美元指數 DXY',     'icon': '💵' },
        '^TNX':     { 'name': '美國10年期公債',   'icon': '🏦' },
        'GC=F':     { 'name': '黃金 Gold',       'icon': '🥇' },
        'CL=F':     { 'name': '原油 WTI',        'icon': '🛢️' },
    }
    results = []
    for symbol, meta in risk_tickers.items():
        try:
            hist = yf.download(symbol, period='5d', interval='1d', progress=False)
            if hist.empty:
                continue
            close = hist['Close']
            if hasattr(close, 'columns'):
                close = close.iloc[:, 0]
            price = round(float(close.iloc[-1]), 2)
            prev = float(close.iloc[-2]) if len(close) >= 2 else price
            change = round(price - prev, 2)
            pct = round((price - prev) / prev * 100, 2) if prev != 0 else 0.0
            results.append({
                'symbol': symbol,
                'name': meta['name'],
                'icon': meta['icon'],
                'price': price,
                'change': change,
                'pct': pct,
            })
            print(f"   {meta['icon']} {meta['name']}: {price} ({'+' if pct >= 0 else ''}{pct}%)")
        except Exception as e:
            print(f"   ⚠️ 無法取得 {symbol}: {e}")
    return results

def get_latest_video_id(channel_id):
    """
    精準版：直接從頻道首頁抓取最新影片，不使用搜尋以避免抓錯頻道
    """
    # 如果 channel_id 沒有 @，加上 @ (預設 YouTube handle)
    handle = channel_id if channel_id.startswith('@') else f"@{channel_id}"
    url = f"https://www.youtube.com/{handle}/videos"
    
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True,
        'playlist_items': '1', # 只拿第一部影片
    }

    try:
        print(f"🔍 正在獲取 {handle} 的最新內容...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=False)
            
            if 'entries' in result and len(result['entries']) > 0:
                latest = result['entries'][0]
                v_id = latest.get('id')
                v_title = latest.get('title')
                
                if v_id:
                    print(f"🎯 搜尋成功！找到最新影片: {v_title} (ID: {v_id})")
                    return v_id, v_title
                    
    except Exception as e:
        print(f"❌ 搜尋抓取失敗: {str(e)}")
        
    print("❌ 找不到任何影片項目")
    return None, None

def get_transcript(video_id):
    try:
        # 優先嘗試繁體中文，其次簡體與英文
        srt = YouTubeTranscriptApi.get_transcript(video_id, languages=['zh-TW', 'zh-HK', 'zh-Hans', 'en'])
        return " ".join([i['text'] for i in srt])
    except Exception as e:
        return f"(系統提示: 無法取得此影片字幕 - {str(e)})"

def analyze_finance(title, transcript):
    """分析影片內容，回傳結構化 JSON"""
    # 如果沒字幕，就只針對標題分析，或者回報資訊不足
    if "無法取得字幕" in transcript:
        return {
            "stance": "neutral",
            "stanceText": "無法判斷",
            "summary": "此影片未提供字幕，無法進行深度分析。",
            "keyPoints": [],
            "mentionedStocks": []
        }

    prompt = f"""你是一位專業的資深財經分析師。請針對以下影片內容進行深度總結。
影片標題：{title}
逐字稿內容：{transcript[:20000]}

請嚴格以下列 JSON 格式回傳（不要加任何其他文字或 markdown）：
{{
  "stance": "bull 或 bear 或 neutral",
  "stanceText": "看多/看空/中立/偏多/偏空",
  "summary": "100字以內的核心觀點摘要",
  "keyPoints": ["重點1", "重點2", "重點3"],
  "mentionedStocks": ["提到的股票代號或名稱1", "提到的股票代號或名稱2"],
  "riskWarnings": ["風險提示1", "風險提示2"]
}}"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # 清理可能的 markdown code block 包裹
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON 解析失敗，使用原始文字: {e}")
        return {
            "stance": "neutral",
            "stanceText": "待分析",
            "summary": response.text[:200] if response else "分析失敗",
            "keyPoints": [],
            "mentionedStocks": []
        }
    except Exception as e:
        return {
            "stance": "neutral",
            "stanceText": "分析失敗",
            "summary": f"Gemini 分析失敗: {str(e)}",
            "keyPoints": [],
            "mentionedStocks": []
        }

def send_telegram_msg(text):
    if not TG_TOKEN or not TG_CHAT_ID:
        print("\n--- 報告內容 (未設定 Telegram) ---\n")
        print(text)
        return

    url = f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage"
    # Telegram 限制單則 4096 字元，簡單做個切片防爆
    payload = {
        "chat_id": TG_CHAT_ID,
        "text": text[:4000],
        "parse_mode": "Markdown" # 讓報告變漂亮
    }
    requests.post(url, data=payload, timeout=10)

def main():
    from datetime import datetime, timezone, timedelta

    # 讀取路徑相對於執行路徑，GitHub Actions 執行時會在根目錄
    base_dir = os.path.dirname(__file__)
    config_path = os.path.join(base_dir, 'config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)

    # 台灣時間
    tw_tz = timezone(timedelta(hours=8))
    today = datetime.now(tw_tz).strftime('%Y-%m-%d')

    # 載入歷史紀錄 (避免重複發送相同的影片)
    history_path = os.path.join(base_dir, 'history.json')
    history = []
    if os.path.exists(history_path):
        try:
            with open(history_path, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except:
            history = []

    full_report = "📊 *今日財經影片深度重點整理*\n\n"
    dashboard_channels = []  # 給 Dashboard 用的結構化資料
    new_videos_found = False

    for channel in config['channels']:
        print(f"正在檢查頻道: {channel['name']}")
        video_id, title = get_latest_video_id(channel['id'])

        if not video_id:
            continue
            
        # 檢查是否已經處理過這部影片
        if video_id in history:
            print(f"⏩ 影片已分析過，跳過: {title}")
            continue
            
        new_videos_found = True
        print(f"✨ 發現新影片: {title}")

        transcript = get_transcript(video_id)
        analysis = analyze_finance(title, transcript)

        video_url = f"https://www.youtube.com/watch?v={video_id}"

        # 建構 Dashboard 用的頻道資料
        channel_data = {
            "name": channel['name'],
            "avatar": channel['name'][0],  # 取第一個字作為頭像文字
            "date": today,
            "videoTitle": title,
            "videoUrl": video_url,
            "videoId": video_id,
            "stance": analysis.get('stance', 'neutral'),
            "stanceText": analysis.get('stanceText', '待分析'),
            "summary": analysis.get('summary', ''),
            "keyPoints": analysis.get('keyPoints', []),
            "mentionedStocks": analysis.get('mentionedStocks', []),
            "riskWarnings": analysis.get('riskWarnings', []),
            "market": channel.get('market', 'tw')
        }
        dashboard_channels.append(channel_data)

        # Telegram 報告文字
        stance_emoji = '📈' if analysis.get('stance') == 'bull' else '📉' if analysis.get('stance') == 'bear' else '⚖️'
        full_report += f"📍 **【{channel['name']}】** {stance_emoji} {analysis.get('stanceText', '')}\n"
        full_report += f"🎥 {title}\n"
        full_report += f"📝 {analysis.get('summary', '')}\n"
        if analysis.get('keyPoints'):
            for kp in analysis['keyPoints']:
                full_report += f"  • {kp}\n"
        full_report += "\n━━━━━━━━━━━━━━━━\n\n"
        
        # 加入歷史紀錄
        history.append(video_id)

    # 如果沒有新影片，就結束執行
    if not new_videos_found:
        print("沒有新影片上傳，結束執行。")
        return

    # 保存新的歷史紀錄 (只保留最近 100 筆避免檔案過大)
    with open(history_path, 'w', encoding='utf-8') as f:
        json.dump(history[-100:], f, ensure_ascii=False)

    # 如果舊的 report.json 存在，我們要把這次的新頻道加進去，並覆蓋掉舊的同頻道紀錄
    data_dir = os.path.join(base_dir, 'dashboard', 'data')
    os.makedirs(data_dir, exist_ok=True)
    report_path = os.path.join(data_dir, 'report.json')
    
    existing_channels = []
    if os.path.exists(report_path):
        try:
            with open(report_path, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
                existing_channels = old_data.get('channels', [])
        except:
            pass
            
    # 合併頻道：用頻道名稱作為 key，保留最新的一筆
    channel_map = {c['name']: c for c in existing_channels}
    for c in dashboard_channels:
        channel_map[c['name']] = c
    
    final_channels = list(channel_map.values())

    # 抓取大盤指數
    print("\n📊 正在抓取大盤指數...")
    market_indices = fetch_market_indices()

    # 抓取技術指標
    print("\n📉 正在計算技術指標...")
    tech_indicators = fetch_technical_indicators()

    # 抓取風險指標
    print("\n⚠️ 正在抓取風險指標...")
    risk_indicators = fetch_risk_indicators()

    # 輸出 Dashboard JSON
    report_data = {
        "generatedAt": datetime.now(tw_tz).isoformat(),
        "date": today,
        "indices": market_indices,
        "technicals": tech_indicators,
        "risks": risk_indicators,
        "channels": final_channels
    }

    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Dashboard 報告已更新: {report_path}")

    # 推送 Telegram
    send_telegram_msg(full_report)

if __name__ == "__main__":
    main()