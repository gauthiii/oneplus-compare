import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Trophy, X } from 'lucide-react'
import clsx from 'clsx'
import { bestOf, fmtInr, fmtStorage, fmtUsd, launchLabel, METRICS, SERIES_COLORS, type Phone } from '../lib'
import { BuyButtons } from './BuyButtons'

type Row = { label: string; get: (p: Phone) => string; metric?: string }
type Group = { title: string; rows: Row[] }

const s = (v: unknown) => (v == null || v === '' ? '–' : String(v))
/** Apple leaves some specs unpublished; say so instead of a bare dash. */
const np = (p: Phone, v: string | null) => v ?? (p.brand === 'Apple' ? 'Not published by Apple' : '–')
const priceCell = (v: string, variant?: string | null, kind?: string) => (v === '–' ? v : `${v}${variant && variant !== 'starting' ? ` (${variant})` : ''}${kind ? `\n${kind}` : ''}`)

const GROUPS: Group[] = [
  {
    title: 'Overview',
    rows: [
      { label: 'Brand', get: (p) => (p.brand === 'Apple' ? 'Apple' : 'OnePlus') },
      { label: 'Series', get: (p) => p.series },
      { label: 'Launched', get: (p) => launchLabel(p) },
      { label: 'Launch price (India)', get: (p) => priceCell(fmtInr(p.priceInr), p.priceInrVariant, p.priceInrKind), metric: 'inr' },
      { label: 'Launch price (US)', get: (p) => priceCell(fmtUsd(p.priceUsd), p.priceUsdVariant, p.priceUsdKind), metric: 'usd' },
      { label: 'Tap to pay (NFC)', get: (p) => (p.nfcSupport === 'no' ? 'No NFC' : `${p.tapToPay}\n${p.nfc}`) },
      { label: 'Status', get: (p) => s(p.status) },
      { label: 'Listed price (GSMArena)', get: (p) => s(p.price) },
    ],
  },
  {
    title: 'Display',
    rows: [
      { label: 'Size', get: (p) => s(p.display.size), metric: 'inches' },
      { label: 'Refresh rate', get: (p) => (p.display.refresh ? `${p.display.refresh} Hz` : '–'), metric: 'refresh' },
      { label: 'Peak brightness', get: (p) => (p.display.peakNits ? `${p.display.peakNits} nits` : '–'), metric: 'nits' },
      { label: 'Panel', get: (p) => s(p.display.type) },
      { label: 'Resolution', get: (p) => s(p.display.resolution) },
      { label: 'Protection', get: (p) => s(p.display.protection) },
    ],
  },
  {
    title: 'Performance',
    rows: [
      { label: 'Chipset', get: (p) => s(p.chipset) },
      { label: 'CPU', get: (p) => s(p.cpu) },
      { label: 'GPU', get: (p) => s(p.gpu) },
      { label: 'Max RAM', get: (p) => np(p, p.ramOptions.length ? `${Math.max(...p.ramOptions)} GB` : null), metric: 'ram' },
      { label: 'Max storage', get: (p) => (p.storageOptions.length ? fmtStorage(Math.max(...p.storageOptions)) : '–'), metric: 'storage' },
      { label: 'Memory options', get: (p) => s(p.memory) },
      { label: 'Card slot', get: (p) => s(p.cardSlot) },
      { label: 'Software', get: (p) => s(p.os) },
    ],
  },
  {
    title: 'Camera',
    rows: [
      { label: 'Main camera', get: (p) => (p.mainCameraMp ? `${p.mainCameraMp} MP` : '–'), metric: 'mp' },
      { label: 'Rear modules', get: (p) => s(p.mainCamera) },
      { label: 'Features', get: (p) => s(p.cameraFeatures) },
      { label: 'Video', get: (p) => s(p.video) },
      { label: 'Selfie', get: (p) => s(p.selfie) },
    ],
  },
  {
    title: 'Battery',
    rows: [
      { label: 'Capacity', get: (p) => np(p, p.batteryMah ? `${p.batteryMah} mAh` : null), metric: 'battery' },
      { label: 'Battery (as published)', get: (p) => s(p.battery) },
      { label: 'Wired', get: (p) => np(p, p.wiredW ? `${p.wiredW} W` : null), metric: 'wired' },
      { label: 'Wireless', get: (p) => (p.wirelessW ? `${p.wirelessW} W` : /wireless|Qi/i.test(p.charging) ? 'Yes (wattage not stated)' : 'No'), metric: 'wireless' },
      { label: 'Charging details', get: (p) => s(p.charging) },
    ],
  },
  {
    title: 'Design',
    rows: [
      { label: 'Weight', get: (p) => s(p.weight), metric: 'weight' },
      { label: 'Dimensions', get: (p) => s(p.dimensions) },
      { label: 'Build', get: (p) => s(p.build) },
      { label: 'Water / dust', get: (p) => s(p.ipRating) },
      { label: 'Colours', get: (p) => s(p.colors) },
    ],
  },
  {
    title: 'Connectivity',
    rows: [
      { label: 'NFC', get: (p) => s(p.nfc) || 'No' },
      { label: 'USB', get: (p) => s(p.usb) },
    ],
  },
]

export function CompareView({ phones, onRemove, onClose }: { phones: Phone[]; onRemove: (id: string) => void; onClose: () => void }) {
  const [diffOnly, setDiffOnly] = useState(false)
  const [highlight, setHighlight] = useState(true)

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const cols = `minmax(140px,180px) repeat(${phones.length}, minmax(200px, 1fr))`

  // Per-phone tally of "best" wins across metrics
  const wins = Object.fromEntries(phones.map((p) => [p.id, 0]))
  for (const m of METRICS) {
    const b = bestOf(phones, m.get, m.better)
    if (b != null) phones.forEach((p) => m.get(p) === b && wins[p.id]++)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 top-4 overflow-auto rounded-t-[2rem] bg-paper sm:inset-x-4 sm:top-8"
      >
        <div className="sticky top-0 z-20 border-b border-black/5 bg-paper/90 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <h2 className="text-xl font-extrabold tracking-tight">Compare {phones.length} phones</h2>
            <div className="flex items-center gap-4 text-sm">
              <Toggle on={highlight} set={setHighlight} label="Highlight best" />
              <Toggle on={diffOnly} set={setDiffOnly} label="Differences only" />
              <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-black/10 hover:ring-black/30" aria-label="Close compare">
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-3 px-5 pb-4" style={{ gridTemplateColumns: cols }}>
            <div />
            {phones.map((p) => (
              <div key={p.id} className="relative rounded-3xl bg-white p-3 ring-1 ring-black/5">
                <button onClick={() => onRemove(p.id)} className="absolute right-2 top-2 rounded-full p-1 text-black/30 hover:bg-paper hover:text-black" aria-label={`Remove ${p.name}`}>
                  <X className="size-4" />
                </button>
                <div className="flex items-center gap-3">
                  <img src={p.image} alt={p.name} className="h-24 w-16 object-contain mix-blend-multiply" />
                  <div className="min-w-0">
                    <span className={clsx('rounded-full px-1.5 py-px text-[9px] font-semibold uppercase', SERIES_COLORS[p.series])}>{p.series}</span>
                    <div className="mt-1 font-bold leading-tight">{p.name}</div>
                    {highlight && wins[p.id] > 0 && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand">
                        <Trophy className="size-3" /> Best in {wins[p.id]} of {METRICS.length}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <BuyButtons phone={p} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-16 pt-2">
          {GROUPS.map((g) => {
            const rows = g.rows.filter((r) => !diffOnly || new Set(phones.map(r.get)).size > 1)
            if (!rows.length) return null
            return (
              <section key={g.title} className="mt-6">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40">{g.title}</h3>
                <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
                  {rows.map((r) => {
                    const m = r.metric ? METRICS.find((x) => x.key === r.metric) : undefined
                    const best = m && highlight ? bestOf(phones, m.get, m.better) : null
                    const vals = m ? phones.map((p) => m.get(p)).filter((x): x is number => x != null) : []
                    const top = vals.length ? Math.max(...vals) : 0
                    const low = vals.length ? Math.min(...vals) : 0
                    // Longest bar = best value: share of the max when higher wins, min ÷ value when lower wins (price, weight)
                    const share = (v: number) => (m?.better === 'low' ? low / v : v / top)
                    return (
                      <div key={r.label} className="grid gap-3 border-b border-black/5 px-4 py-3 last:border-0" style={{ gridTemplateColumns: cols }}>
                        <div className="text-[13px] font-medium text-black/50">{r.label}</div>
                        {phones.map((p) => {
                          const v = m?.get(p) ?? null
                          const isBest = best != null && v === best
                          return (
                            <div key={p.id} className={clsx('whitespace-pre-line text-[13px] leading-relaxed', isBest ? 'font-semibold text-brand' : 'text-black/80')}>
                              <div className="flex items-start gap-1.5">
                                <span>{r.get(p)}</span>
                                {isBest && <span className="mt-0.5 rounded-full bg-brand/10 px-1.5 text-[10px] font-semibold uppercase tracking-wide">Best</span>}
                              </div>
                              {m && v != null && top > 0 && (
                                <div className="mt-1.5 h-1 w-full max-w-40 overflow-hidden rounded-full bg-black/5">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${share(v) * 100}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={clsx('h-full rounded-full', isBest ? 'bg-brand' : 'bg-black/25')}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
          <p className="mt-8 text-xs text-black/40">
            “Best” compares only the phones on screen. For price and weight, lower wins; for every other bar, higher wins. Apple doesn’t publish battery mAh,
            RAM or wired charging wattage, so iPhones can’t win those rows. A dash means the source doesn’t list that spec. Specs: {[...new Set(phones.map((p) => p.sourceName))].join(' and ')}.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Toggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => set(!on)} className="hidden items-center gap-2 text-black/70 sm:flex" role="switch" aria-checked={on}>
      <span className={clsx('relative h-5 w-9 rounded-full transition', on ? 'bg-brand' : 'bg-black/15')}>
        <motion.span layout className={clsx('absolute top-0.5 size-4 rounded-full bg-white shadow', on ? 'right-0.5' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}
