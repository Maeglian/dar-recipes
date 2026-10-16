import { onScopeDispose, shallowRef, watch, type Ref, type WatchSource } from 'vue'

/** object URL для Blob, который отзывается при смене Blob и при уничтожении компонента. */
export function useObjectUrl(source: WatchSource<Blob | null | undefined>): Ref<string | null> {
  const url = shallowRef<string | null>(null)

  function release() {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
  }

  watch(
    source,
    (blob) => {
      release()
      if (blob) url.value = URL.createObjectURL(blob)
    },
    { immediate: true },
  )

  onScopeDispose(release)
  return url
}
