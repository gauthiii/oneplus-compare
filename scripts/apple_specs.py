"""Parse Apple's iPhone Tech Specs pages (support.apple.com/en-us/<kb>) into the site's Phone shape.

Apple does not publish battery mAh, RAM or wired charging wattage, and it states a refresh rate only for
ProMotion (120Hz) displays, so those fields stay null. Everything else is read from the page text.
"""
import html, re

FOOTNOTE = re.compile(r"^(\d{1,2}|\*|:|with|\))$")


def page_sections(raw):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    t = re.sub(r"<sup[^>]*>.*?</sup>", "", t, flags=re.S)  # footnote markers
    t = re.sub(r"<h([1-4])[^>]*>", lambda m: f"\n##H{m.group(1)} ", t)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t)).replace("\xa0", " ").replace("‑", "-")
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    title = next((l[5:] for l in lines if l.startswith("##H1")), "")
    name = re.sub(r"\s*-\s*Tech(nical)? Spec(ification)?s\s*$", "", title).strip()
    year = next((int(m.group(1)) for l in lines for m in [re.search(r"Year introduced:\s*(\d{4})", l)] if m), None)
    secs, cur = [], None
    for l in lines:
        if l.startswith("##H3"):
            cur = {"section": l[5:].strip(), "rows": []}
            secs.append(cur)
            continue
        if l.startswith("##H") or cur is None:
            continue
        if l in ("Apple Footer", "Helpful?") or l.startswith("Copyright"):
            break
        if re.fullmatch(r"\d{1,2}|\*", l):
            continue
        rows = cur["rows"]
        # Join "Label:" + value lines and "… with" / "20W adapter" fragments into one row
        if rows and (rows[-1].endswith(":") or rows[-1].endswith(" with") or rows[-1] == "with"
                     or l in ("with", ":", ")") or l.startswith(("with ", "or higher", ":"))
                     or re.fullmatch(r"\d+W adapter", l)):
            rows[-1] = (rows[-1] + " " + l).replace(" :", ":").replace(" )", ")")
        else:
            rows.append(l)
    secs = [s for s in secs if s["rows"] and s["section"] not in ("Built-in Apps", "Free Apps", "Accessibility", "Siri", "Languages", "Environmental Requirements", "In the Box", "Headphones", "SIM Card", "Rating for Hearing Aids", "Mail Attachment Support", "Video Calling", "Audio Calling", "Audio Playback", "Video Playback", "Operating System", "Peace of Mind", "Safety Features")]
    return name, year, secs


def label_rows(rows):
    """'Label: value' lines become [label, value]; other lines are grouped into one unlabeled row."""
    out = []
    for r in rows:
        m = re.match(r"^([^:]{2,40}):\s*(.+)$", r)
        if m:
            out.append([m.group(1), m.group(2)])
        elif out and out[-1][0] == "":
            out[-1][1] += "\n" + r
        else:
            out.append(["", r])
    return out


def first(pattern, text, cast=str, flags=0):
    m = re.search(pattern, text or "", flags)
    return cast(m.group(1).replace(",", "")) if m else None


def parse_apple(raw):
    name, year, secs = page_sections(raw)
    S = {s["section"]: s["rows"] for s in secs}
    get = lambda *keys: next((S[k] for k in S for want in keys if k.lower().startswith(want.lower())), [])
    disp_rows = get("Display", "Displays")
    disp = "\n".join(r for r in disp_rows if not r.startswith("The iPhone") and "rounded corners" not in r)
    chip = get("Chip")
    cam = [r for r in get("Camera") if "Panorama" not in r]
    selfie_rows = next((S[k] for k in S if re.search(r"TrueDepth|Front Camera|front camera", k)), [])
    power = get("Power and Battery")
    size = get("Size and Weight")
    finish = get("Finish")
    cap = get("Capacity")
    wireless = get("Cellular and Wireless")
    ports = get("Charging and Expansion") or [r for r in get("External Buttons") if "connector" in r]
    water = " ".join(get("Splash"))

    inches = [float(x) for x in re.findall(r"([\d.]+)[-‑ ]?inch", disp)]
    storage = sorted({int(x) * (1024 if u == "TB" else 1) for x, u in re.findall(r"^(\d+)(GB|TB)$", "\n".join(cap), re.M)})
    # One line per physical camera; skip the "camera system" heading and crops ("Also enables…", "enabled by quad-pixel sensor")
    lens_lines = [r for r in cam if re.match(r"^\d+MP ((Fusion |Pro |\d+x )?(Main|Wide|Ultra Wide|Telephoto)|Fusion:)", r)
                  and "camera system" not in r and "enabled by" not in r]
    if not lens_lines:
        sys_line = next((r for r in cam if "camera system" in r or "camera" in r.lower()), "")
        n = len(re.findall(r"(Telephoto|Ultra Wide|Wide|Main)", sys_line.split(":")[-1])) or 1
    else:
        n = len(lens_lines)
    count = {1: "Single", 2: "Dual", 3: "Triple", 4: "Quad"}.get(n, "")
    weight_g = [float(x) for x in re.findall(r"\(([\d.]+) grams\)", " ".join(size))]
    mm = re.findall(r"(Width|Height|Depth):\s*[\d.]+ inch(?:es)? \(([\d.]+) mm\)", " ".join(size))
    dims = ""
    if mm:
        d = {k: v for k, v in mm[:3]}
        dims = f"{d.get('Height', '?')} x {d.get('Width', '?')} x {d.get('Depth', '?')} mm"
        if "Open" in size and "Closed" in size:
            c = {k: v for k, v in mm[3:6]}
            dims = f"Open: {dims}\nClosed: {c.get('Height', '?')} x {c.get('Width', '?')} x {c.get('Depth', '?')} mm"
    magsafe = next((S[k] for k in S if "MagSafe" in k), [])
    charge_lines = [r for r in power if re.search(r"charg|MagSafe|Qi", r, re.I) and "Built" not in r and "playback" not in r]
    charge_lines += [r for r in magsafe if re.search(r"charging up to \d+W", r) and r not in charge_lines and not any(r in c for c in charge_lines)]
    wireless_w = [int(x) for r in charge_lines if re.search(r"MagSafe|Qi|wireless", r, re.I) for x in re.findall(r"up to (\d+)W", r)]
    playback = next((r for r in power if r.lower().startswith("video playback:")), "")
    nfc = next((r for r in wireless if "NFC" in r), "")
    usb = " · ".join(r for r in ports if re.search(r"USB|Lightning|connector", r))

    return {
        "name": name, "year": year,
        "display": {
            "type": next((r for r in disp.split("\n") if re.search(r"OLED|LCD", r)), ""),
            "size": " / ".join(f"{i}″" for i in inches),
            "resolution": "\n".join(r for r in disp.split("\n") if "ppi" in r),
            "inches": max(inches) if inches else None,
            "refresh": first(r"up to (\d+)Hz", disp, int),
            "peakNits": max([int(x.replace(",", "")) for x in re.findall(r"([\d,]+) nits", disp)] or [0]) or None,
            "protection": next((r for r in finish if "Ceramic Shield" in r), ""),
        },
        "chipset": chip[0] if chip else "", "socShort": re.sub(r"\s*chip$", "", chip[0]) if chip else "", "socBrand": "Apple",
        "cpu": next((r for r in chip if "CPU" in r), ""), "gpu": next((r for r in chip if "GPU" in r), ""),
        "os": "iOS",
        "memory": ", ".join(cap), "ramOptions": [], "storageOptions": storage, "cardSlot": "No",
        "mainCamera": "\n".join(lens_lines) or next((r for r in cam if "camera" in r.lower()), ""),
        "mainCameraCount": count, "mainCameraMp": first(r"(\d+)MP", "\n".join(cam), float),
        "cameraFeatures": "; ".join(r for r in cam if "zoom" in r.lower()),
        "video": "\n".join(get("Video Recording")[:3]),
        "selfie": ", ".join(selfie_rows[:2]), "selfieMp": first(r"(\d+)MP", " ".join(selfie_rows[:2]), float),
        "battery": playback.replace("Video playback:", "Video playback").strip() or "Built-in lithium-ion",
        "batteryMah": None,
        "charging": "\n".join(charge_lines), "wiredW": None, "wirelessW": max(wireless_w) if wireless_w else None,
        "dimensions": dims, "weight": f"{weight_g[0]:g} g" if weight_g else "", "weightG": weight_g[0] if weight_g else None,
        "build": next((r for r in finish if "design" in r.lower() or "glass" in r.lower()), ""),
        "ipRating": first(r"(IP6\d)", water),
        "colors": ", ".join(r for r in finish if len(r) < 25 and "design" not in r.lower()),
        "models": "", "nfc": nfc, "usb": usb,
        "sections": [{"section": s["section"], "rows": label_rows(s["rows"])} for s in secs],
    }
