import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, X } from 'lucide-react'
import type { Phone } from '../lib'

export function CompareTray({ phones, onRemove, onClear, onCompare }: { phones: Phone[]; onRemove: (id: string) => void; onClear: () => void; onCompare: () => void }) {
  return (
    <AnimatePresence>
      {phones.length > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(720px,calc(100%-2rem))]"
        >
          <div className="flex items-center gap-3 rounded-[1.75rem] bg-ink p-2.5 pl-3 text-white shadow-2xl shadow-black/30">
            <div className="flex flex-1 gap-2 overflow-x-auto no-scrollbar">
              {[0, 1, 2, 3].map((i) => {
                const p = phones[i]
                return p ? (
                  <motion.div layout key={p.id} className="relative flex shrink-0 items-center gap-2 rounded-2xl bg-white/10 py-1.5 pl-1.5 pr-7">
                    <span className="grid size-9 place-items-center rounded-xl bg-white">
                      <img src={p.image} alt="" className="h-8 object-contain" />
                    </span>
                    <span className="max-w-24 truncate text-xs font-medium">{p.name.replace('OnePlus ', '')}</span>
                    <button onClick={() => onRemove(p.id)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label={`Remove ${p.name}`}>
                      <X className="size-3.5" />
                    </button>
                  </motion.div>
                ) : (
                  <div key={`e${i}`} className="hidden size-12 shrink-0 place-items-center rounded-2xl border border-dashed border-white/20 text-[10px] text-white/30 sm:grid">
                    +
                  </div>
                )
              })}
            </div>
            <button onClick={onClear} className="hidden text-xs text-white/50 hover:text-white sm:block">
              Clear
            </button>
            <button
              onClick={onCompare}
              disabled={phones.length < 2}
              className="flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-brand px-5 text-sm font-semibold transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
            >
              {phones.length < 2 ? 'Pick one more' : `Compare ${phones.length}`}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
