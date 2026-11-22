import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { db } from '../../data/db'
import { exportBackup, importBackup, parseBackup } from '../../data/repos/backup'
import { clearQrisImage, getQrisImage, saveQrisImage } from '../../data/repos/settings'
import { getDeviceId } from '../../data/seed'
import { formatWib } from '../../lib/time'

export const APP_VERSION = '1.0.0-fase1'
const LAST_BACKUP_KEY = 'last-backup-at'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-2 space-y-2 text-sm">{children}</div>
    </section>
  )
}

export function SettingsScreen({ persisted }: { persisted: boolean | null }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const qrisRef = useRef<HTMLInputElement>(null)
  const qris = useLiveQuery(() => getQrisImage(db), [], null)
  const lastBackup = useLiveQuery(
    async () => ((await db.kv.get(LAST_BACKUP_KEY))?.value as string | undefined) ?? null,
    [],
    null,
  )

  const run = async (fn: () => Promise<string>) => {
    try {
      setMsg({ ok: true, text: await fn() })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Terjadi kesalahan' })
    }
  }

  const doExport = () =>
    run(async () => {
      const file = await exportBackup(db)
      const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kasir-arjuna-${file.exported_at.slice(0, 16).replace(/[-:T]/g, '')}.json`
      a.click()
      URL.revokeObjectURL(url)
      await db.kv.put({ key: LAST_BACKUP_KEY, value: file.exported_at })
      return 'Cadangan diunduh. Simpan berkasnya di tempat aman (mis. kirim ke WhatsApp/Drive).'
    })

  const doImport = (f: File) =>
    run(async () => {
      const file = parseBackup(await f.text())
      const n = file.tables.orders?.length ?? 0
      if (
        !window.confirm(
          `Gabungkan cadangan ini (${n} transaksi)? Data yang sudah ada tidak dihapus.`,
        )
      )
        return 'Impor dibatalkan.'
      const counts = await importBackup(db, file)
      return `Impor selesai: ${counts.orders ?? 0} transaksi, ${counts.products ?? 0} menu.`
    })

  return (
    <div className="pb-4">
      <h2 className="text-lg font-bold">Pengaturan</h2>
      {msg && (
        <p
          role={msg.ok ? 'status' : 'alert'}
          className={`mt-2 rounded-lg p-3 text-sm ${msg.ok ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}
        >
          {msg.text}
        </p>
      )}

      <Card title="Cadangan data">
        <p className="text-stone-600">
          Terakhir diekspor: {lastBackup ? formatWib(lastBackup) : 'belum pernah'}. Data transaksi
          hanya ada di HP ini sampai sinkron aktif (fase 2), jadi ekspor secara rutin.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={doExport}
            className="min-h-12 flex-1 rounded-xl bg-coklat font-bold text-white"
          >
            Ekspor cadangan
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="min-h-12 flex-1 rounded-xl bg-white font-bold ring-1 ring-emas/60"
          >
            Impor cadangan
          </button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Berkas cadangan"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void doImport(f)
          }}
        />
      </Card>

      <Card title="QRIS toko">
        {qris ? (
          <img src={qris} alt="QRIS toko" className="max-h-56 rounded-lg" />
        ) : (
          <p className="text-stone-600">Belum ada gambar QRIS.</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => qrisRef.current?.click()}
            className="min-h-11 flex-1 rounded-xl bg-white font-semibold ring-1 ring-emas/60"
          >
            {qris ? 'Ganti gambar' : 'Unggah gambar'}
          </button>
          {qris && (
            <button
              type="button"
              onClick={() => run(async () => (await clearQrisImage(db), 'Gambar QRIS dihapus.'))}
              className="min-h-11 rounded-xl px-4 font-semibold text-red-800 ring-1 ring-red-300"
            >
              Hapus
            </button>
          )}
        </div>
        <input
          ref={qrisRef}
          type="file"
          accept="image/*"
          hidden
          aria-label="Gambar QRIS"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void run(async () => (await saveQrisImage(db, f), 'Gambar QRIS disimpan.'))
          }}
        />
      </Card>

      <Card title="Perangkat">
        <p>ID perangkat: {getDeviceId()}</p>
        <p>Versi aplikasi: {APP_VERSION}</p>
        <p className={persisted === false ? 'font-semibold text-red-700' : ''}>
          Penyimpanan permanen:{' '}
          {persisted === null
            ? 'memeriksa…'
            : persisted
              ? 'aktif'
              : 'ditolak browser, ekspor cadangan rutin'}
        </p>
      </Card>
    </div>
  )
}
