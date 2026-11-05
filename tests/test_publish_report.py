"""Exercise generated-file publishing with real Git, without external network."""
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "publish-report.sh"


class PublishReportTests(unittest.TestCase):
    def test_remote_source_survives_snapshot_conflict(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            remote, author, runner = (
                root / name for name in ("remote.git", "author", "runner")
            )

            def git(cwd, *args):
                return subprocess.check_output(
                    ["git", *args], cwd=cwd, stderr=subprocess.STDOUT, text=True
                )

            git(root, "init", "--bare", "--initial-branch=main", str(remote))
            git(root, "clone", str(remote), str(author))
            git(author, "config", "user.name", "Test")
            git(author, "config", "user.email", "test@example.invalid")
            (author / "dashboard/data").mkdir(parents=True)
            (author / "dashboard/data/report.json").write_text('{"version":0}')
            (author / "history.json").write_text('["base"]')
            (author / "source.py").write_text("old source")
            git(author, "add", ".")
            git(author, "commit", "-m", "base")
            git(author, "push", "origin", "main")
            git(root, "clone", str(remote), str(runner))

            (author / "dashboard/data/report.json").write_text('{"version":1}')
            (author / "history.json").write_text('["base","remote-video"]')
            (author / "source.py").write_text("new source")
            git(author, "add", ".")
            git(author, "commit", "-m", "upstream change")
            git(author, "push", "origin", "main")
            (runner / "dashboard/data/report.json").write_text('{"version":2}')
            (runner / "history.json").write_text('["base","local-video"]')
            subprocess.run(
                ["bash", str(SCRIPT)],
                cwd=runner,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
            )
            self.assertEqual(
                json.loads(git(remote, "show", "main:dashboard/data/report.json")),
                {"version": 2},
            )
            self.assertEqual(git(remote, "show", "main:source.py"), "new source")
            self.assertEqual(
                set(json.loads(git(remote, "show", "main:history.json"))),
                {"base", "remote-video", "local-video"},
            )
