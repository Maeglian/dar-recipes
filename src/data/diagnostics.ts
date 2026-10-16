import type Dexie from 'dexie'
import { shallowReactive } from 'vue'

/**
 * Диагностика базы для экрана «База данных не отвечает»: открытие, блокировки и незавершённые транзакции.
 * Нужна, чтобы по телефону без консоли было видно, чего именно ждёт приложение.
 */
export interface ActiveTx {
  id: number
  mode: string
  stores: string[]
  startedAt: number
}

export const dbDiagnostics = shallowReactive({
  createdAt: Date.now(),
  openMs: null as number | null,
  openError: null as string | null,
  blockedEvents: 0,
  versionChangeEvents: 0,
  lastError: null as string | null,
  activeTxs: [] as ActiveTx[],
  completedTxs: 0,
  slowestTxMs: 0,
})

let txSeq = 0

function describe(err: unknown): string {
  const e = err as { name?: string; message?: string }
  return `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}`
}

export function installDiagnostics(db: Dexie): void {
  db.on('ready', () => {
    dbDiagnostics.openMs = Date.now() - dbDiagnostics.createdAt
  })
  db.on('blocked', () => {
    dbDiagnostics.blockedEvents += 1
  })
  db.on('versionchange', () => {
    dbDiagnostics.versionChangeEvents += 1
  })

  db.use({
    stack: 'dbcore',
    name: 'diagnostics',
    create(down) {
      return {
        ...down,
        transaction(stores, mode, options) {
          const tx = down.transaction(stores, mode, options) as unknown as IDBTransaction
          const entry: ActiveTx = { id: ++txSeq, mode, stores: [...stores], startedAt: Date.now() }
          dbDiagnostics.activeTxs = [...dbDiagnostics.activeTxs, entry]
          const done = (err?: unknown) => {
            dbDiagnostics.activeTxs = dbDiagnostics.activeTxs.filter((t) => t.id !== entry.id)
            dbDiagnostics.completedTxs += 1
            dbDiagnostics.slowestTxMs = Math.max(dbDiagnostics.slowestTxMs, Date.now() - entry.startedAt)
            if (err) dbDiagnostics.lastError = describe(err)
          }
          tx.addEventListener?.('complete', () => done())
          tx.addEventListener?.('abort', () => done(tx.error ?? new Error('transaction aborted')))
          tx.addEventListener?.('error', () => done(tx.error))
          return tx as never
        },
      }
    },
  })
}

export function recordOpenError(err: unknown): void {
  dbDiagnostics.openError = describe(err)
}
