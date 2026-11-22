// Rumus Bagian 8.7. Semua uang integer Rupiah. Pajak/service/pembulatan nonaktif di fase 1 (bernilai 0).

function assertInt(n: number, label: string): void {
  if (!Number.isInteger(n)) throw new Error(`${label} harus integer: ${n}`)
}

export interface LineInput {
  unitPrice: number
  qty: number
  discount?: number
}

/** line_total = unit_price × qty − discount */
export function lineTotal(l: LineInput): number {
  assertInt(l.unitPrice, 'unitPrice')
  assertInt(l.qty, 'qty')
  return l.unitPrice * l.qty - (l.discount ?? 0)
}

/** subtotal = Σ line_total */
export const calcSubtotal = (lines: LineInput[]): number =>
  lines.reduce((sum, l) => sum + lineTotal(l), 0)

export interface Adjustments {
  discountTotal?: number // hanya diskon tingkat pesanan
  serviceTotal?: number
  taxTotal?: number // hanya bila pajak di luar harga
  rounding?: number // bertanda +/−
}

/** total = subtotal − discount_total + service_total + tax_total + rounding */
export function calcTotal(subtotal: number, a: Adjustments = {}): number {
  return (
    subtotal -
    (a.discountTotal ?? 0) +
    (a.serviceTotal ?? 0) +
    (a.taxTotal ?? 0) +
    (a.rounding ?? 0)
  )
}

/** Tombol uang cepat: uang pas + pembulatan ke atas ke 5rb/10rb/20rb/50rb/100rb (tanpa duplikat). */
export function quickCashOptions(total: number): number[] {
  const set = new Set<number>([total])
  for (const unit of [5000, 10000, 20000, 50000, 100000]) {
    set.add(Math.ceil(total / unit) * unit)
  }
  return [...set]
    .filter((v) => v >= total)
    .sort((a, b) => a - b)
    .slice(0, 5)
}
