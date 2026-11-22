import { newId } from '../../lib/id'
import { calcChange, formatRupiah } from '../../lib/money'
import { calcSubtotal, calcTotal, lineTotal } from '../../lib/order-math'
import { nowIso, wibDateCode, wibDateKey, wibDayRange } from '../../lib/time'
import type {
  ArjunaDB,
  Order,
  OrderItem,
  OrderType,
  Payment,
  PaymentMethod,
  SyncFields,
} from '../db'
import { outboxEntry } from './outbox'

export interface NewOrderLine {
  productId: string
  sku: string
  name: string
  variantName: string | null
  unitPrice: number
  qty: number
  note: string
}

export interface NewOrderInput {
  lines: NewOrderLine[]
  orderType: OrderType
  customerName?: string
  tableNo?: string
  method: PaymentMethod
  tendered?: number // wajib untuk tunai
  reference?: string
  now?: string // untuk uji
}

export interface OrderBundle {
  order: Order
  items: OrderItem[]
  payments: Payment[]
}

export const VOID_REASONS = ['Salah input', 'Pelanggan batal'] as const

const trimOrNull = (s?: string): string | null => (s?.trim() ? s.trim() : null)

/**
 * Simpan pesanan lunas. Satu transaksi Dexie menulis: order, item, pembayaran, counter nomor struk,
 * dan entri outbox. Baru setelah ini selesai layar sukses boleh tampil.
 */
export async function createPaidOrder(
  db: ArjunaDB,
  deviceId: string,
  input: NewOrderInput,
): Promise<OrderBundle> {
  if (input.lines.length === 0) throw new Error('Keranjang kosong')
  for (const l of input.lines) {
    if (!Number.isInteger(l.qty) || l.qty < 1) throw new Error(`Jumlah tidak valid: ${l.name}`)
    if (!Number.isInteger(l.unitPrice) || l.unitPrice < 0)
      throw new Error(`Harga tidak valid: ${l.name}`)
  }
  const subtotal = calcSubtotal(input.lines)
  const total = calcTotal(subtotal)

  let tendered = total
  if (input.method === 'cash') {
    if (input.tendered === undefined || !Number.isInteger(input.tendered))
      throw new Error('Nominal uang tunai wajib diisi')
    if (input.tendered < total)
      throw new Error(
        `Uang kurang: total ${formatRupiah(total)}, diterima ${formatRupiah(input.tendered)}`,
      )
    tendered = input.tendered
  }

  const paidAt = input.now ?? nowIso()
  const sync = (): SyncFields => ({
    id: newId(),
    created_at: paidAt,
    updated_at: paidAt,
    deleted_at: null,
    version: 1,
    device_id: deviceId,
    synced_at: null,
  })

  return db.transaction(
    'rw',
    [db.orders, db.order_items, db.payments, db.counters, db.outbox],
    async () => {
      // Counter per tanggal WIB; tidak pernah dipakai ulang walau transaksi dibatalkan.
      const counterKey = `order-${wibDateKey(paidAt)}`
      const next = ((await db.counters.get(counterKey))?.value ?? 0) + 1
      await db.counters.put({ key: counterKey, value: next })

      const order: Order = {
        ...sync(),
        number: `ARJ-${wibDateCode(paidAt)}-${String(next).padStart(3, '0')}`,
        status: 'paid',
        order_type: input.orderType,
        customer_name: trimOrNull(input.customerName),
        table_no: trimOrNull(input.tableNo),
        subtotal,
        discount_total: 0,
        tax_total: 0,
        service_total: 0,
        rounding: 0,
        total,
        shift_id: null,
        cashier_id: null,
        paid_at: paidAt,
        voided_at: null,
        void_reason: null,
        note: null,
      }
      const items: OrderItem[] = input.lines.map((l) => ({
        ...sync(),
        order_id: order.id,
        product_id: l.productId,
        sku: l.sku,
        name_snapshot: l.name,
        variant_name: l.variantName,
        unit_price: l.unitPrice, // snapshot harga saat transaksi
        qty: l.qty,
        discount: 0,
        line_total: lineTotal({ unitPrice: l.unitPrice, qty: l.qty }),
        note: l.note.trim() || null,
      }))
      const payment: Payment = {
        ...sync(),
        order_id: order.id,
        method_code: input.method,
        amount: total,
        tendered,
        change: input.method === 'cash' ? calcChange(tendered, total) : 0,
        reference: trimOrNull(input.reference),
        paid_at: paidAt,
      }
      const bundle: OrderBundle = { order, items, payments: [payment] }

      await db.orders.add(order)
      await db.order_items.bulkAdd(items)
      await db.payments.add(payment)
      await db.outbox.add(outboxEntry('order_bundle', order.id, 'upsert', bundle))
      return bundle
    },
  )
}

/**
 * Batalkan penuh. Item dan pembayaran tidak disentuh; hanya status pada order yang berubah.
 * (Fase 2: wajib PIN pemilik + audit log.)
 */
export async function voidOrder(
  db: ArjunaDB,
  deviceId: string,
  orderId: string,
  reason: string,
  now: string = nowIso(),
): Promise<Order> {
  const why = reason.trim()
  if (!why) throw new Error('Alasan pembatalan wajib diisi')
  return db.transaction('rw', [db.orders, db.outbox], async () => {
    const order = await db.orders.get(orderId)
    if (!order) throw new Error('Transaksi tidak ditemukan')
    if (order.status !== 'paid') throw new Error('Hanya transaksi lunas yang bisa dibatalkan')
    const updated: Order = {
      ...order,
      status: 'void',
      voided_at: now,
      void_reason: why,
      updated_at: now,
      version: order.version + 1,
      device_id: deviceId,
      synced_at: null,
    }
    await db.orders.put(updated)
    await db.outbox.add(outboxEntry('order', updated.id, 'upsert', updated))
    return updated
  })
}

export async function getOrderBundle(db: ArjunaDB, orderId: string): Promise<OrderBundle | null> {
  const order = await db.orders.get(orderId)
  if (!order) return null
  const [items, payments] = await Promise.all([
    db.order_items.where('order_id').equals(orderId).toArray(),
    db.payments.where('order_id').equals(orderId).toArray(),
  ])
  return { order, items, payments }
}

/** Transaksi pada satu hari WIB, terbaru di atas. */
export async function listOrdersForDay(db: ArjunaDB, dateKey: string): Promise<Order[]> {
  const [from, to] = wibDayRange(dateKey)
  return (await db.orders.where('paid_at').between(from, to, true, false).toArray()).sort((a, b) =>
    b.paid_at.localeCompare(a.paid_at),
  )
}

export interface DailySummary {
  paidCount: number
  voidCount: number
  revenue: number // omzet: hanya transaksi lunas (void tidak dihitung)
  average: number
  voidTotal: number
  byMethod: Record<PaymentMethod, number>
  itemsSold: number
}

export async function dailySummary(db: ArjunaDB, dateKey: string): Promise<DailySummary> {
  const orders = await listOrdersForDay(db, dateKey)
  const paid = orders.filter((o) => o.status === 'paid')
  const voids = orders.filter((o) => o.status === 'void')
  const paidIds = paid.map((o) => o.id)
  const [payments, items] = await Promise.all([
    db.payments.where('order_id').anyOf(paidIds).toArray(),
    db.order_items.where('order_id').anyOf(paidIds).toArray(),
  ])
  const byMethod: Record<PaymentMethod, number> = { cash: 0, qris: 0, transfer: 0 }
  for (const p of payments) byMethod[p.method_code] += p.amount // amount = tanpa kembalian
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  return {
    paidCount: paid.length,
    voidCount: voids.length,
    revenue,
    average: paid.length ? Math.round(revenue / paid.length) : 0,
    voidTotal: voids.reduce((s, o) => s + o.total, 0),
    byMethod,
    itemsSold: items.reduce((s, i) => s + i.qty, 0),
  }
}
