import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db, type Order } from '../../data/db'
import { dailySummary, listOrdersForDay } from '../../data/repos/orders'
import { formatRupiah } from '../../lib/money'
import { formatWibTime, todayWib } from '../../lib/time'
import { OrderDetail } from './OrderDetail'

const METHOD_NAMES = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' } as const

export function HistoryScreen() {
  const [date, setDate] = useState(todayWib())
  const [openId, setOpenId] = useState<string | null>(null)

  const orders = useLiveQuery(() => listOrdersForDay(db, date), [date])
  const summary = useLiveQuery(() => dailySummary(db, date), [date])
  const payMethods = useLiveQuery(async () => {
    const rows = await db.payments
      .where('order_id')
      .anyOf((orders ?? []).map((o) => o.id))
      .toArray()
    return new Map(rows.map((p) => [p.order_id, p.method_code]))
  }, [orders])

  if (openId) return <OrderDetail orderId={openId} onBack={() => setOpenId(null)} />

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Riwayat</h2>
        <input
          type="date"
          value={date}
          max={todayWib()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Tanggal"
          className="min-h-11 rounded-lg border border-emas/50 bg-white px-2"
        />
      </div>

      {summary && (
        <section aria-label="Rekap harian" className="mt-3 rounded-xl bg-coklat p-4 text-white">
          <p className="text-sm text-white/80">Omzet</p>
          <p className="text-3xl font-extrabold tabular-nums" data-testid="summary-revenue">
            {formatRupiah(summary.revenue)}
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div>
              <dt className="text-white/70">Transaksi</dt>
              <dd className="font-bold tabular-nums" data-testid="summary-count">
                {summary.paidCount}
              </dd>
            </div>
            <div>
              <dt className="text-white/70">Rata-rata</dt>
              <dd className="font-bold tabular-nums">{formatRupiah(summary.average)}</dd>
            </div>
            <div>
              <dt className="text-white/70">Batal</dt>
              <dd className="font-bold tabular-nums">{summary.voidCount}</dd>
            </div>
          </dl>
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/20 pt-3 text-sm">
            {(Object.keys(METHOD_NAMES) as (keyof typeof METHOD_NAMES)[]).map((m) => (
              <div key={m}>
                <dt className="text-white/70">{METHOD_NAMES[m]}</dt>
                <dd className="font-bold tabular-nums">{formatRupiah(summary.byMethod[m])}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {orders && orders.length === 0 && (
        <p className="mt-10 text-center text-stone-500">Belum ada transaksi pada tanggal ini.</p>
      )}
      <ul className="mt-3 space-y-2">
        {orders?.map((o: Order) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setOpenId(o.id)}
              className="flex min-h-14 w-full items-center justify-between rounded-xl bg-white p-3 text-left shadow-sm"
            >
              <span>
                <span className="block font-semibold">{o.number}</span>
                <span className="text-sm text-stone-600">
                  {formatWibTime(o.paid_at)} · {METHOD_NAMES[payMethods?.get(o.id) ?? 'cash']}
                </span>
              </span>
              <span className="text-right">
                <span
                  className={`block font-bold tabular-nums ${o.status === 'void' ? 'text-stone-400 line-through' : ''}`}
                >
                  {formatRupiah(o.total)}
                </span>
                <span
                  className={`rounded px-1.5 text-xs font-semibold ${
                    o.status === 'void' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {o.status === 'void' ? 'Batal' : 'Lunas'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
