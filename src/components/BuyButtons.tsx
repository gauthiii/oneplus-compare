import { ArrowUpRight, Ban } from 'lucide-react'
import clsx from 'clsx'
import { amazonLink, type Phone } from '../lib'

export function BuyButtons({ phone, size = 'md' }: { phone: Phone; size?: 'sm' | 'md' }) {
  const regions = [
    { r: 'in' as const, label: 'Amazon.in', flag: '🇮🇳' },
    { r: 'us' as const, label: 'Amazon.com', flag: '🇺🇸' },
  ]
  if (!phone.onSale)
    return (
      <div
        className={clsx(
          'flex items-center justify-center gap-1.5 rounded-full border border-dashed border-black/15 font-medium text-black/50',
          size === 'sm' ? 'h-9 text-xs' : 'h-11 text-sm',
        )}
      >
        <Ban className="size-3.5" /> Not on sale now
      </div>
    )
  return (
    <div className="grid grid-cols-2 gap-2">
      {regions.map(({ r, label, flag }) => {
        const { url, direct } = amazonLink(phone, r)
        return (
          <a
            key={r}
            href={url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            title={direct ? `Buy ${phone.name} on ${label}` : `Search ${label} for “${phone.name}”`}
            className={clsx(
              'group/buy flex items-center justify-center gap-1 rounded-full font-medium transition',
              size === 'sm' ? 'h-9 text-xs' : 'h-11 text-sm',
              r === 'in' ? 'bg-ink text-white hover:bg-brand' : 'bg-paper text-ink ring-1 ring-black/10 hover:bg-white hover:ring-black/30',
            )}
          >
            <span aria-hidden>{flag}</span>
            {label}
            <ArrowUpRight className="size-3.5 opacity-60 transition group-hover/buy:-translate-y-px group-hover/buy:translate-x-px group-hover/buy:opacity-100" />
          </a>
        )
      })}
    </div>
  )
}
