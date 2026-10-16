import { liveQuery, type Subscription } from 'dexie'
import { onScopeDispose, shallowRef, watch, type Ref, type WatchSource } from 'vue'

export interface LiveQueryResult<T> {
  data: Ref<T>
  /** true, пока не пришёл первый результат запроса */
  loading: Ref<boolean>
  error: Ref<unknown>
}

/**
 * Реактивный результат запроса к Dexie: перечитывается при любом изменении затронутых таблиц,
 * в том числе из другой вкладки. Если передан deps, запрос пересоздаётся при их изменении.
 */
export function useLiveQuery<T>(query: () => T | Promise<T>, initial: T, deps?: WatchSource): LiveQueryResult<T> {
  const data = shallowRef(initial) as Ref<T>
  const loading = shallowRef(true)
  const error = shallowRef<unknown>(null)
  let subscription: Subscription | null = null

  function subscribe() {
    subscription?.unsubscribe()
    loading.value = true
    subscription = liveQuery(query).subscribe({
      next: (value) => {
        data.value = value
        loading.value = false
        error.value = null
      },
      error: (err) => {
        error.value = err
        loading.value = false
      },
    })
  }

  if (deps) {
    watch(deps, subscribe, { immediate: true })
  } else {
    subscribe()
  }

  onScopeDispose(() => subscription?.unsubscribe())

  return { data, loading, error }
}
