import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGrid, Nfc, Rows3, Search, X } from 'lucide-react'
import clsx from 'clsx'
import { BRAND_SERIES, meta, phones, type Phone } from './lib'
import { PhoneCard } from './components/PhoneCard'
import { PhoneTable } from './components/PhoneTable'
import { CompareTray } from './components/CompareTray'
import { CompareView } from './components/CompareView'
import { DetailPanel } from './components/DetailPanel'
import { Hero } from './components/Hero'

export type SortKey = 'newest' | 'oldest' | 'priceInr' | 'priceUsd' | 'battery' | 'charging' | 'refresh' | 'brightness' | 'screen' | 'lightest' | 'name'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'priceInr', label: 'Price ₹ low → high' },
  { key: 'priceUsd', label: 'Price $ low → high' },
  { key: 'battery', label: 'Biggest battery (mAh)' },
  { key: 'charging', label: 'Fastest charging' },
  { key: 'refresh', label: 'Highest refresh rate' },
  { key: 'brightness', label: 'Brightest screen' },
  { key: 'screen', label: 'Largest screen' },
  { key: 'lightest', label: 'Lightest' },
  { key: 'name', label: 'Name A–Z' },
]

const date = (p: Phone) => p.year * 100 + (p.month ?? 0)
const desc = (f: (p: Phone) => number | null) => (a: Phone, b: Phone) => (f(b) ?? -1) - (f(a) ?? -1)
const asc = (f: (p: Phone) => number | null) => (a: Phone, b: Phone) => (f(a) ?? Infinity) - (f(b) ?? Infinity)

const SORT_FN: Record<SortKey, (a: Phone, b: Phone) => number> = {
  newest: (a, b) => date(b) - date(a),
  oldest: (a, b) => date(a) - date(b),
  priceInr: asc((p) => p.priceInr),
  priceUsd: asc((p) => p.priceUsd),
  battery: desc((p) => p.batteryMah),
  charging: desc((p) => p.wiredW),
  refresh: desc((p) => p.display.refresh),
  brightness: desc((p) => p.display.peakNits),
  screen: desc((p) => p.display.inches),
  lightest: (a, b) => (a.weightG ?? 9999) - (b.weightG ?? 9999),
  name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }),
}

const YEARS = [...new Set(phones.map((p) => p.year))].sort((a, b) => b - a)
type Brand = 'All' | Phone['brand']
const BRANDS: { key: Brand; label: string }[] = [
  { key: 'All', label: 'All phones' },
  { key: 'OnePlus', label: 'OnePlus' },
  { key: 'Apple', label: 'iPhone' },
]
const seriesFor = (b: Brand) =>
  (b === 'All' ? [...BRAND_SERIES.OnePlus, ...BRAND_SERIES.Apple] : BRAND_SERIES[b]).filter((s) => phones.some((p) => p.series === s))

export default function App() {
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState<Brand>('All')
  const [payOnly, setPayOnly] = useState(false)
  const [series, setSeries] = useState<string>('All')
  const [year, setYear] = useState<number | 'All'>('All')
  const [soc, setSoc] = useState<string>('All')
  const [sale, setSale] = useState<string>('All')
  const [sort, setSort] = useState<SortKey>('newest')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  // Comparisons are shareable: #compare=id1,id2[&open]
  const initial = useMemo(() => {
    const h = new URLSearchParams(window.location.hash.slice(1))
    const ids = (h.get('compare') ?? '').split(',').filter((id) => phones.some((p) => p.id === id)).slice(0, 4)
    return { ids, open: h.has('open') && ids.length > 1 }
  }, [])
  const [compare, setCompare] = useState<string[]>(initial.ids)
  const [compareOpen, setCompareOpen] = useState(initial.open)

  useEffect(() => {
    const hash = compare.length ? `#compare=${compare.join(',')}${compareOpen ? '&open' : ''}` : ''
    window.history.replaceState(null, '', hash || window.location.pathname)
  }, [compare, compareOpen])
  const [detail, setDetail] = useState<string | null>(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return phones
      .filter((p) => brand === 'All' || p.brand === brand)
      .filter((p) => series === 'All' || p.series === series)
      .filter((p) => !payOnly || p.nfcSupport === 'yes')
      .filter((p) => year === 'All' || p.year === year)
      .filter((p) => soc === 'All' || p.socBrand === soc)
      .filter((p) => sale === 'All' || (sale === 'On sale') === p.onSale)
      .filter((p) => !q || `${p.name} ${p.chipset} ${p.series} ${p.brand}`.toLowerCase().includes(q))
      .sort(SORT_FN[sort])
  }, [query, brand, series, payOnly, year, soc, sale, sort])

  const toggleCompare = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? c : [...c, id]))

  const compared = compare.map((id) => phones.find((p) => p.id === id)!).filter(Boolean)
  const detailPhone = phones.find((p) => p.id === detail) ?? null
  const filtersOn = brand !== 'All' || payOnly || series !== 'All' || year !== 'All' || soc !== 'All' || sale !== 'All' || query !== ''
  const brandPool = phones.filter((p) => brand === 'All' || p.brand === brand)

  return (
    <div className="min-h-screen pb-40">
      <Hero onPick={setDetail} />

      {/* Controls */}
      <div className="sticky top-0 z-30 border-y border-black/5 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex min-w-56 flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-black/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a model or chip… e.g. 13R, iPhone 16, A18"
                className="h-10 w-full rounded-full border border-black/10 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-brand/60 focus:ring-4 focus:ring-brand/10"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 text-black/40 hover:text-black" aria-label="Clear search">
                  <X className="size-4" />
                </button>
              )}
            </label>

            <Select value={String(year)} onChange={(v) => setYear(v === 'All' ? 'All' : Number(v))} options={['All', ...YEARS.map(String)]} label="Year" />
            <Select value={soc} onChange={setSoc} options={['All', 'Apple', 'Qualcomm', 'MediaTek', 'Unisoc']} label="Chip" />
            <Select value={sale} onChange={setSale} options={['All', 'On sale', 'Not on sale']} label="Sale" />
            <Select value={sort} onChange={(v) => setSort(v as SortKey)} options={SORTS.map((s) => s.key)} labels={Object.fromEntries(SORTS.map((s) => [s.key, s.label]))} label="Sort" />

            <div className="flex rounded-full border border-black/10 bg-white p-1">
              {(['grid', 'table'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={clsx('flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition', view === v ? 'bg-ink text-white' : 'text-black/60 hover:text-black')}
                >
                  {v === 'grid' ? <LayoutGrid className="size-3.5" /> : <Rows3 className="size-3.5" />}
                  {v === 'grid' ? 'Cards' : 'Table'}
                </button>
              ))}
            </div>
          </div>

          <div className="no-scrollbar -mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1">
            <div className="flex shrink-0 rounded-full bg-ink p-1">
              {BRANDS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => {
                    setBrand(b.key)
                    setSeries('All')
                  }}
                  className={clsx('relative h-7 rounded-full px-3 text-xs font-semibold transition', brand === b.key ? 'text-ink' : 'text-white/60 hover:text-white')}
                >
                  {brand === b.key && <motion.span layoutId="brand" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
                  <span className="relative">{b.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPayOnly((v) => !v)}
              className={clsx(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition',
                payOnly ? 'bg-emerald-600 text-white' : 'bg-white text-black/70 ring-1 ring-black/10 hover:text-black',
              )}
              aria-pressed={payOnly}
            >
              <Nfc className="size-4" /> Tap-to-pay only
            </button>
            <span className="mx-1 h-5 w-px shrink-0 bg-black/10" />
            {['All', ...seriesFor(brand)].map((s) => {
              const n = s === 'All' ? brandPool.length : phones.filter((p) => p.series === s).length
              return (
                <button
                  key={s}
                  onClick={() => setSeries(s)}
                  className={clsx(
                    'relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                    series === s ? 'text-white' : 'bg-white text-black/70 ring-1 ring-black/10 hover:text-black',
                  )}
                >
                  {series === s && <motion.span layoutId="chip" className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
                  <span className="relative">
                    {s} <span className={clsx('ml-0.5 font-mono text-[11px]', series === s ? 'text-white/70' : 'text-black/35')}>{n}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between text-sm text-black/50">
          <span>
            Showing <b className="text-ink">{list.length}</b> of {phones.length} phones
          </span>
          {filtersOn && (
            <button
              onClick={() => {
                setBrand('All'); setPayOnly(false); setSeries('All'); setYear('All'); setSoc('All'); setSale('All'); setQuery('')
              }}
              className="font-medium text-brand hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-black/15 py-24 text-center text-black/50">No phones match these filters.</div>
        ) : view === 'grid' ? (
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {list.map((p) => (
                <PhoneCard key={p.id} phone={p} selected={compare.includes(p.id)} compareFull={compare.length >= 4} onToggle={() => toggleCompare(p.id)} onOpen={() => setDetail(p.id)} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <PhoneTable list={list} sort={sort} setSort={setSort} compare={compare} onToggle={toggleCompare} onOpen={setDetail} />
        )}

        <footer className="mt-16 space-y-2 border-t border-black/10 pt-6 text-xs leading-relaxed text-black/45">
          <p>
            <b className="text-black/60">Specs.</b> OnePlus specs and images come from GSMArena, captured {meta.capturedAt}. Specs for the OnePlus 9, 9 Pro, 9R,
            9RT, Nord CE 5G, Nord 2 5G, Nord N200 5G and Nord CE 2 5G come from OnePlus's official spec pages; these models are no longer sold, so they show
            “Not on sale now” instead of buy buttons. iPhone specs and images come from Apple's Tech Specs pages. Apple doesn't publish battery capacity in mAh,
            RAM or wired charging wattage, so iPhones show battery as hours of video playback and a dash for the others.
          </p>
          <p>
            <b className="text-black/60">Prices</b> are starting launch prices (cheapest variant): iPhones from Apple Newsroom (US and India), OnePlus from
            OnePlus India's official MRP or launch reports. Each phone's detail panel links to the source. A dash means the phone didn't launch in that
            country or no launch price was found. <b className="text-black/60">Tap to pay</b> means the phone has NFC for contactless payments (Apple Pay on
            iPhone, Google Wallet on OnePlus); “varies by region” means NFC is only in some markets.
          </p>
          <p>
            Amazon buttons open an exact-model search on Amazon.in or Amazon.com; China-only models may show no official listing. Not affiliated with OnePlus,
            Apple or Amazon.
          </p>
        </footer>
      </main>

      <CompareTray phones={compared} onRemove={toggleCompare} onClear={() => setCompare([])} onCompare={() => setCompareOpen(true)} />

      <AnimatePresence>
        {compareOpen && compared.length > 0 && <CompareView phones={compared} onRemove={toggleCompare} onClose={() => setCompareOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {detailPhone && (
          <DetailPanel phone={detailPhone} selected={compare.includes(detailPhone.id)} compareFull={compare.length >= 4} onToggle={() => toggleCompare(detailPhone.id)} onClose={() => setDetail(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Select({ value, onChange, options, labels, label }: { value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string>; label: string }) {
  return (
    <label className="relative flex h-10 items-center rounded-full border border-black/10 bg-white pl-3.5 pr-2 text-sm">
      <span className="mr-1.5 text-black/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="cursor-pointer appearance-none bg-transparent pr-5 font-medium outline-none">
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 size-3 text-black/40" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  )
}
