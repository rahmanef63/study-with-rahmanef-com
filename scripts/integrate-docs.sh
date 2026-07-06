#!/usr/bin/env bash
# Run from the repo root on Rahman's machine (Windows git reads correct bytes).
set -euo pipefail
git pull --ff-only origin main
git add -A
git commit -F docs/commits/7-alpha-docs.txt
git push origin main
echo "=== done ==="
git log --oneline -3
