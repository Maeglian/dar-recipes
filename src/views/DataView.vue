<script setup lang="ts">
import { ref } from 'vue'
import { BackupFormatError, backupFileName, exportData, importData, parseBackup } from '../data/backup'
import { storagePersisted } from '../data/persistence'

const exporting = ref(false)
const importing = ref(false)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

async function doExport() {
  message.value = null
  exporting.value = true
  try {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName()
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    message.value = { kind: 'ok', text: `Сохранено: рецептов — ${data.recipes.length}, картинок — ${data.images.length}` }
  } catch {
    message.value = { kind: 'error', text: 'Не удалось сделать экспорт' }
  } finally {
    exporting.value = false
  }
}

async function onFilePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  message.value = null
  importing.value = true
  try {
    // Сначала полностью проверяем файл: при ошибке текущие данные не трогаем
    const data = parseBackup(await file.text())
    const ok = window.confirm(
      `Заменить все текущие данные содержимым файла? В файле рецептов: ${data.recipes.length}. ` +
        'Текущие рецепты, коллекции и список покупок будут удалены.',
    )
    if (!ok) return
    await importData(data)
    message.value = { kind: 'ok', text: `Восстановлено рецептов: ${data.recipes.length}` }
  } catch (err) {
    message.value = {
      kind: 'error',
      text: err instanceof BackupFormatError ? err.message : 'Не удалось импортировать файл. Данные не изменены.',
    }
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>Данные</h1>
    </header>

    <p class="muted intro">
      Все рецепты хранятся только на этом устройстве, в браузере. Делайте экспорт время от времени — это резервная
      копия, из которой всё можно восстановить, в том числе на другом телефоне.
    </p>

    <div v-if="storagePersisted === false" class="warning card" role="note" data-testid="storage-warning">
      <strong>Браузер может удалить данные приложения.</strong>
      <p>
        Постоянное хранилище не предоставлено. Установите приложение на главный экран (в Chrome на Android: меню ⋮ →
        «Установить приложение»; в Safari на iPhone: «Поделиться» → «На экран „Домой“») и регулярно делайте экспорт.
      </p>
    </div>

    <section class="block card">
      <h2>Экспорт</h2>
      <p class="muted">Скачать все рецепты с картинками, коллекции и список покупок одним файлом.</p>
      <button type="button" class="btn btn-primary" :disabled="exporting" @click="doExport">
        {{ exporting ? 'Готовлю файл…' : 'Экспорт' }}
      </button>
    </section>

    <section class="block card">
      <h2>Импорт</h2>
      <p class="muted">Восстановить данные из файла экспорта. Текущие данные будут полностью заменены.</p>
      <label class="btn" :class="{ 'is-disabled': importing }">
        {{ importing ? 'Читаю файл…' : 'Импорт' }}
        <input
          type="file"
          accept="application/json,.json"
          class="visually-hidden"
          data-testid="import-input"
          :disabled="importing"
          @change="onFilePicked"
        />
      </label>
    </section>

    <p v-if="message" :class="message.kind === 'error' ? 'error' : 'ok'" role="status" data-testid="data-message">
      {{ message.text }}
    </p>
  </div>
</template>

<style scoped>
.intro {
  margin: 0 0 var(--space-4);
}

.warning {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  background: var(--rating-sometimes);
}

.warning p {
  margin: var(--space-2) 0 0;
}

.block {
  padding: var(--space-4);
  margin-bottom: var(--space-4);
}

.block h2 {
  font-size: 18px;
}

.block p {
  margin: var(--space-2) 0 var(--space-3);
}

.is-disabled {
  opacity: 0.45;
}

.ok {
  color: #1a7f37;
}
</style>
