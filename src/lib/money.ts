const nf = new Intl.NumberFormat('id-ID')

/** Format integer Rupiah: 10000 -> "Rp 10.000". Uang selalu integer, bukan float. */
export function formatRupiah(amount: number): string {
  if (!Number.isInteger(amount)) throw new Error(`Uang harus integer Rupiah: ${amount}`)
  return `${amount < 0 ? '-' : ''}Rp ${nf.format(Math.abs(amount))}`
}

/** Angka saja dengan titik ribuan: 10000 -> "10.000" (untuk struk). */
export const formatNumber = (n: number): string => nf.format(n)

/** Kembalian tunai; tidak pernah negatif (tombol Bayar nonaktif bila uang kurang). */
export function calcChange(tendered: number, amount: number): number {
  return Math.max(0, tendered - amount)
}
