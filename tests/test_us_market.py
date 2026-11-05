import unittest
from datetime import datetime, timezone
from market_insights.us_market import parse_chart, parse_news


class USMarketTests(unittest.TestCase):
    def test_missing_close_does_not_shift_ohlc(self):
        payload = {
            "chart": {
                "result": [
                    {
                        "timestamp": [1793716200, 1793802600, 1793889000],
                        "indicators": {
                            "quote": [
                                {
                                    "close": [100, None, 110],
                                    "open": [99, 0, 105],
                                    "high": [101, 0, 111],
                                    "low": [98, 0, 104],
                                    "volume": [1000, None, 2000],
                                }
                            ]
                        },
                    }
                ]
            }
        }
        row = parse_chart(payload, "AAPL")
        self.assertEqual((row["price"], row["open"], row["pct"]), (110, 105, 10))
        self.assertEqual(len(row["sparkline"]), len(row["dateKeys"]))

    def test_news_filters_future_stale_and_unsafe_links(self):
        def item(title, url, date):
            return f"<item><title>{title}</title><link>{url}</link><pubDate>{date}</pubDate></item>"

        xml = (
            "<rss><channel>"
            + "".join(
                [
                    item(
                        "Current",
                        "https://www.wsj.com/a",
                        "Thu, 05 Nov 2026 10:00:00 GMT",
                    ),
                    item(
                        "Duplicate",
                        "https://www.wsj.com/a",
                        "Thu, 05 Nov 2026 10:00:00 GMT",
                    ),
                    item(
                        "Unsafe", "javascript:alert(1)", "Thu, 05 Nov 2026 10:00:00 GMT"
                    ),
                    item(
                        "Future",
                        "https://www.wsj.com/b",
                        "Fri, 06 Nov 2026 10:00:00 GMT",
                    ),
                    item(
                        "Old", "https://www.wsj.com/c", "Thu, 01 Oct 2026 10:00:00 GMT"
                    ),
                ]
            )
            + "</channel></rss>"
        )
        rows = parse_news(xml, datetime(2026, 11, 5, 12, tzinfo=timezone.utc))
        self.assertEqual([r["title"] for r in rows], ["Current"])
