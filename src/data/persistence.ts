import { shallowRef } from 'vue'

/** true — хранилище постоянное; false — браузер может его очистить; null — ещё не известно. */
export const storagePersisted = shallowRef<boolean | null>(null)

/** Просит браузер не очищать данные приложения. Вызывается при старте. */
export async function requestPersistentStorage(): Promise<void> {
  const storage = navigator.storage
  if (!storage?.persist || !storage.persisted) {
    storagePersisted.value = false
    return
  }
  try {
    storagePersisted.value = (await storage.persisted()) || (await storage.persist())
  } catch {
    storagePersisted.value = false
  }
}
