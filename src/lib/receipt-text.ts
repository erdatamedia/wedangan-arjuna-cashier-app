import { formatNumber } from './money'
import { formatWib } from './time'

export const RECEIPT_WIDTH = 32 // 58 mm, font A

export const STORE = {
  name: 'WEDANGAN ARJUNA',
  tagline: 'Rasa Ningrat, Harga Merakyat',
  phone: '085-111-357-657',
  footer: ['Ngombene Anget, Ngobrole Raket', 'Juga tersedia di ShopeeFood', 'Terima kasih'],
}

export interface ReceiptOrder {
  number: string
  paid_at: string
  status: 'open' | 'paid' | 'void' | 'refunded_partial'
  table_no: string | null
  customer_name: string | null
  total: number
}
export interface ReceiptItem {
  name_snapshot: string
  variant_name: string | null
  unit_price: number
  qty: number
  line_total: number
  note: string | null
}
export interface ReceiptPayment {
  method_code: 'cash' | 'qris' | 'transfer'
  amount: number
  tendered: number
  change: number
}

const center = (s: string, w = RECEIPT_WIDTH): string =>
  s.length >= w ? s : ' '.repeat(Math.floor((w - s.length) / 2)) + s

/** Kiri–kanan dalam satu baris; bila terlalu panjang, kiri dipotong. */
function twoCol(left: string, right: string, w = RECEIPT_WIDTH): string {
  const room = w - right.length - 1
  const l = left.length > room ? left.slice(0, Math.max(0, room)) : left
  return l + ' '.repeat(w - l.length - right.length) + right
}

/** Bungkus teks ke beberapa baris, patahkan kata yang lebih panjang dari lebar. */
export function wrap(text: string, w = RECEIPT_WIDTH, indent = ''): string[] {
  const lines: string[] = []
  let cur = ''
  const room = w - indent.length
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let word = raw
    while (word.length > room) {
      if (cur) {
        lines.push(cur)
        cur = ''
      }
      lines.push(word.slice(0, room))
      word = word.slice(room)
    }
    if (!cur) cur = word
    else if ((cur + ' ' + word).length <= room) cur += ' ' + word
    else {
      lines.push(cur)
      cur = word
    }
  }
  if (cur) lines.push(cur)
  return lines.map((l) => indent + l)
}

const METHOD_LABEL = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' } as const
export const methodLabel = (m: ReceiptPayment['method_code']): string => METHOD_LABEL[m]

export function buildReceiptText(args: {
  order: ReceiptOrder
  items: ReceiptItem[]
  payments: ReceiptPayment[]
  reprint?: boolean
}): string {
  const { order, items, payments, reprint } = args
  const hr = '-'.repeat(RECEIPT_WIDTH)
  const out: string[] = [
    center(STORE.name),
    center(STORE.tagline),
    center(`Telp ${STORE.phone}`),
    hr,
  ]
  if (order.status === 'void') out.push(center('*** DIBATALKAN ***'), hr)
  out.push(`No   : ${order.number}`, `Tgl  : ${formatWib(order.paid_at)}`)
  const meta = [order.table_no ? `Meja: ${order.table_no}` : '', order.customer_name ?? '']
    .filter(Boolean)
    .join('  ')
  if (meta) out.push(...wrap(meta, RECEIPT_WIDTH))
  out.push(hr)

  for (const it of items) {
    const name = it.variant_name ? `${it.name_snapshot} (${it.variant_name})` : it.name_snapshot
    out.push(...wrap(name))
    out.push(twoCol(`  ${it.qty} x ${formatNumber(it.unit_price)}`, formatNumber(it.line_total)))
    if (it.note) out.push(...wrap(`* ${it.note}`, RECEIPT_WIDTH, '  '))
  }
  out.push(hr, twoCol('TOTAL', formatNumber(order.total)))
  for (const p of payments) {
    if (p.method_code === 'cash') {
      out.push(twoCol('Tunai', formatNumber(p.tendered)), twoCol('Kembali', formatNumber(p.change)))
    } else {
      out.push(twoCol(methodLabel(p.method_code), formatNumber(p.amount)))
    }
  }
  out.push(hr, ...STORE.footer.map((f) => center(f)))
  if (reprint) out.push('', center('-- CETAK ULANG --'))
  return out.join('\n')
}
