"""Official India launch MRP (₹) for OnePlus phones, read from cached oneplus.in/<slug>/specs pages.

Returns {phone id: {"priceInr": lowest MRP, "priceInrVariant": "...", "priceInrSource": url}}.
"""
import html, os, re

PAGES = {  # oneplus.in slug -> (phone id, optional row filter)
    "9": ("oneplus_9-10747", None), "9r": ("oneplus_9r-10807", None),
    "10-pro": ("oneplus_10_pro-11234", None), "10t": ("oneplus_10t-11622", None),
    "11": ("oneplus_11-11893", None), "12": ("oneplus_12-12725", None), "12r": ("oneplus_12r-12727", None),
    "13": ("oneplus_13-13477", None), "13r": ("oneplus_13r-13548", None), "open": ("oneplus_open-12619", None),
    "nord-4": ("oneplus_nord_4-13200", None), "nord-3-5g": ("oneplus_nord_3-12135", None),
    "nord-ce-3-lite-5g": ("oneplus_nord_ce_3_lite-12198", None), "nord-2t-5g": ("oneplus_nord_2t-11517", None),
    "nord-ce-2-lite-5g": ("oneplus_nord_ce_2_lite_5g-11344", None),
}
SPLIT = {"10r": [("oneplus_10r-11445", "80W"), ("oneplus_10r_150w-11598", "150W")]}


def mrp_rows(raw):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    out = []
    for l in (x.strip() for x in t.split("\n")):
        m = re.match(r"^(.*?GB.*?)[:：]\s*₹\s?([\d,]+)", l)
        if m and "{{" not in l:
            out.append((re.sub(r"\s+", " ", m.group(1)).replace(" Storage", "").strip(), int(m.group(2).replace(",", ""))))
    return out


def india_prices(cache_dir):
    res = {}
    jobs = [(sl, pid, None) for sl, (pid, _) in PAGES.items()] + [(sl, pid, f) for sl, lst in SPLIT.items() for pid, f in lst]
    for sl, pid, flt in jobs:
        p = os.path.join(cache_dir, sl + ".html")
        if not os.path.exists(p):
            continue
        rows = [r for r in mrp_rows(open(p, encoding="utf-8").read()) if not flt or flt in r[0]]
        if rows:
            variant, price = min(rows, key=lambda r: r[1])
            res[pid] = {"priceInr": price, "priceInrVariant": re.sub(r"\s*\(.*?\)", "", variant),
                        "priceInrSource": f"https://www.oneplus.in/{sl}/specs", "priceInrKind": "OnePlus India MRP"}
    return res
