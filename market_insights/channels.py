"""Optional YouTube discovery, captions and model summaries."""
import json

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi


def get_latest_video_id(channel_id):
    """
    精準版：直接從頻道首頁抓取最新影片，不使用搜尋以避免抓錯頻道
    """
    # 如果 channel_id 沒有 @，加上 @ (預設 YouTube handle)
    handle = channel_id if channel_id.startswith("@") else f"@{channel_id}"
    url = f"https://www.youtube.com/{handle}/videos"

    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "no_warnings": True,
        "playlist_items": "1",  # 只拿第一部影片
    }

    try:
        print(f"🔍 正在獲取 {handle} 的最新內容...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=False)

            if "entries" in result and len(result["entries"]) > 0:
                latest = result["entries"][0]
                v_id = latest.get("id")
                v_title = latest.get("title")

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
        srt = YouTubeTranscriptApi().fetch(
            video_id, languages=["zh-TW", "zh-HK", "zh-Hans", "en"]
        )
        return " ".join(i.text for i in srt)
    except Exception as e:
        return f"(系統提示: 無法取得此影片字幕 - {str(e)})"


def analyze_finance(title, transcript, model=None):
    """分析影片內容，回傳結構化 JSON"""
    # 如果沒字幕，就只針對標題分析，或者回報資訊不足
    if model is None or "無法取得此影片字幕" in transcript:
        return {
            "stance": "neutral",
            "analysisStatus": "pending",
            "stanceText": "待分析",
            "summary": "模型或字幕尚未可用，保留待分析。",
            "keyPoints": [],
            "mentionedStocks": [],
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
        response = model.generate_content(
            prompt, request_options={"timeout": 45, "retry": None}
        )
        text = response.text.strip()
        # 清理可能的 markdown code block 包裹
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        analysis = json.loads(text)
        if (
            not isinstance(analysis, dict)
            or not isinstance(analysis.get("summary"), str)
            or analysis.get("stance") not in ("bull", "bear", "neutral")
        ):
            raise ValueError("Invalid analysis")
        analysis["analysisStatus"] = "complete"
        return analysis
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON 解析失敗，使用原始文字: {e}")
        return {
            "stance": "neutral",
            "stanceText": "待分析",
            "summary": response.text[:200] if response else "分析失敗",
            "keyPoints": [],
            "mentionedStocks": [],
        }
    except Exception as e:
        return {
            "stance": "neutral",
            "stanceText": "分析失敗",
            "summary": f"Gemini 分析失敗: {str(e)}",
            "keyPoints": [],
            "mentionedStocks": [],
        }
