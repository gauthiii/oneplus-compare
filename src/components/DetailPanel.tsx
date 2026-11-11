import { useEffect } from 'react'
import { motion } from 'motion/react'
import { Check, ExternalLink, Plus, X } from 'lucide-react'
import clsx from 'clsx'
import { batteryShort, chargeShort, fmtInr, fmtUsd, launchLabel, SERIES_COLORS, type Phone } from '../lib'
import { PriceTag } from './PriceTag'
import { TapToPay } from './TapToPay'
import { BuyButtons } from './BuyButtons'
import { statusShort } from './PhoneCard'

export function DetailPanel({ phone: p, selected, compareFull, onToggle, onClose }: { phone: Phone; selected: boolean; compareFull: boolean; onToggle: () => void; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const quick = [
    ['Display', [p.display.inches && `${p.display.inches}″`, p.display.refresh && `${p.display.refresh}Hz`].filter(Boolean).join(' · ')],
    ['Chip', p.socShort],
    ['Battery', batteryShort(p)],
    ['Charging', chargeShort(p)],
    ['Camera', p.mainCameraMp ? `${p.mainCameraMp} MP ${p.mainCameraCount.toLowerCase()}` : ''],
    ['Weight', p.weightG ? `${p.weightG} g` : ''],
  ].filter(([, v]) => v)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-paper shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex justify-end bg-gradient-to-b from-paper via-paper/80 to-transparent p-4">
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-black/10 hover:ring-black/30" aria-label="Close details">
            <X className="size-4" />
          </button>
        </div>

        <div className="-mt-10 px-6">
          <div className="grid place-items-center rounded-[2rem] bg-white py-8 ring-1 ring-black/5">
            <motion.img layoutId={`img-${p.id}`} src={p.image} alt={p.name} className="h-64 object-contain mix-blend-multiply" />
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className={clsx('rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide', SERIES_COLORS[p.series])}>{p.series}</span>
            <span className="text-black/50">{launchLabel(p)}</span>
            <span className="size-1 rounded-full bg-black/20" />
            <span className="text-black/50">{statusShort(p.status)}</span>
          </div>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">{p.name}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PriceTag phone={p} className="text-base" />
            <TapToPay phone={p} size="md" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {quick.map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
                <div className="text-[10px] uppercase tracking-wider text-black/40">{k}</div>
                <div className="mt-0.5 text-sm font-semibold leading-tight">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <BuyButtons phone={p} />
            <button
              onClick={onToggle}
              disabled={!selected && compareFull}
              className={clsx(
                'flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium ring-1 transition disabled:opacity-40',
                selected ? 'bg-brand text-white ring-brand' : 'bg-white ring-black/10 hover:ring-black/30',
              )}
            >
              {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
              {selected ? 'Added to compare' : compareFull ? 'Compare is full (4 max)' : 'Add to compare'}
            </button>
          </div>

          <div className="mt-8 space-y-5 pb-12">
            {p.sections.map((sec) => (
              <section key={sec.section}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/40">{sec.section}</h3>
                <dl className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                  {sec.rows.map(([k, v], i) => (
                    <div key={i} className="grid grid-cols-[110px_1fr] gap-3 border-b border-black/5 px-4 py-2.5 text-[13px] last:border-0">
                      <dt className="text-black/45">{k}</dt>
                      <dd className="whitespace-pre-line text-black/80">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
            <div className="flex flex-col gap-1.5 text-xs text-black/50">
              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-brand">
                Specs: {p.sourceName} <ExternalLink className="size-3" />
              </a>
              {p.priceInr != null && p.priceInrSource && (
                <a href={p.priceInrSource} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-brand">
                  India price {fmtInr(p.priceInr)}: {p.priceInrKind} <ExternalLink className="size-3" />
                </a>
              )}
              {p.priceUsd != null && p.priceUsdSource && (
                <a href={p.priceUsdSource} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-brand">
                  US price {fmtUsd(p.priceUsd)}: {p.priceUsdKind} <ExternalLink className="size-3" />
                </a>
              )}
              {p.priceNote && <span>Price note: {p.priceNote}</span>}
            </div>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  )
}
