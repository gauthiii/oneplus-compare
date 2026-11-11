import clsx from 'clsx'
import { fmtInr, fmtUsd, type Phone } from '../lib'

/** Launch prices in ₹ and $; a dash means no sourced launch price for that country. */
export function PriceTag({ phone: p, className }: { phone: Phone; className?: string }) {
  const rows = [
    { flag: '🇮🇳', v: p.priceInr, f: fmtInr, kind: p.priceInrKind, variant: p.priceInrVariant },
    { flag: '🇺🇸', v: p.priceUsd, f: fmtUsd, kind: p.priceUsdKind, variant: p.priceUsdVariant },
  ]
  return (
    <div className={clsx('flex items-baseline gap-3', className)}>
      {rows.map((r) => (
        <span key={r.flag} title={r.v != null ? `${r.kind ?? 'Launch price'}${r.variant && r.variant !== 'starting' ? ` · ${r.variant}` : ''}` : 'No sourced launch price for this country'} className="flex items-baseline gap-1">
          <span aria-hidden className="text-[11px]">{r.flag}</span>
          <span className={clsx('font-mono text-[13px] font-medium tracking-tight', r.v == null && 'text-black/30')}>{r.f(r.v)}</span>
        </span>
      ))}
    </div>
  )
}
