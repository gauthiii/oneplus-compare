"""Turn an official OnePlus spec page (oneplus.in / oneplus.com) into [{section, rows}] for the detail panel.

Used for phones whose GSMArena page could not be fetched. Only lines between the first spec
heading and "In The Box" are read, so compare-widget placeholders elsewhere on the page are ignored.
"""
import html, re

TOP = ["MRP", "Dimensions", "Display", "Performance", "Camera", "Connectivity", "Sensors", "Ports",
       "Buttons", "Audio", "Multimedia", "Colors", "Colours", "In The Box"]
SUB = re.compile(r"^(Parameters|Features|Flash|Autofocus|Video|Video [Ee]ditor|Zoom|Band|Wi-Fi|Bluetooth®?|NFC|"
                 r"Positioning|LTE/LTE-A|Time-Lapse|Time-lapse|Front Camera Video|Audio Supported Formats|"
                 r"Video Supported Formats|Image Supported Formats|.*(Camera|Lens)( - .*)?)$")
SKIP_SUB = {"Video Editor", "Video editor", "Time-Lapse", "Time-lapse"}  # feature flags, kept as values


def page_lines(raw):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", raw, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    t = re.sub(r"\)(Resolution:)", r")\n\1", t)  # 9 Pro page runs Size and Resolution together
    return [l.strip() for l in t.split("\n") if l.strip() and "{{" not in l]


def official_sections(raw):
    L = page_lines(raw)
    start = next(i for i, l in enumerate(L) if l in ("MRP", "Dimensions"))
    end = next((i for i in range(start, len(L)) if L[i].lower() == "in the box"), len(L))
    out, cur, sub = [], None, ""
    for l in L[start:end]:
        if l in TOP:
            cur = {"section": "Price (India MRP)" if l == "MRP" else l, "rows": []}
            out.append(cur)
            sub = ""
            continue
        if cur is None or l == "--":
            continue
        if SUB.match(l) and l not in SKIP_SUB and len(l) < 45:
            sub = l
            continue
        m = re.match(r"^([^:：]{2,40})[:：]\s*(.+)$", l)
        if m and not l.startswith("http"):
            label = f"{sub} · {m.group(1)}" if sub and sub not in ("Parameters",) else m.group(1)
            cur["rows"].append([label.strip(), m.group(2).strip()])
        else:
            label = sub or cur["section"]
            if cur["rows"] and cur["rows"][-1][0] == label:
                cur["rows"][-1][1] += "\n" + l
            else:
                cur["rows"].append([label, l])
    return [s for s in out if s["rows"]]
