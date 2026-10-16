import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '../router'

export async function makeTestRouter(path = '/') {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return router
}
