import Dexie, { type EntityTable } from 'dexie'

// Kolom standar tabel yang disinkron (Bagian 8). Dipakai sejak fase 0 agar fase 2 tinggal menyambung.
export interface SyncFields {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  version: number
  device_id: string
  synced_at: string | null
}

export interface Category extends SyncFields {
  name: string
  group: 'makanan' | 'minuman'
  sort: number
  active: boolean
}

export interface Product extends SyncFields {
  category_id: string
  sku: string
  name: string
  price: number // integer Rupiah
  favorite: boolean
  active: boolean
  variant_required: boolean
}

export interface ProductVariant extends SyncFields {
  product_id: string
  name: string
  price_delta: number
  sort: number
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer'
export type OrderStatus = 'open' | 'paid' | 'void' | 'refunded_partial'
export type OrderType = 'dine_in' | 'takeaway' | 'online'

export interface Order extends SyncFields {
  number: string // ARJ-YYMMDD-NNN
  status: OrderStatus
  order_type: OrderType
  customer_name: string | null
  table_no: string | null
  subtotal: number
  discount_total: number
  tax_total: number
  service_total: number
  rounding: number
  total: number
  shift_id: string | null // null di fase 1 (belum ada shift)
  cashier_id: string | null // null di fase 1 (belum ada pengguna)
  paid_at: string
  voided_at: string | null
  void_reason: string | null
  note: string | null
}

export interface OrderItem extends SyncFields {
  order_id: string
  product_id: string
  sku: string
  name_snapshot: string
  variant_name: string | null
  unit_price: number // snapshot harga saat transaksi (sudah termasuk selisih varian)
  qty: number
  discount: number
  line_total: number
  note: string | null
}

export interface Payment extends SyncFields {
  order_id: string
  method_code: PaymentMethod
  amount: number
  tendered: number
  change: number
  reference: string | null
  paid_at: string
}

export interface ProductAvailability extends SyncFields {
  product_id: string
  sold_out_date: string | null // YYYY-MM-DD (WIB); habis bila sama dengan hari ini
}

export interface Counter {
  key: string // 'order-2026-11-22'
  value: number
}

export interface OutboxEntry {
  id: string
  entity: string
  entity_id: string
  op: 'upsert' | 'delete'
  payload: unknown
  created_at: string
  attempts: number
  last_error: string | null
}

export interface KV {
  key: string
  value: unknown
}

export type ArjunaDB = Dexie & {
  categories: EntityTable<Category, 'id'>
  products: EntityTable<Product, 'id'>
  product_variants: EntityTable<ProductVariant, 'id'>
  orders: EntityTable<Order, 'id'>
  order_items: EntityTable<OrderItem, 'id'>
  payments: EntityTable<Payment, 'id'>
  product_availability: EntityTable<ProductAvailability, 'id'>
  counters: EntityTable<Counter, 'key'>
  outbox: EntityTable<OutboxEntry, 'id'>
  kv: EntityTable<KV, 'key'>
}

/** Semua tabel yang ikut cadangan. */
export const BACKUP_TABLES = [
  'categories',
  'products',
  'product_variants',
  'orders',
  'order_items',
  'payments',
  'product_availability',
  'counters',
  'outbox',
  'kv',
] as const

export function createDb(name = 'kasir-arjuna'): ArjunaDB {
  const db = new Dexie(name) as ArjunaDB
  db.version(1).stores({
    categories: 'id, sort, updated_at',
    products: 'id, category_id, sku, name, updated_at',
    product_variants: 'id, product_id',
    outbox: 'id, created_at, entity',
    kv: 'key',
  })
  // Fase 1: transaksi. Tabel shift, pengeluaran, stok, dll. menyusul di versi berikutnya.
  db.version(2).stores({
    orders: 'id, number, status, paid_at, [status+paid_at]',
    order_items: 'id, order_id, product_id',
    payments: 'id, order_id, method_code',
    product_availability: 'id, product_id, sold_out_date',
    counters: 'key',
  })
  return db
}

export const db = createDb()
