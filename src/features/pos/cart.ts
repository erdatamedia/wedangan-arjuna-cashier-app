import { calcSubtotal } from '../../lib/order-math'

export interface CartLine {
  key: string
  productId: string
  sku: string
  name: string
  variantName: string | null
  unitPrice: number // harga dasar + selisih varian
  qty: number
  note: string
}

export type CartAction =
  | {
      type: 'add'
      line: Omit<CartLine, 'key' | 'qty' | 'note'> & { qty?: number; note?: string }
    }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'setNote'; key: string; note: string }
  | { type: 'remove'; key: string }
  | { type: 'clear' }

export const lineKey = (productId: string, variantName: string | null, note: string): string =>
  `${productId}|${variantName ?? ''}|${note.trim().toLowerCase()}`

export function cartReducer(state: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const note = (action.line.note ?? '').trim()
      const qty = action.line.qty ?? 1
      const key = lineKey(action.line.productId, action.line.variantName, note)
      const existing = state.find((l) => l.key === key)
      if (existing) return state.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      return [...state, { ...action.line, key, qty, note }]
    }
    case 'setQty':
      return action.qty <= 0
        ? state.filter((l) => l.key !== action.key)
        : state.map((l) => (l.key === action.key ? { ...l, qty: action.qty } : l))
    case 'setNote':
      return state.map((l) => (l.key === action.key ? { ...l, note: action.note } : l))
    case 'remove':
      return state.filter((l) => l.key !== action.key)
    case 'clear':
      return []
  }
}

export const cartCount = (cart: CartLine[]): number => cart.reduce((n, l) => n + l.qty, 0)
export const cartSubtotal = (cart: CartLine[]): number => calcSubtotal(cart)
export const cartQtyForProduct = (cart: CartLine[], productId: string): number =>
  cart.filter((l) => l.productId === productId).reduce((n, l) => n + l.qty, 0)
