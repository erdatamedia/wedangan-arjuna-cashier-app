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
  outbox: EntityTable<OutboxEntry, 'id'>
  kv: EntityTable<KV, 'key'>
}

export function createDb(name = 'kasir-arjuna'): ArjunaDB {
  const db = new Dexie(name) as ArjunaDB
  // Skema sebagian (fase 0). Tabel transaksi dll. ditambahkan lewat db.version(n) di fase 1.
  db.version(1).stores({
    categories: 'id, sort, updated_at',
    products: 'id, category_id, sku, name, updated_at',
    product_variants: 'id, product_id',
    outbox: 'id, created_at, entity',
    kv: 'key',
  })
  return db
}

export const db = createDb()
