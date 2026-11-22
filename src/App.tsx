import { useEffect, useState } from 'react'
import { db } from './data/db'
import { getDeviceId, seedMenuIfEmpty } from './data/seed'

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export default function App() {
  const online = useOnline()
  const [count, setCount] = useState<number | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)

  useEffect(() => {
    void (async () => {
      await seedMenuIfEmpty(db, getDeviceId())
      setCount(await db.products.count())
      // Minta penyimpanan permanen agar data tidak terhapus otomatis oleh browser.
      setPersisted((await navigator.storage?.persist?.()) ?? false)
    })()
  }, [])

  return (
    <main className="mx-auto max-w-md p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Wedangan Arjuna</h1>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${online ? 'bg-green-700' : 'bg-red-700'}`}
        >
          {online ? 'Online' : 'Offline'}
        </span>
      </header>
      <p className="mt-6 text-emas font-semibold">Fase 0 · aplikasi kosong siap dipasang</p>
      <ul className="mt-2 space-y-1 text-sm">
        <li data-testid="menu-count">Menu tersimpan di HP: {count ?? '…'} item</li>
        {persisted === false && (
          <li className="text-red-700">
            Peringatan: penyimpanan permanen ditolak browser. Ekspor cadangan secara rutin.
          </li>
        )}
      </ul>
    </main>
  )
}
