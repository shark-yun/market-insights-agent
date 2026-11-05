"""Public US market snapshots and publisher RSS. No LLM required."""
import math
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from urllib.parse import quote, urlparse
import requests
from defusedxml import ElementTree
from defusedxml.common import DefusedXmlException

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; MarketInsights/1.0)"}
SECTORS = {
    "XLK": "Technology",
    "XLV": "Healthcare",
    "XLF": "Financials",
    "XLE": "Energy",
    "XLY": "Consumer",
    "XLI": "Industrials",
    "XLB": "Materials",
    "XLRE": "Real Estate",
    "XLU": "Utilities",
    "XLC": "Comm Svc",
    "XLP": "Consumer Staples",
}
STOCKS = {
    "AAPL": ("Apple Inc.", "Technology"),
    "NVDA": ("NVIDIA Corp.", "Technology"),
    "TSLA": ("Tesla Inc.", "Consumer"),
    "MSFT": ("Microsoft Corp.", "Technology"),
    "AMZN": ("Amazon.com", "Consumer"),
}
INDEXES = {
    "^GSPC": ("GSPC", "S&P 500"),
    "^IXIC": ("IXIC", "NASDAQ"),
    "^DJI": ("DJI", "DOW JONES"),
    "^VIX": ("VIX", "VIX"),
}
NEWS_FEED = "https://feeds.content.dowjones.io/public/rss/RSSMarketsMain"


def number(value):
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def parse_chart(payload, symbol):
    data = payload["chart"]["result"][0]
    series = data["indicators"]["quote"][0]
    rows = [
        (i, t, v)
        for i, (t, v) in enumerate(zip(data["timestamp"], series["close"]))
        if number(v)
    ]
    if len(rows) < 2:
        raise ValueError("Need two valid sessions")
    index, stamp, price = rows[-1]
    previous = rows[-2][2]
    from zoneinfo import ZoneInfo

    zone = ZoneInfo("America/New_York")
    dates = [datetime.fromtimestamp(t, zone).date().isoformat() for _, t, _ in rows]

    def field(name):
        values = series.get(name, [])
        value = values[index] if len(values) > index else None
        return round(value, 2) if number(value) else None

    return {
        "symbol": symbol,
        "market": "us",
        "price": round(price, 2),
        "change": round(price - previous, 2),
        "pct": round((price / previous - 1) * 100, 2) if previous else 0,
        "open": field("open"),
        "high": field("high"),
        "low": field("low"),
        "volume": field("volume"),
        "marketDate": dates[-1],
        "asOf": datetime.fromtimestamp(stamp, timezone.utc).isoformat(),
        "sourceUrl": "https://finance.yahoo.com/quote/" + quote(symbol, safe="") + "/",
        "sparkline": [round(v, 2) for _, _, v in rows],
        "dateKeys": dates,
        "dates": [d[5:] for d in dates],
    }


def fetch_snapshot(symbol, get=requests.get):
    response = get(
        "https://query1.finance.yahoo.com/v8/finance/chart/" + quote(symbol, safe=""),
        params={"range": "1mo", "interval": "1d"},
        headers=HEADERS,
        timeout=15,
    )
    response.raise_for_status()
    return parse_chart(response.json(), symbol)


def parse_news(xml, now=None):
    now = now or datetime.now(timezone.utc)
    result = []
    seen = set()
    for item in ElementTree.fromstring(xml).findall(".//item"):
        title, url = (
            item.findtext("title", "").strip(),
            item.findtext("link", "").strip(),
        )
        try:
            published = parsedate_to_datetime(item.findtext("pubDate", "")).astimezone(
                timezone.utc
            )
        except (TypeError, ValueError):
            continue
        if (
            not title
            or url in seen
            or urlparse(url).scheme != "https"
            or urlparse(url).hostname not in ("www.wsj.com", "wsj.com")
        ):
            continue
        if not now - timedelta(days=7) <= published <= now + timedelta(minutes=5):
            continue
        seen.add(url)
        # Display headlines only; article text stays on the publisher's website.
        result.append(
            {
                "title": title[:300],
                "url": url,
                "source": "The Wall Street Journal",
                "publishedAt": published.isoformat(),
            }
        )
    return sorted(result, key=lambda x: x["publishedAt"], reverse=True)[:8]


def fetch_us_market(get=requests.get):
    indices, sectors, stocks = {}, [], []
    for symbol in [*INDEXES, *SECTORS, *STOCKS]:
        try:
            row = fetch_snapshot(symbol, get)
            if symbol in INDEXES:
                key, label = INDEXES[symbol]
                row["label"] = label
                indices[key] = row
            elif symbol in SECTORS:
                row["name"] = SECTORS[symbol]
                sectors.append(row)
            else:
                row["ticker"] = symbol
                row["name"], row["sector"] = STOCKS[symbol]
                stocks.append(row)
        except (requests.RequestException, ValueError, KeyError, IndexError, TypeError):
            print(f"US snapshot unavailable: {symbol}")
    news = []
    try:
        response = get(NEWS_FEED, headers=HEADERS, timeout=15)
        response.raise_for_status()
        news = parse_news(response.content)
    except (
        requests.RequestException,
        ValueError,
        ElementTree.ParseError,
        DefusedXmlException,
    ):
        print("US publisher feed unavailable; leaving news empty.")
    return {
        "indices": indices,
        "sectors": sectors,
        "stocks": stocks,
        "news": news,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "newsSourceUrl": NEWS_FEED,
    }
