import type { OrderBundle } from '../../data/repos/orders'
import { formatRupiah } from '../../lib/money'
import { ReceiptView } from './ReceiptView'

export function SuccessScreen({ bundle, onNew }: { bundle: OrderBundle; onNew: () => void }) {
  const pay = bundle.payments[0]
  return (
    <div>
      <div className="clay-green p-4 text-center">
        <p className="text-sm">Transaksi tersimpan · {bundle.order.number}</p>
        {pay.method_code === 'cash' ? (
          <>
            <p className="mt-1 text-sm">Kembalian</p>
            <p className="text-5xl font-extrabold tabular-nums" data-testid="success-change">
              {formatRupiah(pay.change)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-3xl font-extrabold tabular-nums">
            {formatRupiah(bundle.order.total)}
          </p>
        )}
      </div>
      <div className="mt-4">
        <ReceiptView bundle={bundle} />
      </div>
      <button
        type="button"
        onClick={onNew}
        className="mt-4 min-h-14 w-full clay-btn-coklat text-xl font-bold text-white"
      >
        Transaksi baru
      </button>
    </div>
  )
}
