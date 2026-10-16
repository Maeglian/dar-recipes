<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { dbDiagnostics } from '../data/diagnostics'
import { storagePersisted } from '../data/persistence'

/** «Загрузка…», которая через 5 секунд показывает, чего именно ждёт приложение. */
const SLOW_MS = 5000

const startedAt = Date.now()
const now = ref(Date.now())
const timer = setInterval(() => (now.value = Date.now()), 1000)
onBeforeUnmount(() => clearInterval(timer))

const elapsed = computed(() => Math.round((now.value - startedAt) / 1000))
const slow = computed(() => now.value - startedAt >= SLOW_MS)

const txs = computed(() =>
  dbDiagnostics.activeTxs.map(
    (t) => `#${t.id} ${t.mode} [${t.stores.join(', ')}] — ${Math.round((now.value - t.startedAt) / 1000)} с`,
  ),
)

const userAgent = navigator.userAgent

function reload() {
  window.location.reload()
}
</script>

<template>
  <p v-if="!slow" class="muted">Загрузка…</p>
  <div v-else class="slow card" role="alert" data-testid="slow-loading">
    <strong>База данных не отвечает уже {{ elapsed }} с</strong>
    <ul class="slow__facts">
      <li>
        База открыта:
        {{ dbDiagnostics.openMs !== null ? `да, за ${dbDiagnostics.openMs} мс` : dbDiagnostics.openError ?? 'нет' }}
      </li>
      <li v-if="dbDiagnostics.blockedEvents">Открытие заблокировано другой вкладкой: {{ dbDiagnostics.blockedEvents }}</li>
      <li v-if="dbDiagnostics.versionChangeEvents">Запросов смены версии: {{ dbDiagnostics.versionChangeEvents }}</li>
      <li>Незавершённые транзакции: {{ txs.length ? '' : 'нет' }}</li>
      <li v-for="t in txs" :key="t" class="slow__tx">{{ t }}</li>
      <li>Завершено транзакций: {{ dbDiagnostics.completedTxs }}, самая долгая {{ dbDiagnostics.slowestTxMs }} мс</li>
      <li v-if="dbDiagnostics.lastError">Последняя ошибка: {{ dbDiagnostics.lastError }}</li>
      <li>Постоянное хранилище: {{ storagePersisted === null ? 'неизвестно' : storagePersisted ? 'да' : 'нет' }}</li>
      <li class="slow__ua">{{ userAgent }}</li>
    </ul>
    <p class="muted">Сделайте скриншот этого экрана — по нему видно причину.</p>
    <button type="button" class="btn btn-primary" @click="reload">Перезагрузить</button>
  </div>
</template>

<style scoped>
.slow {
  padding: var(--space-4);
  background: var(--rating-sometimes);
}

.slow__facts {
  margin: var(--space-2) 0;
  padding-left: var(--space-4);
  font-size: 14px;
}

.slow__tx {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}

.slow__ua {
  font-size: 12px;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
</style>
