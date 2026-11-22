import { useState } from 'react'
import type { Product, ProductVariant } from '../../data/db'
import { formatRupiah } from '../../lib/money'

export interface SheetResult {
  variantName: string | null
  priceDelta: number
  qty: number
  note: string
}

interface Props {
  product: Product
  variants: ProductVariant[]
  soldOut: boolean
  onAdd: (r: SheetResult) => void
  onToggleSoldOut: () => void
  onClose: () => void
}

export function ItemSheet({ product, variants, soldOut, onAdd, onToggleSoldOut, onClose }: Props) {
  const [variantId, setVariantId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const variant = variants.find((v) => v.id === variantId) ?? null
  const needVariant = product.variant_required && !variant
  const unit = product.price + (variant?.price_delta ?? 0)

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-coklat/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Detail ${product.name}`}
        className="mx-auto w-full max-w-md clay-sheet p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{product.name}</h2>
            <p className="font-semibold tabular-nums text-emas">{formatRupiah(unit)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="min-h-11 min-w-11 text-2xl"
          >
            ×
          </button>
        </div>

        {variants.length > 0 && (
          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">
              Varian {product.variant_required && <span className="text-red-700">(wajib)</span>}
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={variantId === v.id}
                  onClick={() => setVariantId(v.id)}
                  className={`min-h-11 rounded-full px-5 font-semibold ${
                    variantId === v.id ? 'clay-btn-coklat' : 'clay-btn'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <label className="mt-3 block text-sm font-semibold">
          Catatan
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mis. kurang manis, tanpa es"
            className="mt-1 min-h-11 w-full clay-inset px-3 font-normal"
          />
        </label>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            aria-label="Kurangi"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="min-h-11 min-w-11 rounded-full clay-btn text-2xl"
          >
            −
          </button>
          <span className="w-8 text-center text-xl font-bold tabular-nums">{qty}</span>
          <button
            type="button"
            aria-label="Tambah"
            onClick={() => setQty((q) => q + 1)}
            className="min-h-11 min-w-11 rounded-full clay-btn text-2xl"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={needVariant || soldOut}
          onClick={() =>
            onAdd({
              variantName: variant?.name ?? null,
              priceDelta: variant?.price_delta ?? 0,
              qty,
              note,
            })
          }
          className="mt-4 min-h-12 w-full clay-btn-coklat text-lg font-bold text-white disabled:opacity-40"
        >
          {soldOut
            ? 'Menu habis'
            : needVariant
              ? 'Pilih varian dulu'
              : `Tambah · ${formatRupiah(unit * qty)}`}
        </button>
        <button
          type="button"
          onClick={onToggleSoldOut}
          className="mt-2 min-h-11 w-full clay-btn text-sm font-semibold text-red-800"
        >
          {soldOut ? 'Batalkan tanda habis' : 'Tandai habis hari ini'}
        </button>
      </div>
    </div>
  )
}
