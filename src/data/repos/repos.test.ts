import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, type ArjunaDB } from '../db'
import { seedMenuIfEmpty } from '../seed'
import { exportBackup, importBackup, parseBackup } from './backup'
import { setSoldOut, soldOutProductIds } from './catalog'
import {
  createPaidOrder,
  dailySummary,
  getOrderBundle,
  listOrdersForDay,
  voidOrder,
  type NewOrderLine,
} from './orders'

let db: ArjunaDB
let n = 0
const DEV = 'HP-TEST'
const AT = '2026-11-22T11:05:12Z' // 18:05 WIB

const line = (over: Partial<NewOrderLine> = {}): NewOrderLine => ({
  productId: 'p1',
  sku: 'NSI-01',
  name: 'Nasi Goreng Arjuna',
  variantName: null,
  unitPrice: 10000,
  qty: 2,
  note: '',
  ...over,
})

beforeEach(async () => {
  db = createDb(`test-repos-${n++}`)
  await seedMenuIfEmpty(db, DEV)
})

describe('createPaidOrder', () => {
  it('menyimpan order, item, pembayaran tunai + kembalian, dan outbox dalam satu transaksi', async () => {
    const b = await createPaidOrder(db, DEV, {
      lines: [
        line(),
        line({
          productId: 'p2',
          sku: 'ESG-01',
          name: 'Es Teh Manis',
          unitPrice: 5000,
          qty: 1,
          note: 'kurang manis',
        }),
      ],
      orderType: 'dine_in',
      tableNo: '3',
      method: 'cash',
      tendered: 50000,
      now: AT,
    })
    expect(b.order.number).toBe('ARJ-261122-001')
    expect(b.order.total).toBe(25000)
    expect(b.payments[0]).toMatchObject({
      method_code: 'cash',
      amount: 25000,
      tendered: 50000,
      change: 25000,
    })
    expect(await db.orders.count()).toBe(1)
    expect(await db.order_items.count()).toBe(2)
    const out = await db.outbox.toArray()
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ entity: 'order_bundle', entity_id: b.order.id, op: 'upsert' })
  })

  it('menolak uang kurang, keranjang kosong, qty tidak valid; tidak ada yang tersimpan', async () => {
    await expect(
      createPaidOrder(db, DEV, {
        lines: [line()],
        orderType: 'dine_in',
        method: 'cash',
        tendered: 5000,
        now: AT,
      }),
    ).rejects.toThrow(/Uang kurang/)
    await expect(
      createPaidOrder(db, DEV, {
        lines: [],
        orderType: 'dine_in',
        method: 'cash',
        tendered: 1,
        now: AT,
      }),
    ).rejects.toThrow()
    await expect(
      createPaidOrder(db, DEV, {
        lines: [line({ qty: 0 })],
        orderType: 'dine_in',
        method: 'qris',
        now: AT,
      }),
    ).rejects.toThrow()
    expect(await db.orders.count()).toBe(0)
    expect(await db.counters.count()).toBe(0)
    expect(await db.outbox.count()).toBe(0)
  })

  it('QRIS/transfer: tanpa kembalian, menyimpan referensi', async () => {
    const b = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'takeaway',
      method: 'qris',
      reference: ' REF123 ',
      now: AT,
    })
    expect(b.payments[0]).toMatchObject({
      method_code: 'qris',
      amount: 20000,
      change: 0,
      reference: 'REF123',
    })
  })

  it('nomor struk berurutan, unik untuk 50 transaksi, reset per hari WIB', async () => {
    const nums: string[] = []
    for (let i = 0; i < 50; i++) {
      nums.push(
        (
          await createPaidOrder(db, DEV, {
            lines: [line()],
            orderType: 'dine_in',
            method: 'qris',
            now: AT,
          })
        ).order.number,
      )
    }
    expect(new Set(nums).size).toBe(50)
    expect(nums[0]).toBe('ARJ-261122-001')
    expect(nums[49]).toBe('ARJ-261122-050')
    // 18:00 UTC = 01:00 WIB hari berikutnya
    const next = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'qris',
      now: '2026-11-22T18:00:00Z',
    })
    expect(next.order.number).toBe('ARJ-261123-001')
  })

  it('nomor tidak dipakai ulang setelah void', async () => {
    const a = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'qris',
      now: AT,
    })
    await voidOrder(db, DEV, a.order.id, 'Salah input')
    const b = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'qris',
      now: AT,
    })
    expect(b.order.number).toBe('ARJ-261122-002')
  })

  it('harga dibekukan: ubah harga produk tidak mengubah transaksi lama', async () => {
    const p = (await db.products.where('sku').equals('NSI-01').first())!
    const b = await createPaidOrder(db, DEV, {
      lines: [line({ productId: p.id, unitPrice: p.price })],
      orderType: 'dine_in',
      method: 'qris',
      now: AT,
    })
    await db.products.update(p.id, { price: 99000, name: 'Nama Baru' })
    const got = (await getOrderBundle(db, b.order.id))!
    expect(got.items[0].unit_price).toBe(10000)
    expect(got.items[0].name_snapshot).toBe('Nasi Goreng Arjuna')
    expect(got.order.total).toBe(20000)
  })
})

describe('voidOrder', () => {
  it('mengubah status saja, item & pembayaran utuh, menambah outbox, alasan wajib', async () => {
    const b = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'cash',
      tendered: 20000,
      now: AT,
    })
    await expect(voidOrder(db, DEV, b.order.id, '  ')).rejects.toThrow(/Alasan/)
    const v = await voidOrder(db, DEV, b.order.id, 'Pelanggan batal', '2026-11-22T12:00:00Z')
    expect(v).toMatchObject({
      status: 'void',
      void_reason: 'Pelanggan batal',
      version: 2,
      synced_at: null,
    })
    const got = (await getOrderBundle(db, b.order.id))!
    expect(got.items).toEqual(b.items)
    expect(got.payments).toEqual(b.payments)
    expect(await db.outbox.count()).toBe(2)
  })

  it('tidak bisa membatalkan dua kali', async () => {
    const b = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'qris',
      now: AT,
    })
    await voidOrder(db, DEV, b.order.id, 'Salah input')
    await expect(voidOrder(db, DEV, b.order.id, 'Salah input')).rejects.toThrow(/lunas/)
  })
})

describe('rekap harian', () => {
  it('menghitung omzet tanpa void, per metode (tanpa kembalian), dan memilah hari WIB', async () => {
    const mk = (over: Parameters<typeof createPaidOrder>[2]) => createPaidOrder(db, DEV, over)
    await mk({ lines: [line()], orderType: 'dine_in', method: 'cash', tendered: 50000, now: AT }) // 20.000 tunai
    await mk({
      lines: [line({ qty: 1, unitPrice: 15000 })],
      orderType: 'dine_in',
      method: 'qris',
      now: '2026-11-22T03:00:00Z',
    }) // 15.000
    const gone = await mk({
      lines: [line({ qty: 3 })],
      orderType: 'dine_in',
      method: 'cash',
      tendered: 30000,
      now: '2026-11-22T11:10:00Z',
    }) // 30.000, void
    await voidOrder(db, DEV, gone.order.id, 'Salah input')
    await mk({ lines: [line()], orderType: 'dine_in', method: 'qris', now: '2026-11-22T18:00:00Z' }) // hari berikutnya WIB

    const s = await dailySummary(db, '2026-11-22')
    expect(s).toMatchObject({
      paidCount: 2,
      voidCount: 1,
      revenue: 35000,
      average: 17500,
      voidTotal: 30000,
      itemsSold: 3,
    })
    expect(s.byMethod).toEqual({ cash: 20000, qris: 15000, transfer: 0 })
    expect((await listOrdersForDay(db, '2026-11-22')).map((o) => o.number)).toEqual([
      'ARJ-261122-003',
      'ARJ-261122-001',
      'ARJ-261122-002',
    ])
    expect((await dailySummary(db, '2026-11-23')).revenue).toBe(20000)
  })

  it('hari kosong menghasilkan nol', async () => {
    expect(await dailySummary(db, '2026-01-01')).toMatchObject({
      paidCount: 0,
      revenue: 0,
      average: 0,
    })
  })
})

describe('habis hari ini', () => {
  it('menandai, membatalkan, dan hanya berlaku untuk tanggalnya', async () => {
    const p = (await db.products.toArray())[0]
    await setSoldOut(db, DEV, p.id, true, '2026-11-22')
    expect((await soldOutProductIds(db, '2026-11-22')).has(p.id)).toBe(true)
    expect((await soldOutProductIds(db, '2026-11-23')).has(p.id)).toBe(false)
    await setSoldOut(db, DEV, p.id, false, '2026-11-22')
    expect((await soldOutProductIds(db, '2026-11-22')).has(p.id)).toBe(false)
    expect(await db.product_availability.count()).toBe(1)
  })
})

describe('cadangan', () => {
  it('ekspor lalu impor ke database kosong mengembalikan transaksi', async () => {
    const b = await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'cash',
      tendered: 20000,
      now: AT,
    })
    const text = JSON.stringify(await exportBackup(db))
    const fresh = createDb(`test-repos-fresh-${n++}`)
    const counts = await importBackup(fresh, parseBackup(text))
    expect(counts.orders).toBe(1)
    expect(counts.products).toBe(59)
    expect((await getOrderBundle(fresh, b.order.id))!.items).toEqual(b.items)
    expect((await fresh.counters.get('order-2026-11-22'))?.value).toBe(1)
  })

  it('impor tidak menurunkan counter dan tidak menghapus data yang ada', async () => {
    await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'qris',
      now: AT,
    })
    const old = JSON.stringify(await exportBackup(db))
    await createPaidOrder(db, DEV, {
      lines: [line()],
      orderType: 'dine_in',
      method: 'qris',
      now: AT,
    })
    await importBackup(db, parseBackup(old))
    expect(await db.orders.count()).toBe(2)
    expect((await db.counters.get('order-2026-11-22'))?.value).toBe(2)
  })

  it('menolak berkas yang bukan cadangan', () => {
    expect(() => parseBackup('bukan json')).toThrow()
    expect(() => parseBackup('{"app":"lain"}')).toThrow(/bukan cadangan/)
  })
})
