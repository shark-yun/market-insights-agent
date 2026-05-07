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
model = genai.GenerativeModel('gemini-1.5-flash')




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
    symbols = {
        'TWII':  { 'label': '台灣加權指數', 'market': 'tw' },
        'GSPC':  { 'label': 'S&P 500',      'market': 'us' },
        'IXIC':  { 'label': 'NASDAQ',       'market': 'us' },
        'DJI':   { 'label': 'DOW JONES',    'market': 'us' },
        'VIX':   { 'label': 'VIX',          'market': 'us' },
    }
    indices = {}
    for sym, meta in symbols.items():
        try:
            ticker = yf.Ticker(f'^{sym}')
            hist = ticker.history(period='5d', interval='1d')
            if hist.empty:
                continue
            latest = hist.iloc[-1]
            prev   = hist.iloc[-2] if len(hist) >= 2 else hist.iloc[-1]
            price  = round(float(latest['Close']), 2)
            change = round(float(latest['Close'] - prev['Close']), 2)
            pct    = round(float((latest['Close'] - prev['Close']) / prev['Close'] * 100), 2)
            # 抓 30 天日線資料當走勢圖使用
            hist30 = ticker.history(period='30d', interval='1d')
            sparkline = [round(float(v), 2) for v in hist30['Close'].tolist()]
            indices[sym] = {
                'label':     meta['label'],
                'market':    meta['market'],
                'price':     price,
                'change':    change,
                'pct':       pct,
                'sparkline': sparkline,
            }
            print(f"📈 {meta['label']}: {price} ({'+' if pct >= 0 else ''}{pct}%)")
        except Exception as e:
            print(f"⚠️  無法取得 {sym} 資料: {e}")
    return indices

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
        ytt = YouTubeTranscriptApi()

        # 先列出可用字幕
        transcript_list = ytt.list(video_id)
        print("available transcripts:")
        for t in transcript_list:
            print(
                t.language,
                t.language_code,
                "generated=",
                t.is_generated
            )

        # 優先繁中，再英文
        transcript = transcript_list.find_transcript(['zh-TW', 'zh-HK', 'zh-Hans', 'en'])
        data = transcript.fetch()

        return " ".join([x.text for x in data])

    except Exception as e:
        return f"(系統提示: 無法取得此影片字幕 - {repr(e)})"

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

    # 輸出 Dashboard JSON
    report_data = {
        "generatedAt": datetime.now(tw_tz).isoformat(),
        "date": today,
        "indices": market_indices,
        "channels": final_channels
    }

    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Dashboard 報告已更新: {report_path}")

    # 推送 Telegram
    send_telegram_msg(full_report)

if __name__ == "__main__":
    main()