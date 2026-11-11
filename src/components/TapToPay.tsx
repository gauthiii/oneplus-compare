import { Nfc } from 'lucide-react'
import clsx from 'clsx'
import type { Phone } from '../lib'

/** NFC / contactless-payment badge. "regional" = NFC only in some markets. */
export function TapToPay({ phone: p, size = 'sm' }: { phone: Phone; size?: 'sm' | 'md' }) {
  const label = p.nfcSupport === 'yes' ? (p.brand === 'Apple' ? 'Apple Pay' : 'Tap to pay') : p.nfcSupport === 'regional' ? 'NFC varies by region' : 'No NFC'
  return (
    <span
      title={p.nfcSupport === 'no' ? 'No NFC: cannot pay by tapping the phone' : `NFC: ${p.nfc}${p.tapToPay ? ` · ${p.tapToPay}` : ''}`}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        p.nfcSupport === 'yes' && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
        p.nfcSupport === 'regional' && 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
        p.nfcSupport === 'no' && 'bg-black/5 text-black/45',
      )}
    >
      <Nfc className="size-3" />
      {label}
    </span>
  )
}
