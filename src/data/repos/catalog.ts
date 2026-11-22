import { newId } from '../../lib/id'
import { nowIso, todayWib } from '../../lib/time'
import type { ArjunaDB, ProductAvailability } from '../db'
import { outboxEntry } from './outbox'

/** Set (product_id -> habis hari ini) untuk tanggal WIB tertentu. */
export async function soldOutProductIds(db: ArjunaDB, dateKey = todayWib()): Promise<Set<string>> {
  const rows = await db.product_availability.where('sold_out_date').equals(dateKey).toArray()
  return new Set(rows.map((r) => r.product_id))
}

/** Tandai/batalkan "habis hari ini". Disimpan di tabel terpisah agar tidak menimpa edit harga. */
export async function setSoldOut(
  db: ArjunaDB,
  deviceId: string,
  productId: string,
  soldOut: boolean,
  dateKey = todayWib(),
): Promise<void> {
  await db.transaction('rw', [db.product_availability, db.outbox], async () => {
    const now = nowIso()
    const existing = await db.product_availability.where('product_id').equals(productId).first()
    const row: ProductAvailability = existing
      ? {
          ...existing,
          sold_out_date: soldOut ? dateKey : null,
          updated_at: now,
          version: existing.version + 1,
          device_id: deviceId,
          synced_at: null,
        }
      : {
          id: newId(),
          product_id: productId,
          sold_out_date: soldOut ? dateKey : null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
          version: 1,
          device_id: deviceId,
          synced_at: null,
        }
    await db.product_availability.put(row)
    await db.outbox.add(outboxEntry('product_availability', row.id, 'upsert', row))
  })
}
