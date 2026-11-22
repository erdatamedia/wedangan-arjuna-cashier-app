import { nowIso } from '../../lib/time'
import { BACKUP_TABLES, type ArjunaDB } from '../db'

export interface BackupFile {
  app: 'kasir-arjuna'
  format: 1
  exported_at: string
  tables: Record<string, unknown[]>
}

export async function exportBackup(db: ArjunaDB): Promise<BackupFile> {
  const tables: Record<string, unknown[]> = {}
  for (const name of BACKUP_TABLES) tables[name] = await db.table(name).toArray()
  return { app: 'kasir-arjuna', format: 1, exported_at: nowIso(), tables }
}

export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Berkas bukan JSON yang valid')
  }
  const b = data as Partial<BackupFile>
  if (b?.app !== 'kasir-arjuna' || b.format !== 1 || typeof b.tables !== 'object' || !b.tables)
    throw new Error('Berkas ini bukan cadangan Kasir Arjuna')
  for (const name of BACKUP_TABLES)
    if (b.tables[name] !== undefined && !Array.isArray(b.tables[name]))
      throw new Error(`Tabel ${name} rusak`)
  return b as BackupFile
}

/**
 * Impor bersifat penggabungan (upsert per id), tidak menghapus data yang ada.
 * Counter nomor struk memakai nilai terbesar agar nomor tidak pernah dipakai ulang.
 */
export async function importBackup(
  db: ArjunaDB,
  file: BackupFile,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  await db.transaction(
    'rw',
    BACKUP_TABLES.map((n) => db.table(n)),
    async () => {
      for (const name of BACKUP_TABLES) {
        const rows = file.tables[name] ?? []
        if (name === 'counters') {
          for (const r of rows as { key: string; value: number }[]) {
            const cur = (await db.counters.get(r.key))?.value ?? 0
            await db.counters.put({ key: r.key, value: Math.max(cur, r.value) })
          }
        } else {
          await db.table(name).bulkPut(rows)
        }
        counts[name] = rows.length
      }
    },
  )
  return counts
}
