import { motion } from 'motion/react'
import { Apple } from 'lucide-react'
import { phones, launchLabel } from '../lib'

const byDate = [...phones].sort((a, b) => b.year * 100 + (b.month ?? 0) - (a.year * 100 + (a.month ?? 0)))
const newest = byDate[0]
// Several phones share the earliest month (Mar 2021); name the OnePlus 9 as the starting point
const oldest = phones.find((p) => p.name === 'OnePlus 9') ?? byDate[byDate.length - 1]
const onePlusCount = phones.filter((p) => p.brand === 'OnePlus').length
const iPhoneCount = phones.filter((p) => p.brand === 'Apple').length
// Newest OnePlus flagships and iPhone Pros, interleaved
const op = byDate.filter((p) => p.series === 'Flagship')
const ip = byDate.filter((p) => p.series === 'iPhone Pro' || p.series === 'iPhone Duo')
const showcase = [op[1], ip[0], op[0], ip[1], op[2]].filter(Boolean)
const maxBy = (f: (p: (typeof phones)[number]) => number | null) => phones.reduce((a, b) => ((f(b) ?? 0) > (f(a) ?? 0) ? b : a))

const stats = [
  { label: 'Phones compared', value: String(phones.length), sub: `${onePlusCount} OnePlus · ${iPhoneCount} iPhone` },
  { label: 'With tap to pay', value: String(phones.filter((p) => p.nfcSupport === 'yes').length), sub: 'NFC for Apple Pay / GPay' },
  { label: 'Biggest battery', value: `${maxBy((p) => p.batteryMah).batteryMah} mAh`, sub: maxBy((p) => p.batteryMah).name },
  { label: 'Fastest wired charging', value: `${maxBy((p) => p.wiredW).wiredW} W`, sub: maxBy((p) => p.wiredW).name },
]

export function Hero({ onPick }: { onPick: (id: string) => void }) {
  return (
    <header className="relative overflow-hidden">
      <div className="grain absolute inset-0 opacity-60" />
      <div className="absolute -right-40 -top-40 size-[36rem] rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-black/10">
            <span className="grid size-5 place-items-center rounded-md bg-brand text-[10px] font-bold text-white">1+</span>
            <span className="grid size-5 place-items-center rounded-md bg-ink text-white">
              <Apple className="size-3" />
            </span>
            {launchLabel(oldest)} – {launchLabel(newest)}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
          >
            OnePlus vs iPhone,
            <br />
            <span className="text-brand">side by side.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5 max-w-xl text-lg text-black/60">
            Every OnePlus from the {oldest.name} and every iPhone from the iPhone 13, through {launchLabel(newest)}. Launch prices in ₹ and $, tap-to-pay support, and
            every spec. Pick up to four and compare.
          </motion.p>

          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="rounded-2xl bg-white p-3 ring-1 ring-black/5"
              >
                <div className="font-mono text-lg font-medium tracking-tight">{s.value}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-black/50">{s.label}</div>
                {s.sub && <div className="mt-1 truncate text-[11px] font-medium text-brand">{s.sub}</div>}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative hidden h-[360px] items-end justify-center lg:flex">
          <div className="absolute bottom-0 h-24 w-[90%] rounded-[100%] bg-black/10 blur-2xl" />
          {showcase.map((p, i) => {
            const mid = (showcase.length - 1) / 2
            const off = i - mid
            return (
              <motion.button
                key={p.id}
                onClick={() => onPick(p.id)}
                initial={{ opacity: 0, y: 60, rotate: 0 }}
                animate={{ opacity: 1, y: Math.abs(off) * 18, rotate: off * 7 }}
                whileHover={{ y: Math.abs(off) * 18 - 24, scale: 1.06, zIndex: 20 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.2 + i * 0.07 }}
                style={{ zIndex: 10 - Math.abs(off) }}
                className="group relative -mx-6 flex w-44 flex-col items-center"
                title={p.name}
              >
                <div className="rounded-[2rem] bg-white p-4 shadow-xl shadow-black/10 ring-1 ring-black/5">
                  <img src={p.image} alt={p.name} className="h-56 w-32 object-contain mix-blend-multiply" />
                </div>
                <span className="mt-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">{p.name}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
