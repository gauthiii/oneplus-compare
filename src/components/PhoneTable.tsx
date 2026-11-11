import { ArrowDown, Check, Plus } from 'lucide-react'
import clsx from 'clsx'
import { amazonLink, batteryShort, chargeShort, fmtInr, fmtUsd, launchLabel, SERIES_COLORS, type Phone } from '../lib'
import { TapToPay } from './TapToPay'
import type { SortKey } from '../App'

type Col = { label: string; sort?: SortKey; cell: (p: Phone) => React.ReactNode; className?: string }

const COLS: Col[] = [
  { label: 'Launched', sort: 'newest', cell: (p) => launchLabel(p), className: 'whitespace-nowrap' },
  { label: 'Price ₹', sort: 'priceInr', cell: (p) => fmtInr(p.priceInr), className: 'whitespace-nowrap font-mono text-[13px]' },
  { label: 'Price $', sort: 'priceUsd', cell: (p) => fmtUsd(p.priceUsd), className: 'whitespace-nowrap font-mono text-[13px]' },
  { label: 'Tap to pay', cell: (p) => <TapToPay phone={p} />, className: 'whitespace-nowrap' },
  { label: 'Chipset', cell: (p) => p.socShort },
  { label: 'Display', sort: 'screen', cell: (p) => `${p.display.inches ?? '–'}″ · ${p.display.refresh ?? '–'}Hz` },
  { label: 'Peak nits', sort: 'brightness', cell: (p) => p.display.peakNits ?? '–' },
  { label: 'Battery', sort: 'battery', cell: (p) => batteryShort(p) || '–', className: 'whitespace-nowrap' },
  { label: 'Charging', sort: 'charging', cell: (p) => chargeShort(p) || '–' },
  { label: 'Main cam', cell: (p) => (p.mainCameraMp ? `${p.mainCameraMp} MP` : '–') },
  { label: 'Weight', sort: 'lightest', cell: (p) => (p.weightG ? `${p.weightG} g` : '–') },
  { label: 'IP', cell: (p) => p.ipRating ?? '–' },
]

export function PhoneTable({ list, sort, setSort, compare, onToggle, onOpen }: { list: Phone[]; sort: SortKey; setSort: (s: SortKey) => void; compare: string[]; onToggle: (id: string) => void; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-black/5">
      <table className="w-full min-w-[1400px] text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wider text-black/45">
            <th className="sticky left-0 z-10 bg-white py-3 pl-4 pr-2 font-medium">Phone</th>
            {COLS.map((c) => (
              <th key={c.label} className="px-3 py-3 font-medium">
                {c.sort ? (
                  <button onClick={() => setSort(c.sort!)} className={clsx('inline-flex items-center gap-1 uppercase hover:text-black', sort === c.sort && 'text-brand')}>
                    {c.label}
                    <ArrowDown className={clsx('size-3', sort === c.sort ? 'opacity-100' : 'opacity-30')} />
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
            <th className="px-3 py-3 font-medium">Buy</th>
            <th className="px-3 py-3 pr-4 font-medium">Compare</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => {
            const on = compare.includes(p.id)
            return (
              <tr key={p.id} className={clsx('border-b border-black/5 last:border-0 hover:bg-paper/60', on && 'bg-brand/5')}>
                <td className="sticky left-0 z-10 bg-inherit py-2 pl-4 pr-2">
                  <button onClick={() => onOpen(p.id)} className="flex items-center gap-3 text-left">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-paper">
                      <img src={p.image} alt="" loading="lazy" className="h-11 object-contain mix-blend-multiply" />
                    </span>
                    <span>
                      <span className="block whitespace-nowrap font-semibold hover:text-brand">{p.name}</span>
                      <span className={clsx('mt-0.5 inline-block rounded-full px-1.5 py-px text-[9px] font-semibold uppercase', SERIES_COLORS[p.series])}>{p.series}</span>
                    </span>
                  </button>
                </td>
                {COLS.map((c) => (
                  <td key={c.label} className={clsx('px-3 py-2 text-black/75', c.className)}>
                    {c.cell(p)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {!p.onSale ? <span className="text-black/40">Not on sale</span> : <>
                  <a className="font-medium text-brand hover:underline" href={amazonLink(p, 'in').url} target="_blank" rel="noopener noreferrer sponsored">.in</a>
                  <span className="mx-1.5 text-black/20">|</span>
                  <a className="font-medium text-brand hover:underline" href={amazonLink(p, 'us').url} target="_blank" rel="noopener noreferrer sponsored">.com</a>
                  </>}
                </td>
                <td className="px-3 py-2 pr-4">
                  <button
                    onClick={() => onToggle(p.id)}
                    disabled={!on && compare.length >= 4}
                    className={clsx('grid size-7 place-items-center rounded-full transition disabled:opacity-30', on ? 'bg-brand text-white' : 'ring-1 ring-black/15 hover:ring-black/40')}
                    aria-label={on ? 'Remove from compare' : 'Add to compare'}
                  >
                    {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
