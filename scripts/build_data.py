"""Build src/data/phones.json + public/phones/*.jpg from cached GSMArena pages.

Usage:  python3 scripts/build_data.py            (after scripts/fetch_gsmarena.sh)
"""
import datetime, html, json, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "scripts", "cache")
SRC = os.path.join(CACHE, "specs")
URLS = os.path.join(CACHE, "urls.txt")
OUT = os.path.join(ROOT, "src", "data", "phones.json")
IMG_DIR = os.path.join(ROOT, "public", "phones")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"


def clean(s):
    s = re.sub(r"<br\s*/?>", "\n", s)
    s = re.sub(r"<sup>2</sup>", "²", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\r", "")
    return "\n".join(l.strip() for l in s.split("\n") if l.strip())


def parse(path, slug):
    raw = open(path, encoding="utf-8", errors="ignore").read()
    name = clean(re.search(r'data-spec="modelname">(.*?)<', raw).group(1))
    img = re.search(r'specs-photo-main">\s*<a[^>]*><img[^>]*src=([^\s>]+)', raw)
    sections = []
    for tbl in re.findall(r"<table[^>]*>(.*?)</table>", raw, re.S):
        th = re.search(r'<th[^>]*>(.*?)</th>', tbl, re.S)
        if not th:
            continue
        sec = clean(th.group(1))
        rows = []
        last = ""
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tbl, re.S):
            ttl = re.search(r'<td class="ttl">(.*?)</td>', tr, re.S)
            nfo = re.search(r'<td class="nfo"[^>]*>(.*?)</td>', tr, re.S)
            if not nfo:
                continue
            label = clean(ttl.group(1)) if ttl else ""
            val = clean(nfo.group(1))
            if not val:
                continue
            if not label:  # continuation row
                label = last
            last = label
            rows.append([label, val])
        if rows:
            sections.append({"section": sec, "rows": rows})

    def get(sec, label):
        for s in sections:
            if s["section"] == sec:
                vals = [v for l, v in s["rows"] if l == label]
                if vals:
                    return "\n".join(vals)
        return ""

    def num(pat, s, cast=float):
        m = re.search(pat, s or "")
        return cast(m.group(1)) if m else None

    disp_type = get("Display", "Type")
    disp_size = get("Display", "Size")
    disp_res = get("Display", "Resolution")
    chipset = get("Platform", "Chipset")
    mem = get("Memory", "Internal")
    battery = get("Battery", "Type")
    charging = get("Battery", "Charging")
    main_cam = ""
    for s in sections:
        if s["section"] == "Main Camera":
            main_cam = next((v for l, v in s["rows"] if l in ("Single", "Dual", "Triple", "Quad", "Five", "Penta")), "")
            cam_count = next((l for l, v in s["rows"] if l in ("Single", "Dual", "Triple", "Quad", "Five", "Penta")), "")
    selfie = ""
    for s in sections:
        if s["section"] == "Selfie camera":
            selfie = next((v for l, v in s["rows"] if l in ("Single", "Dual")), "")
    price = get("Misc", "Price")
    announced = get("Launch", "Announced")
    status = get("Launch", "Status")

    rams = sorted({int(x) for x in re.findall(r"(\d+)GB RAM", mem)})
    stor = sorted({int(x) * (1024 if u == "TB" else 1) for x, u in re.findall(r"(\d+)(GB|TB) \d+GB RAM", mem)})
    ann_year = num(r"(20\d\d)", announced, int)
    months = "January February March April May June July August September October November December".split()
    ann_month = next((i + 1 for i, m in enumerate(months) if m in announced), None)
    refresh = num(r"(\d+)Hz", disp_type, int)
    brightness = max([int(x) for x in re.findall(r"(\d+) nits", disp_type)] or [0]) or None
    usd = None
    m = re.search(r"\$\s?([\d,]+(?:\.\d+)?)", price)
    if m:
        usd = float(m.group(1).replace(",", ""))
    inr = None
    m = re.search(r"₹\s?([\d,]+)", price)
    if m:
        inr = float(m.group(1).replace(",", ""))
    wired = num(r"(\d+)W wired", charging, int)
    wireless = num(r"(\d+)W wireless", charging, int)
    ip = re.search(r"IP\d\dK?(?:/IP\d\dK?)*|IP\d\d", "\n".join(v for s in sections for l, v in s["rows"] if s["section"] == "Body"))
    soc_short = re.sub(r"^(Qualcomm|Mediatek|MediaTek)\s+((SM|MT)[\w-]+)?\s*", "", chipset.split("\n")[0])
    soc_short = re.sub(r"\s*\(.*?\)\s*$", "", soc_short).strip()
    brand = "Qualcomm" if "Snapdragon" in chipset else ("MediaTek" if re.search(r"Dimensity|Helio|Mediatek|MediaTek", chipset) else ("Unisoc" if "Unisoc" in chipset else ""))

    lname = name.lower()
    if "open" in lname:
        series = "Open"
    elif "nord ce" in lname:
        series = "Nord CE"
    elif "nord n" in lname or re.match(r"oneplus n\d", lname):
        series = "Nord N"
    elif "nord" in lname:
        series = "Nord"
    elif "ace" in lname:
        series = "Ace"
    elif "turbo" in lname:
        series = "Turbo"
    elif re.search(r"oneplus \d+(r|rt)\b", lname):
        series = "R series"
    else:
        series = "Flagship"

    # Tests (perf, battery) if present
    tests = {l: v for s in sections if s["section"] == "Tests" for l, v in s["rows"]}
    antutu = num(r"AnTuTu:\s*([\d,]+)", tests.get("Performance", "").replace(",", ""), int)

    return {
        "id": slug.replace(".php", ""),
        "name": name,
        "series": series,
        "gsmarenaUrl": f"https://www.gsmarena.com/{slug}",
        "imageSource": img.group(1) if img else None,
        "announced": announced,
        "status": status,
        "year": ann_year,
        "month": ann_month,
        "price": price,
        "priceUsd": usd,
        "priceInr": inr,
        "display": {"type": disp_type, "size": disp_size, "resolution": disp_res,
                    "inches": num(r"([\d.]+) inches", disp_size), "refresh": refresh, "peakNits": brightness,
                    "protection": get("Display", "Protection")},
        "chipset": chipset, "socShort": soc_short, "socBrand": brand,
        "cpu": get("Platform", "CPU"), "gpu": get("Platform", "GPU"),
        "os": get("Platform", "OS"),
        "memory": mem, "ramOptions": rams, "storageOptions": stor,
        "cardSlot": get("Memory", "Card slot"),
        "mainCamera": main_cam, "mainCameraCount": cam_count if main_cam else "",
        "mainCameraMp": num(r"([\d.]+) MP", main_cam),
        "cameraFeatures": get("Main Camera", "Features"), "video": get("Main Camera", "Video"),
        "selfie": selfie, "selfieMp": num(r"([\d.]+) MP", selfie),
        "battery": battery, "batteryMah": num(r"(\d{4,5}) mAh", battery, int),
        "charging": charging, "wiredW": wired, "wirelessW": wireless,
        "dimensions": get("Body", "Dimensions"), "weight": get("Body", "Weight"),
        "weightG": num(r"([\d.]+) g", get("Body", "Weight")),
        "build": get("Body", "Build"), "ipRating": ip.group(0) if ip else None,
        "colors": get("Misc", "Colors"), "models": get("Misc", "Models"),
        "nfc": get("Comms", "NFC"), "usb": get("Comms", "USB"),
        "antutu": antutu,
        "sections": sections,
    }


slugs = [l.strip() for l in open(URLS) if l.strip()]
phones = []
os.makedirs(IMG_DIR, exist_ok=True)
for slug in slugs:
    p = os.path.join(SRC, slug)
    if not os.path.exists(p):
        print("MISSING spec page:", slug)
        continue
    ph = parse(p, slug)
    if re.search(r"\bPad\b|Watch", ph["name"]):
        print("SKIP non-phone:", ph["name"])
        continue
    dest = os.path.join(IMG_DIR, ph["id"] + ".jpg")
    if ph["imageSource"] and not os.path.exists(dest):
        subprocess.run(["curl", "-sfL", "-A", UA, "-e", "https://www.gsmarena.com/", ph["imageSource"], "-o", dest], check=False)
        time.sleep(0.5)
    if not os.path.exists(dest):
        print("MISSING image:", ph["name"])
    ph["image"] = f"/phones/{ph['id']}.jpg"
    phones.append(ph)
for ph in phones:
    ph["onSale"] = not ph["status"].startswith(("Discontinued", "Cancelled"))
    ph["sourceName"], ph["sourceUrl"] = "GSMArena", ph["gsmarenaUrl"]

# Fallback: phones whose GSMArena page isn't cached come from the official OnePlus spec page
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from official_sections import official_sections
have = {ph["id"] for ph in phones}
official = json.load(open(os.path.join(ROOT, "scripts", "official_phones.json")))["phones"]
for o in official:
    if o["id"] in have:
        continue
    raw = open(os.path.join(CACHE, "official", o.pop("cache")), encoding="utf-8").read()
    dest = os.path.join(IMG_DIR, o["id"] + ".jpg")
    if not os.path.exists(dest):
        subprocess.run(["curl", "-sfL", "-A", UA, "-e", "https://www.gsmarena.com/", o["imageSource"], "-o", dest], check=False)
    if not os.path.exists(dest):
        print("MISSING image:", o["name"])
    o.update({
        "image": f"/phones/{o['id']}.jpg",
        "status": "Not on sale now",
        "onSale": False,
        "gsmarenaUrl": f"https://www.gsmarena.com/{o['id']}.php",
        "sourceName": "OnePlus official spec page",
        "sourceUrl": o.pop("officialUrl"),
        "antutu": None,
        "sections": official_sections(raw),
    })
    phones.append(o)
    print("official:", o["name"])

# ---- Prices: launch prices only (GSMArena's price field is a current listed price, kept as `price`) ----
from oneplus_in_prices import india_prices
inr = india_prices(os.path.join(CACHE, "oneplus_in"))
research_path = os.path.join(ROOT, "scripts", "oneplus_launch_prices.json")
research = json.load(open(research_path)) if os.path.exists(research_path) else {}
for ph in phones:
    ph["brand"] = "OnePlus"
    for k in ("priceInr", "priceUsd"):
        ph[k] = None
    r = research.get(ph["id"], {})
    if r.get("inr"):
        ph.update(priceInr=r["inr"], priceInrVariant=r.get("inrVariant"), priceInrSource=r.get("inrSource"), priceInrKind="Launch price (press/news)")
    if ph["id"] in inr:  # official MRP wins over research
        ph.update(inr[ph["id"]])
    if r.get("usd"):
        ph.update(priceUsd=r["usd"], priceUsdVariant=r.get("usdVariant"), priceUsdSource=r.get("usdSource"), priceUsdKind="Launch price (press/news)")
    if r.get("note"):
        ph["priceNote"] = r["note"]

# ---- iPhones from Apple Tech Specs + Apple Newsroom prices ----
from apple_specs import parse_apple
MONTHS = "January February March April May June July August September October November December".split()
apple = json.load(open(os.path.join(ROOT, "scripts", "apple_phones.json")))["phones"]
for a in apple:
    raw = open(os.path.join(CACHE, "apple", a["kb"] + ".html"), encoding="utf-8").read()
    ph = parse_apple(raw)
    img = re.search(r'<img class="gb-image alignment[^"]*"[^>]*src="([^"]+)"', raw)
    dest = os.path.join(IMG_DIR, a["id"] + ".png")
    if img and not os.path.exists(dest):
        subprocess.run(["curl", "-sfL", "-A", UA, img.group(1), "-o", dest], check=False)
        subprocess.run(["sips", "-Z", "480", dest], capture_output=True)
    if not os.path.exists(dest):
        print("MISSING image:", ph["name"])
    ph.update({
        "id": a["id"], "brand": "Apple", "series": a["series"], "year": a["year"], "month": a["month"],
        "announced": f"{a['year']}, {MONTHS[a['month'] - 1]}", "status": "", "onSale": True,
        "image": f"/phones/{a['id']}.png", "imageSource": img.group(1) if img else None,
        "price": "", "priceUsd": a["priceUsd"], "priceUsdVariant": "starting", "priceUsdSource": a["priceUsdSource"], "priceUsdKind": "Apple launch price",
        "priceInr": a["priceInr"], "priceInrVariant": "starting", "priceInrSource": a["priceInrSource"], "priceInrKind": "Apple launch price",
        "gsmarenaUrl": "", "sourceName": "Apple Tech Specs", "sourceUrl": f"https://support.apple.com/en-us/{a['kb']}", "antutu": None,
    })
    phones.append(ph)

# ---- Tap to pay ----
for ph in phones:
    n = (ph.get("nfc") or "").lower()
    if not n or n.startswith("no"):
        ph["nfcSupport"], ph["tapToPay"] = "no", None
    elif "market" in n or "region" in n:
        ph["nfcSupport"], ph["tapToPay"] = "regional", "Google Wallet (varies by region)"
    else:
        ph["nfcSupport"], ph["tapToPay"] = "yes", "Apple Pay" if ph["brand"] == "Apple" else "Google Wallet"

json.dump(phones, open(OUT, "w"), ensure_ascii=False, indent=1)
json.dump({"capturedAt": datetime.date.today().strftime("%-d %B %Y"), "source": "GSMArena"}, open(os.path.join(ROOT, "src", "data", "meta.json"), "w"))
links = os.path.join(ROOT, "src", "data", "amazon-links.json")
if not os.path.exists(links):
    json.dump({"_comment": "Optional direct product URLs: { \"<phone id>\": { \"in\": \"https://www.amazon.in/dp/...\", \"us\": \"https://www.amazon.com/dp/...\" } }"}, open(links, "w"), indent=1)
print(len(phones), "phones written to", OUT)
