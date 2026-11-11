import { forwardRef } from 'react'
import { motion } from 'motion/react'
import { BatteryCharging, Camera, Check, Cpu, Plus, Smartphone } from 'lucide-react'
import clsx from 'clsx'
import { batteryShort, launchLabel, SERIES_COLORS, type Phone } from '../lib'
import { PriceTag } from './PriceTag'
import { TapToPay } from './TapToPay'
import { BuyButtons } from './BuyButtons'

export const statusShort = (s: string) => {
  const w = s.split('.')[0]
  return w === 'Coming soon' ? 'Coming soon' : w
}

type Props = { phone: Phone; selected: boolean; compareFull: boolean; onToggle: () => void; onOpen: () => void }

export const PhoneCard = forwardRef<HTMLElement, Props>(function PhoneCard({ phone: p, selected, compareFull, onToggle, onOpen }, ref) {
  const specs = [
    { icon: Smartphone, v: [p.display.inches && `${p.display.inches}″`, p.display.refresh && `${p.display.refresh}Hz`].filter(Boolean).join(' · ') },
    { icon: Cpu, v: p.socShort },
    { icon: BatteryCharging, v: [batteryShort(p), p.wiredW ? `${p.wiredW}W` : p.wirelessW ? `${p.wirelessW}W wireless` : ''].filter(Boolean).join(' · ') },
    { icon: Camera, v: [p.mainCameraMp && `${p.mainCameraMp} MP`, p.mainCameraCount && p.mainCameraCount.toLowerCase()].filter(Boolean).join(' · ') },
  ]
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className={clsx(
        'group flex flex-col rounded-3xl bg-white p-3 ring-1 transition-shadow hover:shadow-xl hover:shadow-black/5',
        selected ? 'ring-2 ring-brand' : 'ring-black/5',
      )}
    >
      <div className="relative">
        <button onClick={onOpen} className="block w-full overflow-hidden rounded-2xl bg-paper/70" aria-label={`Open ${p.name} details`}>
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="mx-auto h-52 w-full object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-105"
          />
        </button>
        <span className={clsx('absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', SERIES_COLORS[p.series])}>{p.series}</span>
        <button
          onClick={onToggle}
          disabled={!selected && compareFull}
          title={selected ? 'Remove from compare' : compareFull ? 'You can compare up to 4 phones' : 'Add to compare'}
          className={clsx(
            'absolute right-2.5 top-2.5 flex h-8 items-center gap-1 rounded-full pl-2 pr-2.5 text-xs font-medium shadow-sm transition',
            selected ? 'bg-brand text-white' : 'bg-white text-black/70 ring-1 ring-black/10 hover:text-black disabled:opacity-40',
          )}
        >
          {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
          {selected ? 'Added' : 'Compare'}
        </button>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <button onClick={onOpen} className="text-left">
          <h3 className="text-lg font-bold leading-tight tracking-tight hover:text-brand">{p.name}</h3>
        </button>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-black/50">
          <span>{launchLabel(p)}</span>
          {p.status && (
            <>
              <span className="size-1 rounded-full bg-black/20" />
              <span className={clsx(p.onSale ? (statusShort(p.status) === 'Available' ? 'text-emerald-600' : 'text-amber-600') : 'font-medium text-black/45')}>
                {statusShort(p.status)}
              </span>
            </>
          )}
        </div>

        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-[13px]">
          {specs.map(({ icon: Icon, v }, i) =>
            v ? (
              <li key={i} className="flex items-center gap-2 text-black/75">
                <Icon className="size-3.5 shrink-0 text-black/35" />
                <span className="truncate">{v}</span>
              </li>
            ) : null,
          )}
        </ul>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
          <PriceTag phone={p} />
          <TapToPay phone={p} />
        </div>

        <div className="mt-auto pt-3">
          <BuyButtons phone={p} size="sm" />
        </div>
      </div>
    </motion.article>
  )
})
