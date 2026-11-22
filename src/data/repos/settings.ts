import type { ArjunaDB } from '../db'

const QRIS_KEY = 'qris-image'
const MAX_QRIS_BYTES = 1_500_000

export async function getQrisImage(db: ArjunaDB): Promise<string | null> {
  return ((await db.kv.get(QRIS_KEY))?.value as string | undefined) ?? null
}

export async function saveQrisImage(db: ArjunaDB, file: File): Promise<void> {
  if (!file.type.startsWith('image/')) throw new Error('Berkas harus berupa gambar')
  if (file.size > MAX_QRIS_BYTES) throw new Error('Gambar terlalu besar (maks 1,5 MB)')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Gagal membaca gambar'))
    r.readAsDataURL(file)
  })
  await db.kv.put({ key: QRIS_KEY, value: dataUrl })
}

export const clearQrisImage = (db: ArjunaDB): Promise<void> => db.kv.delete(QRIS_KEY)
