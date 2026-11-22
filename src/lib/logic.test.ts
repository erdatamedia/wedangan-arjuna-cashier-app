import { describe, expect, it } from 'vitest'
import { cartCount, cartReducer, cartSubtotal, type CartLine } from '../features/pos/cart'
import { calcSubtotal, calcTotal, lineTotal, quickCashOptions } from './order-math'
import { buildReceiptText, RECEIPT_WIDTH, wrap } from './receipt-text'

describe('order-math', () => {
  it('menghitung line_total, subtotal, total', () => {
    expect(lineTotal({ unitPrice: 10000, qty: 2 })).toBe(20000)
    expect(lineTotal({ unitPrice: 10000, qty: 2, discount: 1000 })).toBe(19000)
    const sub = calcSubtotal([
      { unitPrice: 10000, qty: 2 },
      { unitPrice: 5000, qty: 1 },
      { unitPrice: 7000, qty: 1 },
    ])
    expect(sub).toBe(32000)
    expect(calcTotal(sub)).toBe(32000)
  })
  it('total memakai diskon pesanan, service, pajak, pembulatan bertanda', () => {
    expect(calcTotal(32300, { rounding: 200 })).toBe(32500)
    expect(calcTotal(32500, { rounding: -300 })).toBe(32200)
    expect(calcTotal(30000, { discountTotal: 5000, serviceTotal: 1000, taxTotal: 2000 })).toBe(
      28000,
    )
  })
  it('menolak pecahan', () => {
    expect(() => lineTotal({ unitPrice: 10.5, qty: 1 })).toThrow()
  })
  it('tombol uang cepat: pas + pembulatan, tanpa duplikat', () => {
    expect(quickCashOptions(32000)).toEqual([32000, 35000, 40000, 50000, 100000])
    expect(quickCashOptions(50000)).toEqual([50000, 60000, 100000])
    expect(quickCashOptions(4000)).toEqual([4000, 5000, 10000, 20000, 50000])
  })
})

const nasi = {
  productId: 'p1',
  sku: 'NSI-01',
  name: 'Nasi Goreng Arjuna',
  variantName: null,
  unitPrice: 10000,
}

describe('cart reducer', () => {
  it('menambah item yang sama menaikkan qty, varian/catatan beda = baris beda', () => {
    let c: CartLine[] = []
    c = cartReducer(c, { type: 'add', line: nasi })
    c = cartReducer(c, { type: 'add', line: nasi })
    c = cartReducer(c, { type: 'add', line: { ...nasi, note: 'pedas' } })
    c = cartReducer(c, { type: 'add', line: { ...nasi, variantName: 'Kuah' } })
    expect(c).toHaveLength(3)
    expect(c[0].qty).toBe(2)
    expect(cartCount(c)).toBe(4)
    expect(cartSubtotal(c)).toBe(40000)
  })
  it('qty 0 menghapus baris, remove & clear bekerja', () => {
    let c = cartReducer([], { type: 'add', line: nasi })
    c = cartReducer(c, { type: 'setQty', key: c[0].key, qty: 3 })
    expect(c[0].qty).toBe(3)
    c = cartReducer(c, { type: 'setQty', key: c[0].key, qty: 0 })
    expect(c).toEqual([])
    c = cartReducer([], { type: 'add', line: nasi })
    expect(cartReducer(c, { type: 'clear' })).toEqual([])
    expect(cartReducer(c, { type: 'remove', key: c[0].key })).toEqual([])
  })
})

describe('struk 58 mm', () => {
  const order = {
    number: 'ARJ-261122-007',
    paid_at: '2026-11-22T11:05:12Z',
    status: 'paid' as const,
    table_no: '3',
    customer_name: null,
    total: 32000,
  }
  const items = [
    {
      name_snapshot: 'Nasi Goreng Arjuna',
      variant_name: null,
      unit_price: 10000,
      qty: 2,
      line_total: 20000,
      note: null,
    },
    {
      name_snapshot: 'Es Teh Manis',
      variant_name: null,
      unit_price: 5000,
      qty: 1,
      line_total: 5000,
      note: 'kurang manis',
    },
    {
      name_snapshot: 'Indomie',
      variant_name: 'Kuah',
      unit_price: 7000,
      qty: 1,
      line_total: 7000,
      note: null,
    },
  ]
  const payments = [{ method_code: 'cash' as const, amount: 32000, tendered: 50000, change: 18000 }]

  it('memuat data penting dan tidak ada baris > 32 kolom', () => {
    const t = buildReceiptText({ order, items, payments })
    expect(t).toContain('No   : ARJ-261122-007')
    expect(t).toContain('Tgl  : 22/11/2026 18:05')
    expect(t).toContain('Indomie (Kuah)')
    expect(t).toContain('  * kurang manis')
    expect(t).toMatch(/TOTAL {21}32\.000/)
    expect(t).toMatch(/Tunai {21}50\.000/)
    expect(t).toMatch(/Kembali {19}18\.000/)
    for (const l of t.split('\n')) expect(l.length).toBeLessThanOrEqual(RECEIPT_WIDTH)
  })
  it('struk batal dan cetak ulang diberi tanda', () => {
    const v = buildReceiptText({
      order: { ...order, status: 'void' },
      items,
      payments,
      reprint: true,
    })
    expect(v).toContain('*** DIBATALKAN ***')
    expect(v).toContain('-- CETAK ULANG --')
  })
  it('nama panjang dibungkus, kata sangat panjang dipatahkan', () => {
    const w = wrap('Wedang Sehat Datang Bulan Spesial Istimewa Banget')
    expect(w.length).toBeGreaterThan(1)
    expect(w.every((l) => l.length <= RECEIPT_WIDTH)).toBe(true)
    expect(wrap('x'.repeat(70)).every((l) => l.length <= RECEIPT_WIDTH)).toBe(true)
  })
})
