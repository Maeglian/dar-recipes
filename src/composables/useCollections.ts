import { computed } from 'vue'
import { listCollections } from '../data/collectionRepository'
import { compareRu } from '../domain/text'
import type { Collection } from '../domain/types'
import { useLiveQuery } from './useLiveQuery'

export function useCollections() {
  const { data, loading } = useLiveQuery<Collection[]>(listCollections, [])
  const collections = computed(() => [...data.value].sort((a, b) => compareRu(a.name, b.name)))
  const byId = computed(() => new Map(data.value.map((c) => [c.id, c])))
  return { collections, byId, loading }
}
