import { useLiveQuery } from 'dexie-react-hooks'
import { useReducer, useState } from 'react'
import { db, type Product } from '../../data/db'
import { setSoldOut, soldOutProductIds } from '../../data/repos/catalog'
import { createPaidOrder, type OrderBundle } from '../../data/repos/orders'
import { getDeviceId } from '../../data/seed'
import { formatRupiah } from '../../lib/money'
import { cartCount, cartReducer, cartSubtotal } from './cart'
import { CartScreen, type OrderMeta } from './CartScreen'
import { ItemSheet, type SheetResult } from './ItemSheet'
import { PayScreen, type PayRequest } from './PayScreen'
import { ProductGrid } from './ProductGrid'
import { SuccessScreen } from './SuccessScreen'

type Step = 'grid' | 'cart' | 'pay' | 'done'

const EMPTY_META: OrderMeta = { orderType: 'dine_in', customerName: '', tableNo: '' }

export function PosScreen() {
  const [cart, dispatch] = useReducer(cartReducer, [])
  const [step, setStep] = useState<Step>('grid')
  const [meta, setMeta] = useState<OrderMeta>(EMPTY_META)
  const [sheet, setSheet] = useState<Product | null>(null)
  const [done, setDone] = useState<OrderBundle | null>(null)

  const categories = useLiveQuery(() => db.categories.orderBy('sort').toArray(), [])
  const products = useLiveQuery(async () => {
    // Urutan: kategori (sort) lalu SKU, agar "Semua" mengikuti urutan menu.
    const order = new Map((await db.categories.toArray()).map((c) => [c.id, c.sort]))
    return (await db.products.toArray()).sort(
      (a, b) =>
        (order.get(a.category_id) ?? 0) - (order.get(b.category_id) ?? 0) ||
        a.sku.localeCompare(b.sku),
    )
  }, [])
  const variants = useLiveQuery(
    async () => (await db.product_variants.toArray()).sort((a, b) => a.sort - b.sort),
    [],
  )
  const soldOut = useLiveQuery(() => soldOutProductIds(db), [])

  if (!categories || !products || !variants || !soldOut) {
    return <p className="mt-10 text-center text-stone-500">Memuat menu…</p>
  }

  const count = cartCount(cart)
  const subtotal = cartSubtotal(cart)

  const addToCart = (p: Product, r?: Partial<SheetResult>) => {
    dispatch({
      type: 'add',
      line: {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        variantName: r?.variantName ?? null,
        unitPrice: p.price + (r?.priceDelta ?? 0),
        qty: r?.qty,
        note: r?.note,
      },
    })
    navigator.vibrate?.(10)
  }

  const onTap = (p: Product) => {
    if (soldOut.has(p.id)) return setSheet(p) // buka detail agar bisa membatalkan tanda habis
    if (p.variant_required) return setSheet(p)
    addToCart(p)
  }

  const pay = async (r: PayRequest) => {
    const bundle = await createPaidOrder(db, getDeviceId(), {
      lines: cart.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        name: l.name,
        variantName: l.variantName,
        unitPrice: l.unitPrice,
        qty: l.qty,
        note: l.note,
      })),
      orderType: meta.orderType,
      customerName: meta.customerName,
      tableNo: meta.tableNo,
      method: r.method,
      tendered: r.tendered,
      reference: r.reference,
    })
    // Data sudah tertulis di Dexie; baru sekarang layar sukses tampil.
    dispatch({ type: 'clear' })
    setMeta(EMPTY_META)
    setDone(bundle)
    setStep('done')
  }

  return (
    <>
      {step === 'grid' && (
        <>
          <ProductGrid
            categories={categories}
            products={products}
            soldOut={soldOut}
            cart={cart}
            onTap={onTap}
            onLongPress={setSheet}
          />
          {count > 0 && (
            <div className="fixed inset-x-0 bottom-24 z-20 px-4">
              <button
                type="button"
                data-testid="cart-bar"
                onClick={() => setStep('cart')}
                className="mx-auto flex min-h-14 w-full max-w-md items-center justify-between clay-btn-coklat px-5 text-lg font-bold text-white"
              >
                <span>{count} item</span>
                <span className="tabular-nums">{formatRupiah(subtotal)} ›</span>
              </button>
            </div>
          )}
        </>
      )}
      {step === 'cart' && (
        <CartScreen
          cart={cart}
          dispatch={dispatch}
          meta={meta}
          onMeta={setMeta}
          onBack={() => setStep('grid')}
          onPay={() => setStep('pay')}
        />
      )}
      {step === 'pay' && (
        <PayScreen total={subtotal} onBack={() => setStep('cart')} onConfirm={pay} />
      )}
      {step === 'done' && done && (
        <SuccessScreen
          bundle={done}
          onNew={() => {
            setDone(null)
            setStep('grid')
          }}
        />
      )}

      {sheet && (
        <ItemSheet
          key={sheet.id}
          product={sheet}
          variants={variants.filter((v) => v.product_id === sheet.id)}
          soldOut={soldOut.has(sheet.id)}
          onClose={() => setSheet(null)}
          onToggleSoldOut={async () => {
            await setSoldOut(db, getDeviceId(), sheet.id, !soldOut.has(sheet.id))
            setSheet(null)
          }}
          onAdd={(r) => {
            addToCart(sheet, r)
            setSheet(null)
          }}
        />
      )}
    </>
  )
}
