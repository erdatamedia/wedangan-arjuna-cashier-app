import type { Dispatch } from 'react'
import type { OrderType } from '../../data/db'
import { formatRupiah } from '../../lib/money'
import { cartSubtotal, type CartAction, type CartLine } from './cart'

export interface OrderMeta {
  orderType: OrderType
  customerName: string
  tableNo: string
}

interface Props {
  cart: CartLine[]
  dispatch: Dispatch<CartAction>
  meta: OrderMeta
  onMeta: (m: OrderMeta) => void
  onBack: () => void
  onPay: () => void
}

const TYPES: { id: OrderType; label: string }[] = [
  { id: 'dine_in', label: 'Makan di tempat' },
  { id: 'takeaway', label: 'Bungkus' },
  { id: 'online', label: 'Online' },
]

export function CartScreen({ cart, dispatch, meta, onMeta, onBack, onPay }: Props) {
  const total = cartSubtotal(cart)
  return (
    <div className="pb-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="min-h-11 px-1 font-semibold">
          ← Menu
        </button>
        <h2 className="text-lg font-bold">Keranjang</h2>
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => {
            if (window.confirm('Kosongkan keranjang?')) {
              dispatch({ type: 'clear' })
              onBack()
            }
          }}
          className="min-h-11 px-1 text-sm font-semibold text-red-800 disabled:opacity-30"
        >
          Kosongkan
        </button>
      </div>

      {cart.length === 0 ? (
        <p className="mt-10 text-center text-stone-500">Keranjang masih kosong.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {cart.map((l) => (
            <li key={l.key} className="clay p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold leading-tight">
                    {l.name}
                    {l.variantName && <span className="text-stone-600"> ({l.variantName})</span>}
                  </p>
                  <p className="text-sm tabular-nums text-stone-600">{formatRupiah(l.unitPrice)}</p>
                </div>
                <p className="font-bold tabular-nums">{formatRupiah(l.unitPrice * l.qty)}</p>
              </div>
              <input
                value={l.note}
                aria-label={`Catatan ${l.name}`}
                onChange={(e) => dispatch({ type: 'setNote', key: l.key, note: e.target.value })}
                placeholder="Catatan…"
                className="mt-2 min-h-11 w-full clay-inset px-3 text-sm"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Kurangi ${l.name}`}
                    onClick={() => dispatch({ type: 'setQty', key: l.key, qty: l.qty - 1 })}
                    className="min-h-11 min-w-11 rounded-full clay-btn text-2xl"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold tabular-nums">{l.qty}</span>
                  <button
                    type="button"
                    aria-label={`Tambah ${l.name}`}
                    onClick={() => dispatch({ type: 'setQty', key: l.key, qty: l.qty + 1 })}
                    className="min-h-11 min-w-11 rounded-full clay-btn text-2xl"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'remove', key: l.key })}
                  className="min-h-11 px-2 text-sm font-semibold text-red-800"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2 clay p-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Tipe pesanan">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={meta.orderType === t.id}
              onClick={() => onMeta({ ...meta, orderType: t.id })}
              className={`min-h-11 flex-1 rounded-lg px-1 text-xs font-semibold ${
                meta.orderType === t.id ? 'clay-btn-coklat' : 'clay-btn'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={meta.tableNo}
            onChange={(e) => onMeta({ ...meta, tableNo: e.target.value })}
            placeholder="No. meja"
            aria-label="Nomor meja"
            className="min-h-11 w-28 clay-inset px-3"
          />
          <input
            value={meta.customerName}
            onChange={(e) => onMeta({ ...meta, customerName: e.target.value })}
            placeholder="Nama pelanggan"
            aria-label="Nama pelanggan"
            className="min-h-11 flex-1 clay-inset px-3"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xl font-bold">
        <span>Total</span>
        <span className="tabular-nums">{formatRupiah(total)}</span>
      </div>
      <button
        type="button"
        disabled={cart.length === 0}
        onClick={onPay}
        className="mt-3 min-h-14 w-full clay-btn-coklat text-xl font-bold text-white disabled:opacity-40"
      >
        Bayar
      </button>
    </div>
  )
}
