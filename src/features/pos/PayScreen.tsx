import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, type PaymentMethod } from '../../data/db'
import { getQrisImage } from '../../data/repos/settings'
import { calcChange, formatRupiah } from '../../lib/money'
import { quickCashOptions } from '../../lib/order-math'

export interface PayRequest {
  method: PaymentMethod
  tendered?: number
  reference?: string
}

interface Props {
  total: number
  onBack: () => void
  onConfirm: (r: PayRequest) => Promise<void>
}

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Tunai' },
  { id: 'qris', label: 'QRIS' },
  { id: 'transfer', label: 'Transfer' },
]

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫']

export function PayScreen({ total, onBack, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [digits, setDigits] = useState('')
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const qris = useLiveQuery(() => getQrisImage(db), [], null)

  const tendered = digits ? Number(digits) : 0
  const change = calcChange(tendered, total)
  const enough = tendered >= total
  const canSubmit = !busy && (method !== 'cash' || enough)

  const press = (k: string) => {
    if (k === '⌫') setDigits((d) => d.slice(0, -1))
    else setDigits((d) => (d + k).replace(/^0+/, '').slice(0, 9))
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onConfirm({
        method,
        tendered: method === 'cash' ? tendered : undefined,
        reference: method === 'cash' ? undefined : reference,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan transaksi')
      setBusy(false)
    }
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="min-h-11 px-1 font-semibold">
          ← Keranjang
        </button>
        <h2 className="text-lg font-bold">Pembayaran</h2>
        <span className="w-20" />
      </div>

      <p className="mt-2 text-center text-sm text-stone-600">Total</p>
      <p className="text-center text-4xl font-extrabold tabular-nums" data-testid="pay-total">
        {formatRupiah(total)}
      </p>

      <div className="mt-3 flex gap-2" role="tablist" aria-label="Metode bayar">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={method === m.id}
            onClick={() => setMethod(m.id)}
            className={`min-h-11 flex-1 rounded-xl font-semibold ${
              method === m.id ? 'clay-btn-coklat' : 'clay-btn'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'cash' ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {quickCashOptions(total).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setDigits(String(v))}
                className="min-h-11 rounded-full clay-btn px-4 text-sm font-semibold tabular-nums"
              >
                {v === total ? 'Uang pas' : formatRupiah(v).replace('Rp ', '')}
              </button>
            ))}
          </div>
          <p
            className="mt-3 clay-inset p-3 text-right text-2xl font-bold tabular-nums"
            aria-label="Uang diterima"
          >
            {formatRupiah(tendered)}
          </p>
          <p
            data-testid="change"
            className={`mt-2 text-center text-3xl font-extrabold tabular-nums ${enough ? 'text-green-700' : 'text-red-700'}`}
          >
            {enough
              ? `Kembali ${formatRupiah(change)}`
              : `Kurang ${formatRupiah(total - tendered)}`}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                aria-label={k === '⌫' ? 'Hapus angka' : k}
                className="min-h-12 rounded-xl clay-btn text-2xl font-semibold"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {method === 'qris' &&
            (qris ? (
              <img src={qris} alt="QRIS toko" className="mx-auto max-h-72 clay-sm p-2" />
            ) : (
              <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
                Gambar QRIS belum diunggah. Unggah di Lainnya → Pengaturan, atau tunjukkan QRIS
                manual.
              </p>
            ))}
          <p className="text-sm text-stone-600">
            Cek notifikasi pembayaran dulu, lalu tekan &quot;Sudah dibayar&quot;.
          </p>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Nomor referensi (opsional)"
            aria-label="Nomor referensi"
            className="min-h-11 w-full clay-inset px-3"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      <div className="fixed inset-x-0 bottom-24 z-20 px-4">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="mx-auto block min-h-14 w-full max-w-md clay-btn-coklat text-xl font-bold text-white disabled:opacity-40"
        >
          {busy ? 'Menyimpan…' : method === 'cash' ? 'Selesaikan' : 'Sudah dibayar'}
        </button>
      </div>
    </div>
  )
}
