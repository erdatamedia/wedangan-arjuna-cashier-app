import { v7 } from 'uuid'

/** UUID v7 (berurutan waktu), aman dibuat offline tanpa bentrok. */
export const newId = (): string => v7()
