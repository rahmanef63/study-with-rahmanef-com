#!/usr/bin/env bash
# Wave v1.1 integration commits — run from the repo root on Rahman's machine
# (Windows git reads the correct bytes; the Cowork sandbox's mount view was
# unreliable for git during this review — see docs/STATUS.md drift log).
set -euo pipefail

git add slices/tenants convex/features/tenants
git commit -F docs/commits/1-beta.txt

git add slices/resources convex/features/resources
git commit -F docs/commits/2-epsilon.txt

git add slices/quiz convex/features/quiz
git commit -F docs/commits/3-gamma.txt

git add slices/profiles convex/features/profiles
git commit -F docs/commits/4-delta.txt

git add slices/announcements convex/features/announcements
git commit -F docs/commits/5-zeta.txt

# alpha: app mounts, _generated, docs, this script + messages (self-inclusive)
git add -A
git commit -F docs/commits/6-alpha.txt

echo ""
echo "=== wave v1.1 committed ==="
git log --oneline -7
echo ""
echo "Sekarang: git push origin main"
