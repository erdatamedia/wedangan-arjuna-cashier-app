import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../data/db'
import { getOrderBundle, VOID_REASONS, voidOrder } from '../../data/repos/orders'
import { getDeviceId } from '../../data/seed'
import { ReceiptView } from '../pos/ReceiptView'

const OTHER = 'Lainnya'

function VoidDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [choice, setChoice] = useState<string>(VOID_REASONS[0])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reason = choice === OTHER ? text.trim() : choice

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/50" onClick={onCancel}>
      <div
        role="dialog"
        aria-label="Batalkan transaksi"
        className="mx-auto w-full max-w-md rounded-t-2xl bg-krem p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold">Batalkan transaksi?</h3>
        <p className="text-sm text-stone-600">
          Transaksi tetap tersimpan, ditandai Batal, dan tidak dihitung di omzet. Tidak bisa
          dikembalikan.
        </p>
        <div className="mt-3 space-y-2" role="radiogroup" aria-label="Alasan">
          {[...VOID_REASONS, OTHER].map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={choice === r}
              onClick={() => setChoice(r)}
              className={`min-h-11 w-full rounded-xl px-4 text-left font-semibold ${
                choice === r ? 'bg-coklat text-white' : 'bg-white ring-1 ring-emas/50'
              }`}
            >
              {r}
            </button>
          ))}
          {choice === OTHER && (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis alasan"
              aria-label="Alasan lainnya"
              className="min-h-11 w-full rounded-xl border border-emas/50 bg-white px-3"
            />
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 flex-1 rounded-xl bg-white font-bold ring-1 ring-stone-300"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={!reason || busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onConfirm(reason)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Gagal membatalkan')
                setBusy(false)
              }
            }}
            className="min-h-12 flex-1 rounded-xl bg-red-700 font-bold text-white disabled:opacity-40"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const bundle = useLiveQuery(() => getOrderBundle(db, orderId), [orderId])
  const [voiding, setVoiding] = useState(false)

  if (bundle === undefined) return <p className="mt-10 text-center text-stone-500">Memuat…</p>
  if (bundle === null) return <p className="mt-10 text-center">Transaksi tidak ditemukan.</p>
  const { order } = bundle

  return (
    <div>
      <button type="button" onClick={onBack} className="min-h-11 px-1 font-semibold">
        ← Riwayat
      </button>
      {order.status === 'void' && (
        <p className="mt-1 rounded-lg bg-red-100 p-3 text-sm text-red-900">
          Dibatalkan. Alasan: {order.void_reason}
        </p>
      )}
      <div className="mt-2">
        <ReceiptView bundle={bundle} reprint />
      </div>
      {order.status === 'paid' && (
        <button
          type="button"
          onClick={() => setVoiding(true)}
          className="mt-3 min-h-12 w-full rounded-xl font-bold text-red-800 ring-1 ring-red-300"
        >
          Batalkan transaksi
        </button>
      )}
      {voiding && (
        <VoidDialog
          onCancel={() => setVoiding(false)}
          onConfirm={async (reason) => {
            await voidOrder(db, getDeviceId(), order.id, reason)
            setVoiding(false)
          }}
        />
      )}
    </div>
  )
}
