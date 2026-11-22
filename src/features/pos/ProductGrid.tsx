import { useMemo, useRef, useState } from 'react'
import type { Category, Product } from '../../data/db'
import { formatRupiah } from '../../lib/money'
import { cartQtyForProduct, type CartLine } from './cart'

interface Props {
  categories: Category[]
  products: Product[]
  soldOut: Set<string>
  cart: CartLine[]
  onTap: (p: Product) => void
  onLongPress: (p: Product) => void
}

const LONG_PRESS_MS = 500

function ProductCard({
  product,
  qty,
  soldOut,
  onTap,
  onLongPress,
}: {
  product: Product
  qty: number
  soldOut: boolean
  onTap: () => void
  onLongPress: () => void
}) {
  const timer = useRef<number | null>(null)
  const fired = useRef(false)
  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  return (
    <button
      type="button"
      data-testid={`product-${product.sku}`}
      aria-label={`${product.name}, ${formatRupiah(product.price)}${soldOut ? ', habis' : ''}`}
      onPointerDown={() => {
        fired.current = false
        cancel()
        timer.current = window.setTimeout(() => {
          fired.current = true
          onLongPress()
        }, LONG_PRESS_MS)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (fired.current) return
        onTap()
      }}
      className={`relative flex min-h-24 select-none flex-col justify-between p-3 text-left ${
        soldOut ? 'clay-inset text-stone-500' : 'clay-btn'
      }`}
    >
      <span className="text-sm font-semibold leading-tight">{product.name}</span>
      <span className="mt-2 flex items-end justify-between">
        <span className="font-bold tabular-nums">{formatRupiah(product.price)}</span>
        {soldOut && <span className="rounded bg-stone-500 px-1.5 text-xs text-white">Habis</span>}
      </span>
      {product.favorite && !soldOut && (
        <span aria-hidden className="absolute right-2 top-2 text-emas">
          ★
        </span>
      )}
      {qty > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full clay-btn-coklat px-1 text-sm font-bold text-white">
          {qty}
        </span>
      )}
    </button>
  )
}

export function ProductGrid({ categories, products, soldOut, cart, onTap, onLongPress }: Props) {
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<string>('all') // 'all' | 'fav' | category id

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (!p.active) return false
      if (q) return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      if (chip === 'fav') return p.favorite
      if (chip !== 'all') return p.category_id === chip
      return true
    })
  }, [products, query, chip])

  const chips = [
    { id: 'all', name: 'Semua' },
    { id: 'fav', name: '★ Favorit' },
    ...categories.filter((c) => c.active).map((c) => ({ id: c.id, name: c.name })),
  ]

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari menu…"
        aria-label="Cari menu"
        className="min-h-11 w-full clay-inset px-4"
      />
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={chip === c.id && !query}
            onClick={() => {
              setChip(c.id)
              setQuery('')
            }}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
              chip === c.id && !query ? 'clay-btn-coklat' : 'clay-btn'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 text-center text-stone-500">Menu tidak ditemukan.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-4 pb-40">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              qty={cartQtyForProduct(cart, p.id)}
              soldOut={soldOut.has(p.id)}
              onTap={() => onTap(p)}
              onLongPress={() => onLongPress(p)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
