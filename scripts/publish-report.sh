#!/usr/bin/env bash
# Only generated report/history files belong in the runner's publishing commit.
set -euo pipefail

git config user.name 'github-actions[bot]'
git config user.email 'github-actions[bot]@users.noreply.github.com'
git add dashboard/data/report.json history.json
if git diff --cached --quiet; then
  exit 0
fi
git commit -m 'auto: update market insights report'

for attempt in 1 2 3; do
  git fetch origin main
  # In a rebase, "theirs" is this run's generated snapshot. Upstream source stays intact.
  git rebase -X theirs origin/main
  python - <<'PY'
import json
import subprocess
from pathlib import Path

path = Path('history.json')
remote = json.loads(subprocess.check_output(['git', 'show', 'origin/main:history.json']))
local = json.loads(path.read_text())
path.write_text(json.dumps(list(dict.fromkeys(remote + local))[-100:], ensure_ascii=False))
PY
  git add history.json
  if ! git diff --cached --quiet; then
    git commit --amend --no-edit
  fi
  if git push origin HEAD:main; then
    exit 0
  fi
done

echo 'Unable to publish report after three concurrent-update retries.' >&2
exit 1
