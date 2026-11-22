import { newId } from '../../lib/id'
import { nowIso } from '../../lib/time'
import type { OutboxEntry } from '../db'

/** Entri outbox: antrean perubahan yang kelak dikirim ke server (fase 2). Selalu ditulis dalam transaksi Dexie yang sama dengan data. */
export function outboxEntry(
  entity: string,
  entityId: string,
  op: OutboxEntry['op'],
  payload: unknown,
): OutboxEntry {
  return {
    id: newId(),
    entity,
    entity_id: entityId,
    op,
    payload,
    created_at: nowIso(),
    attempts: 0,
    last_error: null,
  }
}
