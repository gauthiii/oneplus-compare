import raw from './data/phones.json'
import links from './data/amazon-links.json'
import metaJson from './data/meta.json'

export const meta = metaJson as { capturedAt: string; source: string }

export type SpecSection = { section: string; rows: [string, string][] }

export type Phone = {
  id: string
  name: string
  series: string
  gsmarenaUrl: string
  image: string
  announced: string
  status: string
  year: number
  month: number | null
  price: string
  display: {
    type: string
    size: string
    resolution: string
    inches: number | null
    refresh: number | null
    peakNits: number | null
    protection: string
  }
  chipset: string
  socShort: string
  socBrand: string
  cpu: string
  gpu: string
  os: string
  memory: string
  ramOptions: number[]
  storageOptions: number[]
  cardSlot: string
  mainCamera: string
  mainCameraCount: string
  mainCameraMp: number | null
  cameraFeatures: string
  video: string
  selfie: string
  selfieMp: number | null
  battery: string
  batteryMah: number | null
  charging: string
  wiredW: number | null
  wirelessW: number | null
  dimensions: string
  weight: string
  weightG: number | null
  build: string
  ipRating: string | null
  colors: string
  models: string
  nfc: string
  usb: string
  antutu: number | null
  onSale: boolean
  brand: 'OnePlus' | 'Apple'
  priceInr: number | null
  priceInrVariant?: string | null
  priceInrSource?: string | null
  priceInrKind?: string
  priceUsd: number | null
  priceUsdVariant?: string | null
  priceUsdSource?: string | null
  priceUsdKind?: string
  priceNote?: string
  nfcSupport: 'yes' | 'regional' | 'no'
  tapToPay: string | null
  sourceName: string
  sourceUrl: string
  sections: SpecSection[]
}

// Image paths in phones.json are root-relative ("/phones/x.jpg"); prefix the
// Vite base so they also resolve when hosted under a subpath (GitHub Pages).
export const phones = (raw as unknown as Phone[]).map((p) => ({
  ...p,
  image: p.image.startsWith('/') ? import.meta.env.BASE_URL + p.image.slice(1) : p.image,
}))

export const BRAND_SERIES: Record<Phone['brand'], string[]> = {
  OnePlus: ['Flagship', 'R series', 'Open', 'Nord', 'Nord CE', 'Nord N', 'Ace', 'Turbo'],
  Apple: ['iPhone', 'iPhone Pro', 'iPhone Air', 'iPhone e & SE', 'iPhone Duo'],
}
export const SERIES_ORDER = [...BRAND_SERIES.OnePlus, ...BRAND_SERIES.Apple]

export const SERIES_COLORS: Record<string, string> = {
  Flagship: 'bg-brand text-white',
  'R series': 'bg-ink text-white',
  Open: 'bg-amber-500 text-white',
  Nord: 'bg-sky-600 text-white',
  'Nord CE': 'bg-teal-600 text-white',
  'Nord N': 'bg-indigo-500 text-white',
  Ace: 'bg-violet-600 text-white',
  Turbo: 'bg-orange-600 text-white',
  iPhone: 'bg-zinc-800 text-white',
  'iPhone Pro': 'bg-zinc-500 text-white',
  'iPhone Air': 'bg-sky-500 text-white',
  'iPhone e & SE': 'bg-zinc-300 text-zinc-800',
  'iPhone Duo': 'bg-gradient-to-r from-zinc-700 to-zinc-400 text-white',
}

export const fmtInr = (n: number | null | undefined) => (n == null ? '–' : `₹${n.toLocaleString('en-IN')}`)
export const fmtUsd = (n: number | null | undefined) => (n == null ? '–' : `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`)

/** Short battery label: mAh when published (OnePlus), otherwise Apple's video-playback rating. */
export const batteryShort = (p: Phone) => {
  if (p.batteryMah) return `${p.batteryMah} mAh`
  const h = p.battery.match(/Up to (\d+) hours/)
  return h ? `${h[1]} h video` : ''
}
export const chargeShort = (p: Phone) =>
  [p.wiredW && `${p.wiredW}W`, p.wirelessW && `${p.wirelessW}W wireless`].filter(Boolean).join(' · ')

type LinkOverrides = Record<string, { in?: string; us?: string }>
const overrides = links as LinkOverrides

/** Amazon link for a phone. Uses a verified product URL from amazon-links.json if one exists, else an exact-model search. */
export function amazonLink(p: Phone, region: 'in' | 'us') {
  const direct = overrides[p.id]?.[region]
  if (direct) return { url: direct, direct: true }
  const host = region === 'in' ? 'https://www.amazon.in' : 'https://www.amazon.com'
  return { url: `${host}/s?k=${encodeURIComponent(p.name)}`, direct: false }
}

export const fmtStorage = (gb: number) => (gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`)

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const launchLabel = (p: Phone) => (p.month ? `${MONTHS[p.month - 1]} ${p.year}` : `${p.year}`)

export const max = (a: number[]) => (a.length ? Math.max(...a) : null)

/** Key comparable metrics; `better` says whether higher or lower wins. */
export const METRICS: {
  key: string
  label: string
  unit?: string
  better: 'high' | 'low'
  get: (p: Phone) => number | null
}[] = [
  { key: 'inr', label: 'Price (India)', unit: '₹', better: 'low', get: (p) => p.priceInr },
  { key: 'usd', label: 'Price (US)', unit: '$', better: 'low', get: (p) => p.priceUsd },
  { key: 'battery', label: 'Battery', unit: 'mAh', better: 'high', get: (p) => p.batteryMah },
  { key: 'wired', label: 'Wired charging', unit: 'W', better: 'high', get: (p) => p.wiredW },
  { key: 'wireless', label: 'Wireless charging', unit: 'W', better: 'high', get: (p) => p.wirelessW },
  { key: 'refresh', label: 'Refresh rate', unit: 'Hz', better: 'high', get: (p) => p.display.refresh },
  { key: 'nits', label: 'Peak brightness', unit: 'nits', better: 'high', get: (p) => p.display.peakNits },
  { key: 'inches', label: 'Screen size', unit: '″', better: 'high', get: (p) => p.display.inches },
  { key: 'ram', label: 'Max RAM', unit: 'GB', better: 'high', get: (p) => max(p.ramOptions) },
  { key: 'storage', label: 'Max storage', unit: 'GB', better: 'high', get: (p) => max(p.storageOptions) },
  { key: 'mp', label: 'Main camera', unit: 'MP', better: 'high', get: (p) => p.mainCameraMp },
  { key: 'weight', label: 'Weight', unit: 'g', better: 'low', get: (p) => p.weightG },
]

export function bestOf(list: Phone[], get: (p: Phone) => number | null, better: 'high' | 'low') {
  const vals = list.map(get).filter((v): v is number => v != null)
  if (!vals.length || list.length < 2) return null
  const b = better === 'high' ? Math.max(...vals) : Math.min(...vals)
  // No winner only when every phone has the same value (a missing value counts as losing)
  return vals.length === list.length && vals.every((v) => v === b) ? null : b
}
