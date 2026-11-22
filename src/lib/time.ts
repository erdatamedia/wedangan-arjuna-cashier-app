export const TIMEZONE = 'Asia/Jakarta'

/** Waktu disimpan sebagai ISO-8601 UTC. */
export const nowIso = (): string => new Date().toISOString()

/** Tampilan: 22/11/2026 18:05 (WIB). */
export function formatWib(iso: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('id-ID', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  )
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`
}

/** Tanggal WIB sebagai YYYY-MM-DD. */
export function wibDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date(iso))
}

export const todayWib = (): string => wibDateKey(nowIso())

/** Rentang satu hari WIB sebagai ISO UTC: [awal, akhir). WIB = UTC+7 tanpa DST. */
export function wibDayRange(dateKey: string): [string, string] {
  const start = new Date(`${dateKey}T00:00:00+07:00`)
  return [start.toISOString(), new Date(start.getTime() + 86_400_000).toISOString()]
}

/** Jam saja, mis. 18:05. */
export const formatWibTime = (iso: string): string => formatWib(iso).slice(11)

/** Tanggal WIB sebagai YYMMDD, untuk nomor struk ARJ-YYMMDD-NNN. */
export function wibDateCode(iso: string): string {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE })
    .format(new Date(iso))
    .split('-')
  return `${y.slice(2)}${m}${d}`
}
