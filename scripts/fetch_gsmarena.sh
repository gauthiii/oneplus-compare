#!/bin/bash
# Refresh the cached GSMArena pages used by build_data.py.
# Keeps every OnePlus phone announced from the OnePlus 9 (Mar 2021) onward; skips tablets, watches and unannounced models.
# GSMArena rate-limits (HTTP 429): the script backs off and can simply be re-run; cached pages are skipped.
set -u
cd "$(dirname "$0")"; mkdir -p cache/specs
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
: > cache/list.html
for p in "oneplus-phones-95.php" "oneplus-phones-f-95-0-p2.php" "oneplus-phones-f-95-0-p3.php"; do
  curl -sL -A "$UA" "https://www.gsmarena.com/$p" >> cache/list.html; sleep 3
done
grep -o '<li><a href="oneplus[^"]*"><img src=[^ ]* title="[^"]*' cache/list.html \
  | grep -v -E 'Not announced|Rumored|Cancelled|tablet|watch' \
  | sed -E 's/<li><a href="([^"]*)".*/\1/' \
  | sed -n '1,/^oneplus_9r-10807.php$/p' | grep -v -E 'oneplus_pad|watch' > cache/urls.txt
echo "$(wc -l < cache/urls.txt) phones in list"
while read u; do
  [ -s "cache/specs/$u" ] && continue
  code=$(curl -sL -A "$UA" "https://www.gsmarena.com/$u" -o "cache/specs/$u" -w "%{http_code}")
  echo "$code $u"
  [ "$code" != "200" ] && { rm -f "cache/specs/$u"; sleep 120; }
  sleep 20
done < cache/urls.txt
echo "Done. Now run: python3 scripts/build_data.py"
