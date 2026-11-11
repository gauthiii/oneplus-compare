# OnePlus vs iPhone Compare

Compare every OnePlus phone announced from the OnePlus 9 (March 2021) onward (flagships, R series, Open, Nord, Nord CE,
Nord N, Ace and Turbo; no tablets or watches) and every iPhone from the iPhone 13 (September 2021) onward, including SE, e, Air and Duo.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

## Features

- Card and table views; brand switch (All / OnePlus / iPhone), series chips, year, chip maker, sale status and search; 11 sort orders including price
- Launch prices in ₹ (India) and $ (US), each linked to its source
- Tap-to-pay badge (NFC for Apple Pay / Google Wallet), a "Tap-to-pay only" filter, and an NFC row in compare
- Pick up to 4 phones and compare them side by side, with the best value in each row highlighted
  and a "differences only" switch
- Comparisons are shareable: the URL becomes `#compare=<id>,<id>&open`
- Detail panel with the full GSMArena spec sheet for each phone
- Amazon.in and Amazon.com buy buttons on every phone that's still on sale; discontinued models show "Not on sale now" and are listed for their specs only
- Sale filter (All / On sale / Not on sale)

## Data

| What | Where |
|---|---|
| Specs | `src/data/phones.json`, built from GSMArena spec pages |
| Thumbnails | `public/phones/<id>.jpg` (downloaded from GSMArena) |
| Amazon links | `src/data/amazon-links.json` (optional direct URLs) |
| Raw page cache | `scripts/cache/` |
| iPhone specs | `scripts/apple_specs.py` parses Apple Tech Specs pages (cached in `scripts/cache/apple/`); `scripts/apple_phones.json` holds launch month and Apple Newsroom prices (US + India) with source URLs |
| OnePlus prices | `scripts/oneplus_in_prices.py` reads official India MRP from oneplus.in spec pages (`scripts/cache/oneplus_in/`); `scripts/oneplus_launch_prices.json` holds researched launch prices with source URLs |
| Fallback specs | `scripts/official_phones.json`: OnePlus 9, 9 Pro, 9R, 9RT, Nord CE 5G, Nord 2 5G, Nord N200 5G, Nord CE 2 5G, transcribed from OnePlus's official spec pages (cached in `scripts/cache/official/`) because GSMArena rate-limited those pages. These phones are no longer sold, so they show **Not on sale now** instead of buy buttons. If their GSMArena pages are cached later, `build_data.py` uses those instead. |

To refresh:

```bash
./scripts/fetch_gsmarena.sh     # caches new/missing pages; GSMArena rate-limits, so it is slow, and you can re-run it
python3 scripts/build_data.py   # rebuilds phones.json + downloads missing thumbnails
```

### Amazon links

By default each button opens an exact-model search (`amazon.in/s?k=OnePlus 13R`).
To send a phone straight to its product page, add it to `src/data/amazon-links.json`:

```json
{ "oneplus_13r-13548": { "in": "https://www.amazon.in/dp/XXXXXXXXXX", "us": "https://www.amazon.com/dp/XXXXXXXXXX" } }
```

Many Ace, Turbo and Nord N models are sold only in China or North America, so an Amazon search may find no official listing.

### Known gaps

- Apple doesn't publish battery capacity (mAh), RAM or wired charging wattage, so iPhones show battery as hours of video playback and "Not published by Apple" in compare.
- GSMArena's price field is a current listed price, not a launch price; it's shown only as "Listed price (GSMArena)" in compare.
- OnePlus India MRP can be higher than the actual launch selling price (e.g. OnePlus Open MRP ₹1,49,999).
