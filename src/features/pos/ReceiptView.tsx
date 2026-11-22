import { useState } from 'react'
import type { OrderBundle } from '../../data/repos/orders'
import { buildReceiptText } from '../../lib/receipt-text'
import { shareText } from '../../lib/share'

export function ReceiptView({
  bundle,
  reprint = false,
}: {
  bundle: OrderBundle
  reprint?: boolean
}) {
  const [hint, setHint] = useState<string | null>(null)
  const text = buildReceiptText({
    order: bundle.order,
    items: bundle.items,
    payments: bundle.payments,
    reprint,
  })
  return (
    <div>
      <pre
        data-testid="receipt"
        className="print-area mx-auto w-fit overflow-x-auto clay-sm p-3 font-mono text-[13px] leading-snug"
      >
        {text}
      </pre>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            const how = await shareText(text)
            setHint(
              how === 'cancelled' ? null : how === 'whatsapp' ? 'Dibuka lewat WhatsApp' : null,
            )
          }}
          className="min-h-12 flex-1 clay-btn-green font-bold text-white"
        >
          Bagikan (WhatsApp)
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-12 flex-1 rounded-xl clay-btn font-bold"
        >
          Cetak
        </button>
      </div>
      {hint && <p className="mt-1 text-center text-sm text-stone-600">{hint}</p>}
    </div>
  )
}
