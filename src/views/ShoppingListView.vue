<script setup lang="ts">
import { computed, ref } from 'vue'
import ShoppingRowItem from '../components/ShoppingRowItem.vue'
import { useShoppingList } from '../composables/useShoppingList'
import { addManualItem, deleteBoughtManualItems, deleteManualItem } from '../data/manualItemRepository'
import { setSelected } from '../data/recipeRepository'
import { setSourcesBought } from '../data/shoppingRepository'
import type { ShoppingRow } from '../domain/shopping-list'
import { UNIT_OPTIONS } from '../domain/units'
import { validateManualItem, type IngredientErrors, type ManualItemDraft } from '../domain/validation'

const { rows, selectedRecipes, hasBoughtManual, loading } = useShoppingList()

const toBuy = computed(() => rows.value.filter((r) => !r.bought))
const bought = computed(() => rows.value.filter((r) => r.bought))

const draft = ref<ManualItemDraft>({ name: '', amount: '', unit: 'g', customUnit: '' })
const errors = ref<IngredientErrors | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

async function add() {
  const result = validateManualItem(draft.value)
  if (!result.ok) {
    errors.value = result.errors
    return
  }
  errors.value = null
  await addManualItem(result.value)
  draft.value = { name: '', amount: '', unit: draft.value.unit, customUnit: '' }
  nameInput.value?.focus()
}

function toggle(row: ShoppingRow, value: boolean) {
  void setSourcesBought(row.sources, value)
}

async function removeManual(row: ShoppingRow) {
  for (const s of row.sources) if (s.kind === 'manual') await deleteManualItem(s.id)
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>Покупки</h1>
    </header>

    <form class="add-item card" novalidate @submit.prevent="add">
      <input
        ref="nameInput"
        v-model="draft.name"
        class="input"
        :class="{ 'has-error': errors?.name }"
        placeholder="Что ещё купить"
        aria-label="Название пункта"
        autocomplete="off"
      />
      <div class="add-item__row">
        <input
          v-model="draft.amount"
          class="input add-item__amount"
          :class="{ 'has-error': errors?.amount }"
          inputmode="decimal"
          placeholder="Кол-во"
          aria-label="Количество пункта"
        />
        <select
          v-model="draft.unit"
          class="input add-item__unit"
          aria-label="Единица пункта"
          :disabled="draft.amount.trim() === ''"
        >
          <option v-for="opt in UNIT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <button type="submit" class="btn btn-primary">Добавить</button>
      </div>
      <input
        v-if="draft.unit === 'custom' && draft.amount.trim() !== ''"
        v-model="draft.customUnit"
        class="input"
        :class="{ 'has-error': errors?.customUnit }"
        placeholder="Своя единица, например «пачка»"
        aria-label="Своя единица пункта"
      />
      <span v-if="errors" class="error">
        {{ [errors.name, errors.amount, errors.customUnit].filter(Boolean).join('. ') }}
      </span>
    </form>

    <div v-if="selectedRecipes.length" class="selected">
      <span class="muted">Рецепты:</span>
      <span v-for="r in selectedRecipes" :key="r.id" class="chip selected__chip">
        <RouterLink class="selected__link" :to="{ name: 'recipe', params: { id: r.id } }">{{ r.title }}</RouterLink>
        <button
          type="button"
          class="selected__remove"
          :aria-label="`Убрать «${r.title}» из покупок`"
          @click="setSelected(r.id, false)"
        >
          ✕
        </button>
      </span>
    </div>

    <p v-if="loading" class="muted">Загрузка…</p>

    <div v-else-if="rows.length === 0" class="empty">
      <p>Список пуст.</p>
      <p>
        Отметьте рецепты кнопкой 🛒 в
        <RouterLink :to="{ name: 'catalog' }">каталоге</RouterLink>
        или на странице рецепта — их ингредиенты появятся здесь. Или допишите что-нибудь своё в поле выше.
      </p>
    </div>

    <template v-else>
      <ul class="rows" data-testid="to-buy">
        <ShoppingRowItem
          v-for="row in toBuy"
          :key="row.key"
          :row="row"
          @toggle="toggle(row, $event)"
          @remove-manual="removeManual(row)"
        />
      </ul>
      <p v-if="toBuy.length === 0" class="muted all-bought">Всё куплено 🎉</p>

      <section v-if="bought.length" class="bought">
        <div class="bought__header">
          <h2>Куплено</h2>
          <button type="button" class="btn bought__clear" :disabled="!hasBoughtManual" @click="deleteBoughtManualItems">
            Очистить купленное
          </button>
        </div>
        <ul class="rows" data-testid="bought">
          <ShoppingRowItem
            v-for="row in bought"
            :key="row.key"
            :row="row"
            @toggle="toggle(row, $event)"
            @remove-manual="removeManual(row)"
          />
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.add-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
}

.add-item__row {
  display: flex;
  gap: var(--space-2);
}

.add-item__amount {
  flex: 1;
  min-width: 0;
}

.add-item__unit {
  width: 100px;
  flex: none;
}

.selected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.selected__chip {
  gap: var(--space-1);
  padding-right: var(--space-1);
}

.selected__link {
  color: inherit;
  text-decoration: none;
}

.selected__remove {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  min-width: 28px;
  min-height: 28px;
  padding: 0;
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.all-bought {
  text-align: center;
  padding: var(--space-4) 0;
}

.bought {
  margin-top: var(--space-5);
}

.bought__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.bought__header h2 {
  font-size: 16px;
  color: var(--color-text-muted);
}

.bought__clear {
  min-height: 36px;
  font-size: 14px;
}
</style>
