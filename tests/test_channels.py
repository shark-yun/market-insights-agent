import unittest
from market_insights.channels import parse_today_video, channel_report


class ChannelTests(unittest.TestCase):
    def feed(self, channel="UCexample", stamp="2026-11-04T16:30:00Z"):
        return f"""<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015">
        <yt:channelId>example</yt:channelId><entry><yt:channelId>{channel}</yt:channelId>
        <yt:videoId>abcdefghijk</yt:videoId><title>AI與費半</title><published>{stamp}</published></entry></feed>"""

    def test_taipei_day_and_stripped_feed_id(self):
        video = parse_today_video(self.feed(), "UCexample", "2026-11-05")
        self.assertEqual(video["date"], "2026-11-05")
        self.assertIsNone(parse_today_video(self.feed(), "UCexample", "2026-11-04"))

    def test_wrong_channel_is_not_loaded(self):
        self.assertIsNone(
            parse_today_video(self.feed(channel="UCother"), "UCexample", "2026-11-05")
        )

    def test_source_is_retained_without_model(self):
        video = parse_today_video(self.feed(), "UCexample", "2026-11-05")
        result = channel_report({"name": "Test"}, video, {})
        self.assertEqual(result["analysisStatus"], "pending")
        self.assertEqual(result["summaryType"], "title_only")
        self.assertIn("不代表講者", result["summary"])
        self.assertEqual(result["videoId"], "abcdefghijk")
