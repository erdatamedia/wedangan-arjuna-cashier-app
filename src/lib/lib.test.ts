import { describe, expect, it } from 'vitest'
import { newId } from './id'
import { calcChange, formatRupiah } from './money'
import { formatWib, wibDateCode } from './time'

describe('money', () => {
  it('memformat Rupiah dengan titik ribuan', () => {
    expect(formatRupiah(10000)).toBe('Rp 10.000')
    expect(formatRupiah(0)).toBe('Rp 0')
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000')
  })
  it('menolak pecahan (uang harus integer)', () => {
    expect(() => formatRupiah(10.5)).toThrow()
  })
  it('menghitung kembalian', () => {
    expect(calcChange(50000, 32000)).toBe(18000)
    expect(calcChange(10000, 32000)).toBe(0)
  })
})

describe('time (WIB)', () => {
  it('mengubah UTC ke WIB', () => {
    expect(formatWib('2026-11-22T11:05:12Z')).toBe('22/11/2026 18:05')
  })
  it('kode tanggal memakai WIB, bukan UTC', () => {
    expect(wibDateCode('2026-11-22T11:05:12Z')).toBe('261122')
    expect(wibDateCode('2026-11-22T18:00:00Z')).toBe('261123') // 01:00 WIB hari berikutnya
  })
})

describe('id', () => {
  it('UUID v7 unik dan berurutan waktu', () => {
    const a = newId()
    const b = newId()
    expect(a).not.toBe(b)
    expect(a[14]).toBe('7')
    expect(a < b || a.slice(0, 13) === b.slice(0, 13)).toBe(true)
  })
})
