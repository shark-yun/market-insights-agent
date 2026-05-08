import argparse
import hashlib
import html
import json
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any
from zoneinfo import ZoneInfo

import feedparser
import google.generativeai as genai
import requests
import yt_dlp
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi


BASE_DIR = os.path.dirname(__file__)
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
HISTORY_PATH = os.path.join(BASE_DIR, "history.json")
REPORT_PATH = os.path.join(BASE_DIR, "dashboard", "data", "report.json")

DEFAULT_TIMEZONE = "America/Los_Angeles"
DEFAULT_MODEL = "gemini-2.5-flash"
MAX_ITEMS_FOR_ANALYSIS = 20


def load_json_file(path: str, fallback: Any) -> Any:
    if not os.path.exists(path):
        return fallback

    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError):
        return fallback


def write_json_file(path: str, payload: Any) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)


def stable_id(*parts: str) -> str:
    raw = "|".join(part.strip() for part in parts if part)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate the daily market insights newsletter.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Render the newsletter and print it instead of sending email or Telegram.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Ignore the local-hour schedule gate when ENFORCE_LOCAL_HOUR is enabled.",
    )
    return parser.parse_args()


def load_config() -> dict[str, Any]:
    config = load_json_file(CONFIG_PATH, {})
    config.setdefault("newsletter", {})
    config.setdefault("channels", [])
    config.setdefault("newsFeeds", [])
    config.setdefault("watchlist", [])
    return config


def should_skip_for_schedule(config: dict[str, Any], force: bool) -> bool:
    if force:
        return False

    enforce = os.getenv("ENFORCE_LOCAL_HOUR", "").lower() in {"1", "true", "yes"}
    if not enforce:
        return False

    newsletter = config.get("newsletter", {})
    timezone_name = newsletter.get("timezone", DEFAULT_TIMEZONE)
    target_hour = int(newsletter.get("sendHour", 9))
    now = datetime.now(ZoneInfo(timezone_name))
    if now.hour == target_hour:
        return False

    print(f"Skipping send: local time is {now:%Y-%m-%d %H:%M %Z}, target hour is {target_hour}:00.")
    return True


def get_latest_video(channel_id: str) -> tuple[str | None, str | None]:
    handle = channel_id if channel_id.startswith("@") else f"@{channel_id}"
    url = f"https://www.youtube.com/{handle}/videos"
    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "no_warnings": True,
        "playlist_items": "1",
    }

    try:
        print(f"Fetching latest YouTube video for {handle}...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(url, download=False)
        entries = result.get("entries", []) if isinstance(result, dict) else []
        if not entries:
            return None, None

        latest = entries[0]
        return latest.get("id"), latest.get("title")
    except Exception as exc:
        print(f"YouTube fetch failed for {handle}: {exc}")
        return None, None


def get_transcript(video_id: str) -> str:
    try:
        transcript = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=["zh-TW", "zh-HK", "zh-Hans", "en"],
        )
        return " ".join(item["text"] for item in transcript)
    except Exception as exc:
        return f"Transcript unavailable: {exc}"


def fetch_youtube_items(channels: list[dict[str, Any]], history: dict[str, Any]) -> list[dict[str, Any]]:
    processed_videos = set(history.get("youtubeVideos", []))
    items: list[dict[str, Any]] = []

    for channel in channels:
        video_id, title = get_latest_video(channel.get("id", ""))
        if not video_id or not title:
            continue

        if video_id in processed_videos:
            print(f"Skipping previously analyzed video: {title}")
            continue

        transcript = get_transcript(video_id)
        items.append(
            {
                "id": f"youtube:{video_id}",
                "type": "youtube",
                "source": channel.get("name", "YouTube"),
                "market": channel.get("market", "global"),
                "title": title,
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "published": "",
                "summary": transcript[:4000],
                "videoId": video_id,
            }
        )

    return items


def fetch_rss_items(feeds: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    for feed in feeds:
        url = feed.get("url")
        if not url:
            continue

        limit = int(feed.get("limit", 5))
        source_name = feed.get("name", url)
        print(f"Fetching RSS feed: {source_name}")

        try:
            parsed = feedparser.parse(url)
        except Exception as exc:
            print(f"RSS fetch failed for {source_name}: {exc}")
            continue

        for entry in parsed.entries[:limit]:
            title = getattr(entry, "title", "").strip()
            link = getattr(entry, "link", "").strip()
            if not title and not link:
                continue

            summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
            published = getattr(entry, "published", "") or getattr(entry, "updated", "")
            items.append(
                {
                    "id": f"rss:{stable_id(source_name, title, link)}",
                    "type": "rss",
                    "source": source_name,
                    "market": feed.get("market", "global"),
                    "title": title,
                    "url": link,
                    "published": published,
                    "summary": html.unescape(summary)[:1500],
                }
            )

    return items


def dedupe_items(items: list[dict[str, Any]], max_items: int = MAX_ITEMS_FOR_ANALYSIS) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []

    for item in items:
        key = item.get("url") or item.get("id") or item.get("title", "")
        normalized_key = key.strip().lower()
        if not normalized_key or normalized_key in seen:
            continue

        seen.add(normalized_key)
        unique.append(item)

    return unique[:max_items]


def configure_model() -> genai.GenerativeModel:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY is required to generate market analysis.")

    genai.configure(api_key=gemini_key)
    return genai.GenerativeModel(os.getenv("GEMINI_MODEL", DEFAULT_MODEL))


def strip_json_markdown(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    if cleaned.startswith("json"):
        cleaned = cleaned[4:]
    return cleaned.strip()


def parse_json_object(text: str) -> dict[str, Any]:
    cleaned = strip_json_markdown(text)
    decoder = json.JSONDecoder()

    try:
        payload, _ = decoder.raw_decode(cleaned)
        if isinstance(payload, dict):
            return payload
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    if start == -1:
        raise json.JSONDecodeError("No JSON object found", cleaned, 0)

    payload, _ = decoder.raw_decode(cleaned[start:])
    if not isinstance(payload, dict):
        raise json.JSONDecodeError("Top-level JSON value is not an object", cleaned, start)
    return payload


def fallback_analysis(items: list[dict[str, Any]], generated_at: datetime) -> dict[str, Any]:
    return {
        "marketPulse": {
            "tone": "neutral",
            "summary": "No confident AI market pulse was generated. Review the source links directly before acting.",
            "keyDrivers": [],
        },
        "topCatalysts": [
            {
                "headline": item.get("title", "Untitled"),
                "source": item.get("source", "Unknown"),
                "url": item.get("url", ""),
                "tickers": [],
                "sectors": [],
                "impactDirection": "neutral",
                "impactScore": 0,
                "timeHorizon": "unknown",
                "confidence": "low",
                "recommendation": "watch",
                "rationale": "Captured as a relevant market source, but the model did not produce a detailed impact view.",
                "risks": ["Verify the original source before making any investment decision."],
                "sourceEvidence": item.get("summary", "")[:280],
            }
            for item in items[:5]
        ],
        "actionList": [],
        "riskWatch": ["AI output may be incomplete or incorrect.", "This is not personalized financial advice."],
        "generatedAt": generated_at.isoformat(),
    }


def analyze_market_news(
    model: genai.GenerativeModel,
    items: list[dict[str, Any]],
    config: dict[str, Any],
    generated_at: datetime,
) -> dict[str, Any]:
    if not items:
        return fallback_analysis([], generated_at)

    compact_items = [
        {
            "id": item.get("id"),
            "type": item.get("type"),
            "source": item.get("source"),
            "market": item.get("market"),
            "title": item.get("title"),
            "url": item.get("url"),
            "published": item.get("published"),
            "summary": item.get("summary", "")[:1800],
        }
        for item in items
    ]

    prompt = f"""
You are an institutional-quality market brief writer for an individual investor.
Analyze the source items below and produce one concise daily market newsletter plan.

Rules:
- Be evidence-based. Tie every catalyst to sourceEvidence from the provided items.
- Recommendations are educational signals only, not personalized financial advice.
- Prefer practical labels: buy_candidate, watch, hold, avoid_wait.
- Use impactScore from -3 to +3 where positive is bullish and negative is bearish.
- Include confidence as low, medium, or high.
- Mention tickers only when supported by the item or obvious from the company name.
- Return strict JSON only. No markdown.

Watchlist and markets of interest:
{json.dumps(config.get("watchlist", []), ensure_ascii=False)}

Return this JSON shape:
{{
  "marketPulse": {{
    "tone": "bullish | bearish | mixed | neutral",
    "summary": "2-3 sentence pre-market overview",
    "keyDrivers": ["driver 1", "driver 2", "driver 3"]
  }},
  "topCatalysts": [
    {{
      "headline": "short headline",
      "source": "source name",
      "url": "source url",
      "tickers": ["AAPL"],
      "sectors": ["Technology"],
      "impactDirection": "bullish | bearish | mixed | neutral",
      "impactScore": 2,
      "timeHorizon": "today | this_week | multi_week | long_term",
      "confidence": "low | medium | high",
      "recommendation": "buy_candidate | watch | hold | avoid_wait",
      "rationale": "why this matters to the stock or sector",
      "risks": ["risk 1", "risk 2"],
      "sourceEvidence": "brief quote or paraphrase from the source"
    }}
  ],
  "actionList": [
    {{
      "label": "buy_candidate | watch | hold | avoid_wait",
      "ticker": "AAPL",
      "company": "Apple",
      "reason": "plain-English reason",
      "confidence": "low | medium | high",
      "risk": "main reason this could be wrong"
    }}
  ],
  "riskWatch": ["risk 1", "risk 2"],
  "generatedAt": "{generated_at.isoformat()}"
}}

Source items:
{json.dumps(compact_items, ensure_ascii=False)}
"""

    try:
        response = model.generate_content(prompt)
        analysis = parse_json_object(response.text)
        analysis.setdefault("generatedAt", generated_at.isoformat())
        return analysis
    except Exception as exc:
        print(f"Gemini analysis failed, using fallback analysis: {exc}")
        return fallback_analysis(items, generated_at)


def recommendation_label(value: str) -> str:
    labels = {
        "buy_candidate": "Buy candidate",
        "watch": "Watch",
        "hold": "Hold",
        "avoid_wait": "Avoid / wait",
    }
    return labels.get(value, value.replace("_", " ").title())


def render_text_newsletter(analysis: dict[str, Any], generated_at: datetime) -> str:
    pulse = analysis.get("marketPulse", {})
    lines = [
        f"Daily Market Brief - {generated_at:%b %d, %Y}",
        "",
        f"Market pulse: {pulse.get('tone', 'neutral')}",
        pulse.get("summary", ""),
        "",
        "Key drivers:",
    ]

    for driver in pulse.get("keyDrivers", [])[:5]:
        lines.append(f"- {driver}")

    lines.extend(["", "Top catalysts:"])
    for catalyst in analysis.get("topCatalysts", [])[:8]:
        tickers = ", ".join(catalyst.get("tickers", [])) or "No direct ticker"
        lines.extend(
            [
                f"- {catalyst.get('headline', 'Untitled')} ({catalyst.get('source', 'Unknown')})",
                f"  Tickers/sectors: {tickers}; {', '.join(catalyst.get('sectors', []))}",
                f"  Impact: {catalyst.get('impactDirection', 'neutral')} ({catalyst.get('impactScore', 0)}/3), confidence {catalyst.get('confidence', 'low')}",
                f"  Signal: {recommendation_label(catalyst.get('recommendation', 'watch'))}",
                f"  Why: {catalyst.get('rationale', '')}",
                f"  Source: {catalyst.get('url', '')}",
            ]
        )

    lines.extend(["", "Action list:"])
    action_list = analysis.get("actionList", [])
    if action_list:
        for action in action_list[:8]:
            lines.append(
                f"- {recommendation_label(action.get('label', 'watch'))}: "
                f"{action.get('ticker', '')} {action.get('company', '')} - {action.get('reason', '')} "
                f"(confidence: {action.get('confidence', 'low')}; risk: {action.get('risk', '')})"
            )
    else:
        lines.append("- No high-confidence action candidates today.")

    lines.extend(["", "Risk watch:"])
    for risk in analysis.get("riskWatch", [])[:6]:
        lines.append(f"- {risk}")

    lines.extend(
        [
            "",
            "Disclaimer: This AI-assisted newsletter is for informational and educational purposes only. "
            "It is not personalized financial advice, and it may contain errors. Do your own research before investing.",
        ]
    )
    return "\n".join(lines)


def render_html_newsletter(analysis: dict[str, Any], generated_at: datetime) -> str:
    pulse = analysis.get("marketPulse", {})

    def esc(value: Any) -> str:
        return html.escape(str(value or ""))

    catalyst_cards = []
    for catalyst in analysis.get("topCatalysts", [])[:8]:
        tickers = ", ".join(catalyst.get("tickers", [])) or "No direct ticker"
        sectors = ", ".join(catalyst.get("sectors", [])) or "No sector"
        risks = "".join(f"<li>{esc(risk)}</li>" for risk in catalyst.get("risks", [])[:3])
        catalyst_cards.append(
            f"""
            <tr>
              <td style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;display:block;margin-bottom:12px;">
                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;">{esc(catalyst.get('source'))}</div>
                <h3 style="margin:6px 0 8px;font-size:18px;color:#111827;">{esc(catalyst.get('headline'))}</h3>
                <p style="margin:0 0 8px;color:#374151;">{esc(catalyst.get('rationale'))}</p>
                <p style="margin:0 0 8px;color:#111827;"><strong>Signal:</strong> {esc(recommendation_label(catalyst.get('recommendation', 'watch')))} | <strong>Impact:</strong> {esc(catalyst.get('impactDirection'))} ({esc(catalyst.get('impactScore', 0))}/3) | <strong>Confidence:</strong> {esc(catalyst.get('confidence'))}</p>
                <p style="margin:0 0 8px;color:#374151;"><strong>Tickers:</strong> {esc(tickers)} | <strong>Sectors:</strong> {esc(sectors)}</p>
                <p style="margin:0 0 8px;color:#4b5563;"><strong>Evidence:</strong> {esc(catalyst.get('sourceEvidence'))}</p>
                <ul style="margin:0 0 8px 18px;color:#6b7280;">{risks}</ul>
                <a href="{esc(catalyst.get('url'))}" style="color:#2563eb;">Read source</a>
              </td>
            </tr>
            """
        )

    action_items = []
    for action in analysis.get("actionList", [])[:8]:
        action_items.append(
            f"""
            <li style="margin-bottom:10px;">
              <strong>{esc(recommendation_label(action.get('label', 'watch')))}: {esc(action.get('ticker'))} {esc(action.get('company'))}</strong><br>
              {esc(action.get('reason'))}<br>
              <span style="color:#6b7280;">Confidence: {esc(action.get('confidence'))}. Risk: {esc(action.get('risk'))}</span>
            </li>
            """
        )

    if not action_items:
        action_items.append("<li>No high-confidence action candidates today.</li>")

    drivers = "".join(f"<li>{esc(driver)}</li>" for driver in pulse.get("keyDrivers", [])[:5])
    risks = "".join(f"<li>{esc(risk)}</li>" for risk in analysis.get("riskWatch", [])[:6])

    return f"""<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="720" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:16px;padding:28px;">
            <tr>
              <td>
                <div style="font-size:13px;color:#6b7280;">Generated {generated_at:%b %d, %Y %I:%M %p %Z}</div>
                <h1 style="margin:8px 0 16px;font-size:28px;">Daily Market Brief</h1>
                <div style="padding:16px;background:#eff6ff;border-radius:12px;margin-bottom:20px;">
                  <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;">Market pulse: {esc(pulse.get('tone', 'neutral'))}</div>
                  <p style="margin:8px 0;color:#1f2937;">{esc(pulse.get('summary'))}</p>
                  <ul style="margin:8px 0 0 18px;color:#374151;">{drivers}</ul>
                </div>
                <h2 style="font-size:20px;margin:0 0 12px;">Top Catalysts</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">{''.join(catalyst_cards)}</table>
                <h2 style="font-size:20px;margin:20px 0 12px;">Stock Action List</h2>
                <ul style="margin:0 0 20px 18px;color:#374151;">{''.join(action_items)}</ul>
                <h2 style="font-size:20px;margin:20px 0 12px;">Risk Watch</h2>
                <ul style="margin:0 0 20px 18px;color:#374151;">{risks}</ul>
                <p style="font-size:12px;line-height:1.5;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;">
                  Disclaimer: This AI-assisted newsletter is for informational and educational purposes only.
                  It is not personalized financial advice, it is not a recommendation from a registered investment advisor,
                  and it may contain errors or outdated data. Do your own research before investing.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def send_email(subject: str, text_body: str, html_body: str, dry_run: bool) -> None:
    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("GMAIL_APP_PASSWORD") or os.getenv("gmail_app_password")
    if password:
        password = password.replace(" ", "")
    recipient = os.getenv("NEWSLETTER_RECIPIENT_EMAIL")

    if dry_run:
        print("\n--- EMAIL DRY RUN ---")
        print(f"To: {recipient or '(missing NEWSLETTER_RECIPIENT_EMAIL)'}")
        print(f"Subject: {subject}")
        print(text_body)
        return

    missing = [
        name
        for name, value in {
            "EMAIL_SENDER": sender,
            "GMAIL_APP_PASSWORD": password,
            "NEWSLETTER_RECIPIENT_EMAIL": recipient,
        }.items()
        if not value
    ]
    if missing:
        raise ValueError(f"Missing email environment variables: {', '.join(missing)}")

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message.attach(MIMEText(text_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(sender, password)
        smtp.sendmail(sender, [recipient], message.as_string())

    print(f"Newsletter email sent to {recipient}.")


def send_telegram_summary(text: str, dry_run: bool) -> None:
    token = os.getenv("TELEGRAM_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if dry_run or not token or not chat_id:
        return

    requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data={"chat_id": chat_id, "text": text[:4000]},
        timeout=10,
    )


def write_report(
    analysis: dict[str, Any],
    source_items: list[dict[str, Any]],
    generated_at: datetime,
    config: dict[str, Any],
) -> None:
    existing_report = load_json_file(REPORT_PATH, {})
    existing_channels = existing_report.get("channels", [])
    latest_youtube_channels = [
        {
            "name": item.get("source"),
            "avatar": (item.get("source") or "?")[:1],
            "date": generated_at.strftime("%Y-%m-%d"),
            "videoTitle": item.get("title"),
            "videoUrl": item.get("url"),
            "videoId": item.get("videoId"),
            "stance": "neutral",
            "stanceText": "Included in daily newsletter",
            "summary": item.get("summary", "")[:240],
            "keyPoints": [],
            "mentionedStocks": [],
            "riskWarnings": [],
            "market": item.get("market", "global"),
        }
        for item in source_items
        if item.get("type") == "youtube"
    ]
    channel_map = {channel.get("name"): channel for channel in existing_channels if channel.get("name")}
    for channel in latest_youtube_channels:
        channel_map[channel["name"]] = channel

    report_data = {
        "generatedAt": generated_at.isoformat(),
        "date": generated_at.strftime("%Y-%m-%d"),
        "newsletter": analysis,
        "sources": [
            {
                "id": item.get("id"),
                "type": item.get("type"),
                "source": item.get("source"),
                "title": item.get("title"),
                "url": item.get("url"),
                "market": item.get("market"),
                "published": item.get("published"),
            }
            for item in source_items
        ],
        # Preserve the shape the existing dashboard expects for YouTube cards.
        "channels": list(channel_map.values()),
        "watchlist": config.get("watchlist", []),
    }
    write_json_file(REPORT_PATH, report_data)
    print(f"Dashboard report updated: {REPORT_PATH}")


def update_history(history: dict[str, Any], source_items: list[dict[str, Any]]) -> None:
    video_ids = [item["videoId"] for item in source_items if item.get("videoId")]
    existing_videos = history.get("youtubeVideos", [])
    combined_videos = list(dict.fromkeys([*existing_videos, *video_ids]))
    history["youtubeVideos"] = combined_videos[-200:]
    write_json_file(HISTORY_PATH, history)


def main() -> None:
    load_dotenv()
    args = parse_args()
    dry_run = args.dry_run or os.getenv("NEWSLETTER_DRY_RUN", "").lower() in {"1", "true", "yes"}

    config = load_config()
    if should_skip_for_schedule(config, args.force):
        return

    timezone_name = config.get("newsletter", {}).get("timezone", DEFAULT_TIMEZONE)
    generated_at = datetime.now(ZoneInfo(timezone_name))
    history = load_json_file(HISTORY_PATH, {"youtubeVideos": []})

    rss_items = fetch_rss_items(config.get("newsFeeds", []))
    youtube_items = fetch_youtube_items(config.get("channels", []), history)
    source_items = dedupe_items([*rss_items, *youtube_items])
    print(f"Collected {len(source_items)} unique source items.")

    model = configure_model()
    analysis = analyze_market_news(model, source_items, config, generated_at)
    subject_prefix = config.get("newsletter", {}).get("subjectPrefix", "Daily Market Brief")
    subject = f"{subject_prefix} - {generated_at:%b %d, %Y}"
    text_body = render_text_newsletter(analysis, generated_at)
    html_body = render_html_newsletter(analysis, generated_at)

    send_email(subject, text_body, html_body, dry_run)
    send_telegram_summary(text_body, dry_run)

    if dry_run:
        print("Dry run complete. Skipped report/history writes.")
        return

    write_report(analysis, source_items, generated_at, config)
    update_history(history, source_items)


if __name__ == "__main__":
    main()
