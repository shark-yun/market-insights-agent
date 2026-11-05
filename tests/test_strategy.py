import json
import unittest
from market_insights.strategy import build_strategy


class StrategyTests(unittest.TestCase):
    def setUp(self):
        self.report = {
            "generatedAt": "2026-11-04T10:00:00+08:00",
            "indices": {"TWII": {"price": 100, "pct": 1}},
            "technicals": [],
            "channels": [],
        }

    def test_without_key_keeps_metrics(self):
        result = build_strategy(self.report)
        self.assertEqual(result["agents"]["fundamental"]["reason"], "no_key")
        self.assertEqual(
            result["agents"]["fundamental"]["metrics"][0]["value"], "100.00"
        )
        self.assertIsNone(result["agents"]["fundamental"]["score"])
        self.assertEqual(result["agents"]["sentiment"]["reason"], "missing_sources")

    def test_quota_does_not_break_report(self):
        def unavailable(prompt):
            raise RuntimeError("429 quota")

        result = build_strategy(self.report, unavailable)
        self.assertEqual(result["agents"]["fundamental"]["reason"], "quota")
        self.assertEqual(result["agents"]["fundamental"]["status"], "pending")
        json.dumps(result, allow_nan=False)

    def test_valid_partial_result(self):
        def generate(prompt):
            return json.dumps(
                {
                    "fundamental": {
                        "score": 55,
                        "comment": "資料有限",
                        "recommendation": "觀察資料",
                        "rationale": "行情快照",
                        "horizon": "當日",
                    }
                }
            )

        result = build_strategy(self.report, generate)
        self.assertEqual(result["agents"]["fundamental"]["score"], 55)
        self.assertEqual(result["agents"]["fundamental"]["status"], "partial")
        self.assertEqual(result["fusion"]["status"], "pending")

    def test_invalid_response_not_a_score(self):
        result = build_strategy(self.report, lambda p: '{"fundamental":{"score":true}}')
        self.assertEqual(result["agents"]["fundamental"]["reason"], "invalid_response")
        self.assertIsNone(result["agents"]["fundamental"]["score"])

    def test_missing_sources_skips_model(self):
        def unexpected(prompt):
            self.fail("No evidence must not call model")

        result = build_strategy({}, unexpected)
        self.assertEqual(result["agents"]["fundamental"]["reason"], "missing_sources")


if __name__ == "__main__":
    unittest.main()
