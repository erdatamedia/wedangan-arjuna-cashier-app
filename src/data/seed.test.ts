import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createDb } from './db'
import { seedMenuIfEmpty } from './seed'

describe('seed menu', () => {
  it('mengisi 59 produk dalam 9 kategori, sekali saja', async () => {
    const db = createDb('test-seed')
    expect(await seedMenuIfEmpty(db, 'HP-TEST')).toBe(true)
    expect(await db.products.count()).toBe(59)
    expect(await db.categories.count()).toBe(9)
    expect(await seedMenuIfEmpty(db, 'HP-TEST')).toBe(false)
    expect(await db.products.count()).toBe(59)
  })

  it('Indomie punya varian wajib Goreng/Kuah', async () => {
    const db = createDb('test-variant')
    await seedMenuIfEmpty(db, 'HP-TEST')
    const indomie = await db.products.where('sku').equals('MIE-01').first()
    expect(indomie?.variant_required).toBe(true)
    const v = await db.product_variants.where('product_id').equals(indomie!.id).sortBy('sort')
    expect(v.map((x) => x.name)).toEqual(['Goreng', 'Kuah'])
  })

  it('harga integer dan sesuai spesifikasi', async () => {
    const db = createDb('test-price')
    await seedMenuIfEmpty(db, 'HP-TEST')
    const all = await db.products.toArray()
    expect(all.every((p) => Number.isInteger(p.price) && p.price > 0)).toBe(true)
    expect(Math.min(...all.map((p) => p.price))).toBe(4000)
    expect(Math.max(...all.map((p) => p.price))).toBe(25000)
  })
})
