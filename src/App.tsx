import { useEffect, useState } from 'react'
import { useOnline } from './app/useOnline'
import { db } from './data/db'
import { getDeviceId, seedMenuIfEmpty } from './data/seed'
import { HistoryScreen } from './features/history/HistoryScreen'
import { PosScreen } from './features/pos/PosScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'

type Tab = 'pos' | 'history' | 'more'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pos', label: 'Kasir', icon: '🧾' },
  { id: 'history', label: 'Riwayat', icon: '🕘' },
  { id: 'more', label: 'Lainnya', icon: '⚙️' },
]

export default function App() {
  const online = useOnline()
  const [ready, setReady] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('pos')

  useEffect(() => {
    void (async () => {
      await seedMenuIfEmpty(db, getDeviceId())
      setReady(true)
      // Minta penyimpanan permanen agar data tidak terhapus otomatis oleh browser.
      setPersisted((await navigator.storage?.persist?.()) ?? false)
    })()
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-20">
      <header className="sticky top-0 z-30 bg-coklat text-white">
        <div className="flex min-h-12 items-center justify-between px-4">
          <h1 className="font-bold">Wedangan Arjuna</h1>
          <span
            data-testid="online-status"
            className={`rounded-full px-3 py-1 text-xs font-bold ${online ? 'bg-green-700' : 'bg-red-700'}`}
          >
            {online ? '● Online' : '● Offline'}
          </span>
        </div>
        {!online && (
          <p className="bg-red-800 px-4 py-1 text-center text-xs">
            Transaksi tetap tersimpan di HP
          </p>
        )}
        {persisted === false && (
          <p className="bg-amber-500 px-4 py-1 text-center text-xs text-black">
            Penyimpanan permanen ditolak browser. Ekspor cadangan secara rutin.
          </p>
        )}
      </header>

      <main className="p-4">
        {!ready ? (
          <p className="mt-10 text-center text-stone-500">Menyiapkan data…</p>
        ) : (
          <>
            {/* Semua tab tetap terpasang agar keranjang tidak hilang saat pindah tab. */}
            <div hidden={tab !== 'pos'}>
              <PosScreen />
            </div>
            <div hidden={tab !== 'history'}>{tab === 'history' && <HistoryScreen />}</div>
            <div hidden={tab !== 'more'}>
              {tab === 'more' && <SettingsScreen persisted={persisted} />}
            </div>
          </>
        )}
      </main>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-emas/40 bg-krem pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-md">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center text-xs font-semibold ${
                tab === t.id ? 'text-coklat' : 'text-stone-500'
              }`}
            >
              <span aria-hidden className="text-xl">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
