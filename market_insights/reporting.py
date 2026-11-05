"""Strict JSON output helpers and optional Telegram delivery."""
import math

import requests


def sanitize_report(value):
    """Keep external missing numeric values out of JSON's nonstandard NaN syntax."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: sanitize_report(item) for key, item in value.items()}
    if isinstance(value, list):
        return [sanitize_report(item) for item in value]
    return value


def send_telegram_msg(text, token=None, chat_id=None):
    if not token or not chat_id:
        print("\n--- 報告內容 (未設定 Telegram) ---\n")
        print(text)
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    # Telegram 限制單則 4096 字元，簡單做個切片防爆
    payload = {
        "chat_id": chat_id,
        "text": text[:4000],
        "parse_mode": "Markdown",  # 讓報告變漂亮
    }
    requests.post(url, data=payload, timeout=10)
