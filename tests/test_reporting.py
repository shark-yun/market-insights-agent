import json
import unittest
from market_insights.reporting import sanitize_report
from market_insights.strategy import build_strategy


class ReportingTests(unittest.TestCase):
    def test_nonfinite_nested_data_is_strict_json(self):
        data = sanitize_report({"price": float("nan"), "rows": [float("inf"), 2]})
        self.assertEqual(data, {"price": None, "rows": [None, 2]})
        json.dumps(data, allow_nan=False)

    def test_rule_observations_do_not_require_model(self):
        report = {
            "indices": {"TWII": {"price": 90}, "VIX": {"price": 25, "pct": 10}},
            "technicals": [
                {
                    "symbol": "TWII",
                    "price": 90,
                    "ma5": 95,
                    "ma20": 100,
                    "ma60": 110,
                    "rsi": 20,
                }
            ],
        }
        result = build_strategy(report)
        self.assertIn("下方 10.00%", result["agents"]["fundamental"]["observation"])
        self.assertIn("波動預期升高", result["agents"]["sentiment"]["observation"])
        self.assertIsNone(result["agents"]["sentiment"]["score"])
