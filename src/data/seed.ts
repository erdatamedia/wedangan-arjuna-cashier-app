import { newId } from '../lib/id'
import { nowIso } from '../lib/time'
import type { ArjunaDB, Category, Product, ProductVariant } from './db'
import menu from './seed/menu.json'

interface SeedProduct {
  sku: string
  category: string
  name: string
  price: number
  favorite?: boolean
  variants?: string[]
  variantRequired?: boolean
}

export function getDeviceId(): string {
  const k = 'arjuna-device-id'
  let id = localStorage.getItem(k)
  if (!id) {
    id = `HP-${newId().slice(-8)}`
    localStorage.setItem(k, id)
  }
  return id
}

/** Isi menu awal sekali saja (idempoten: tidak menimpa data yang sudah ada). */
export async function seedMenuIfEmpty(db: ArjunaDB, deviceId: string): Promise<boolean> {
  if ((await db.products.count()) > 0) return false
  const at = nowIso()
  const base = {
    created_at: at,
    updated_at: at,
    deleted_at: null,
    version: 1,
    device_id: deviceId,
    synced_at: null,
  }

  const catIds = new Map<string, string>()
  const categories: Category[] = menu.categories.map((c) => {
    const id = newId()
    catIds.set(c.id, id)
    return {
      ...base,
      id,
      name: c.name,
      group: c.group as Category['group'],
      sort: c.sort,
      active: true,
    }
  })

  const products: Product[] = []
  const variants: ProductVariant[] = []
  for (const p of menu.products as SeedProduct[]) {
    const id = newId()
    products.push({
      ...base,
      id,
      category_id: catIds.get(p.category)!,
      sku: p.sku,
      name: p.name,
      price: p.price,
      favorite: p.favorite ?? false,
      active: true,
      variant_required: p.variantRequired ?? false,
    })
    p.variants?.forEach((name, i) =>
      variants.push({ ...base, id: newId(), product_id: id, name, price_delta: 0, sort: i + 1 }),
    )
  }

  await db.transaction('rw', db.categories, db.products, db.product_variants, async () => {
    await db.categories.bulkAdd(categories)
    await db.products.bulkAdd(products)
    await db.product_variants.bulkAdd(variants)
  })
  return true
}
