import unittest
from market_insights.market_volume import parse_market_volume, fetch_market_volume


class MarketVolumeTests(unittest.TestCase):
    def test_official_units_and_dates(self):
        payload = {
            "stat": "OK",
            "fields": ["日期", "成交股數"],
            "data": [
                ["115/11/04", "15,601,136,570"],
                ["115/11/03", "0"],
                ["bad", "NaN"],
            ],
        }
        self.assertEqual(parse_market_volume(payload), {"2026-11-04": 15601136570})

    def test_date_alignment_and_missing_day(self):
        class Response:
            def raise_for_status(self):
                pass

            def json(self):
                return {
                    "stat": "OK",
                    "fields": ["日期", "成交股數"],
                    "data": [["115/11/03", "1,000"]],
                }

        result = fetch_market_volume(
            ["2026-11-04", "2026-11-03"], get=lambda *a, **k: Response()
        )
        self.assertEqual(result, [None, 1000])

    def test_unavailable_does_not_use_other_day(self):
        import requests

        def fail(*a, **k):
            raise requests.Timeout()

        self.assertEqual(fetch_market_volume(["2026-11-04"], get=fail), [None])


if __name__ == "__main__":
    unittest.main()
