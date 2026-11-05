"""Scheduled report entry point: collect evidence, summarize, publish JSON."""
import json
import os
from functools import partial

from dotenv import load_dotenv

from market_insights.channels import (
    get_today_video,
    channel_report,
    get_transcript,
    analyze_finance,
)
from market_insights.collectors import (
    fetch_market_indices,
    fetch_technical_indicators,
    fetch_risk_indicators,
    fetch_twse_sectors,
    fetch_twse_institutional,
    fetch_twse_institutional_flow,
)
from market_insights.llm import create_model, generate_strategy
from market_insights.reporting import sanitize_report, send_telegram_msg
from market_insights.strategy import build_strategy
from market_insights.us_market import fetch_us_market


def main():
    from datetime import datetime, timezone, timedelta

    load_dotenv()
    model = create_model(os.getenv("GEMINI_API_KEY"))

    # 讀取路徑相對於執行路徑，GitHub Actions 執行時會在根目錄
    base_dir = os.path.dirname(__file__)
    config_path = os.path.join(base_dir, "config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    # 台灣時間
    tw_tz = timezone(timedelta(hours=8))
    today = datetime.now(tw_tz).strftime("%Y-%m-%d")

    # 載入歷史紀錄 (避免重複發送相同的影片)
    history_path = os.path.join(base_dir, "history.json")
    history = []
    if os.path.exists(history_path):
        try:
            with open(history_path, "r", encoding="utf-8") as f:
                history = json.load(f)
        except (OSError, ValueError, TypeError):
            history = []

    full_report = "📊 *今日財經影片深度重點整理*\n\n"
    dashboard_channels = []  # 給 Dashboard 用的結構化資料
    new_videos_found = False

    # YouTube channel analysis (optional)
    if config.get("enable_youtube_analysis", True):
        for channel in config["channels"]:
            if not channel.get("enabled", True):
                continue
            print(f"正在檢查頻道: {channel['name']}")
            try:
                video = get_today_video(channel["channel_id"], today)
            except Exception as error:
                print(f"頻道來源暫不可用: {channel['name']} ({type(error).__name__})")
                continue
            if not video:
                continue
            video_id, title = video["videoId"], video["videoTitle"]
            if video_id in history:
                continue
            new_videos_found = True
            transcript = get_transcript(video_id)
            analysis = analyze_finance(title, transcript, model)
            dashboard_channels.append(channel_report(channel, video, analysis))

            # Telegram 報告文字
            stance_emoji = (
                "📈"
                if analysis.get("stance") == "bull"
                else "📉"
                if analysis.get("stance") == "bear"
                else "⚖️"
            )
            full_report += f"📍 **【{channel['name']}】** {stance_emoji} {analysis.get('stanceText', '')}\n"
            full_report += f"🎥 {title}\n"
            full_report += f"📝 {analysis.get('summary', '')}\n"
            if analysis.get("keyPoints"):
                for kp in analysis["keyPoints"]:
                    full_report += f"  • {kp}\n"
            full_report += "\n━━━━━━━━━━━━━━━━\n\n"

            # 加入歷史紀錄
            if analysis.get("analysisStatus") == "complete":
                history.append(video_id)
    else:
        # YouTube analysis disabled; keep report empty
        new_videos_found = False

    # 如果有新影片，保存歷史紀錄
    if new_videos_found:
        print(f"✨ 發現 {len(dashboard_channels)} 部新影片，保存歷史紀錄並準備發送 Telegram 通知。")
        with open(history_path, "w", encoding="utf-8") as f:
            json.dump(history[-100:], f, ensure_ascii=False)
    else:
        print("ℹ️ 沒有發現新影片上傳，但將繼續更新每日大盤與三大法人數據。")

    # 確保 dashboard 目錄結構存在
    data_dir = os.path.join(base_dir, "dashboard", "data")
    os.makedirs(data_dir, exist_ok=True)
    report_path = os.path.join(data_dir, "report.json")

    existing_channels = []
    if os.path.exists(report_path):
        try:
            with open(report_path, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                existing_channels = old_data.get("channels", [])
        except (OSError, ValueError, TypeError):
            pass

    # 合併頻道：用頻道名稱作為 key，保留最新的一筆
    channel_map = {c["name"]: c for c in existing_channels}
    for c in dashboard_channels:
        channel_map[c["name"]] = c

    final_channels = list(channel_map.values())

    # 抓取大盤指數
    print("\n📊 正在抓取大盤指數...")
    market_indices = fetch_market_indices()
    us_market = fetch_us_market()
    market_indices.update(us_market.pop("indices"))

    # 抓取技術指標
    print("\n📉 正在計算技術指標...")
    tech_indicators = fetch_technical_indicators()

    # 抓取風險指標
    print("\n⚠️ 正在抓取風險指標...")
    risk_indicators = fetch_risk_indicators()

    # 抓取板塊漲跌
    print("\n🌡️ 正在抓取板塊輪動...")
    sectors = fetch_twse_sectors()

    # 抓取三大法人買賣超
    print("\n🏦 正在抓取三大法人資料...")
    institutional = fetch_twse_institutional()

    # 抓取三大法人買賣超金額
    print("\n💰 正在抓取三大法人買賣超金額...")
    institutional_flow = fetch_twse_institutional_flow()

    # 輸出 Dashboard JSON
    report_data = {
        "generatedAt": datetime.now(tw_tz).isoformat(),
        "date": today,
        "indices": market_indices,
        "usMarket": us_market,
        "technicals": tech_indicators,
        "risks": risk_indicators,
        "sectors": sectors,
        "institutional": institutional,
        "institutional_flow": institutional_flow,
        "channels": final_channels,
    }

    report_data = sanitize_report(report_data)
    report_data["strategy"] = build_strategy(
        report_data,
        partial(generate_strategy, model)
        if model and config.get("enable_strategy_analysis", True)
        else None,
        "disabled" if not config.get("enable_strategy_analysis", True) else "no_key",
    )

    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(
            sanitize_report(report_data),
            f,
            ensure_ascii=False,
            indent=2,
            allow_nan=False,
        )
    print(f"✅ Dashboard 報告已更新: {report_path}")

    # 如果有新影片，才推送 Telegram
    if new_videos_found and config.get("enable_telegram_notifications", False):
        send_telegram_msg(
            full_report, os.getenv("TELEGRAM_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
        )


if __name__ == "__main__":
    main()
