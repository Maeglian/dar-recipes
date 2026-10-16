<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import CollectionPicker from '../components/CollectionPicker.vue'
import IngredientEditor from '../components/IngredientEditor.vue'
import { useObjectUrl } from '../composables/useObjectUrl'
import { newId } from '../data/db'
import { getImage, setImage } from '../data/imageRepository'
import { createRecipe, getRecipe, updateRecipe } from '../data/recipeRepository'
import { compressImage } from '../domain/image'
import type { Ingredient } from '../domain/types'
import { validateRecipe, type IngredientDraft, type RecipeDraft, type RecipeErrors } from '../domain/validation'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isNew = computed(() => !props.id)
const loading = ref(!!props.id)
const notFound = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const errors = ref<RecipeErrors | null>(null)

const draft = ref<RecipeDraft>({
  title: '',
  baseServings: '2',
  description: '',
  ingredients: [emptyIngredient()],
  collectionIds: [],
})

const image = shallowRef<Blob | null>(null)
const imageChanged = ref(false)
const imageError = ref<string | null>(null)
const imageProcessing = ref(false)
const imageUrl = useObjectUrl(image)

function emptyIngredient(): IngredientDraft {
  return { id: newId(), name: '', amount: '', unit: 'g', customUnit: '', bought: false }
}

function toDraft(i: Ingredient): IngredientDraft {
  return {
    id: i.id,
    name: i.name,
    amount: i.amount === null ? '' : String(i.amount).replace('.', ','),
    unit: i.unit ?? 'g',
    customUnit: i.customUnit ?? '',
    bought: i.bought,
  }
}

async function load(id: string) {
  const recipe = await getRecipe(id)
  if (!recipe) {
    notFound.value = true
    loading.value = false
    return
  }
  draft.value = {
    title: recipe.title,
    baseServings: String(recipe.baseServings),
    description: recipe.description,
    ingredients: recipe.ingredients.map(toDraft),
    collectionIds: [...recipe.collectionIds],
  }
  image.value = recipe.hasImage ? ((await getImage(id)) ?? null) : null
  loading.value = false
}

if (props.id) void load(props.id)

function addIngredient() {
  draft.value.ingredients.push(emptyIngredient())
}

function removeIngredient(index: number) {
  draft.value.ingredients.splice(index, 1)
}

function moveIngredient(index: number, delta: number) {
  const list = draft.value.ingredients
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item!)
}

async function onImagePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  imageError.value = null
  imageProcessing.value = true
  try {
    image.value = await compressImage(file)
    imageChanged.value = true
  } catch {
    // Текущая картинка остаётся прежней
    imageError.value = 'Не удалось прочитать файл как изображение'
  } finally {
    imageProcessing.value = false
  }
}

function removeImage() {
  image.value = null
  imageChanged.value = true
  imageError.value = null
}

function ingredientErrors(id: string) {
  return errors.value?.ingredients[id]
}

async function save() {
  saveError.value = null
  const result = validateRecipe(draft.value)
  if (!result.ok) {
    errors.value = result.errors
    return
  }
  errors.value = null
  saving.value = true
  try {
    const id = props.id ?? (await createRecipe(result.value))
    if (props.id) await updateRecipe(props.id, result.value)
    if (imageChanged.value) await setImage(id, image.value)
    await router.replace({ name: 'recipe', params: { id } })
  } catch (err) {
    saveError.value = describeSaveError(err)
  } finally {
    saving.value = false
  }
}

function describeSaveError(err: unknown): string {
  const name = (err as { name?: string; inner?: { name?: string } })?.name
  const inner = (err as { inner?: { name?: string } })?.inner?.name
  if (name === 'QuotaExceededError' || inner === 'QuotaExceededError') {
    return 'На устройстве закончилось место для данных приложения. Удалите ненужные рецепты или картинки, сделайте экспорт.'
  }
  return 'Не удалось сохранить рецепт. Попробуйте ещё раз.'
}

function cancel() {
  if (props.id) void router.replace({ name: 'recipe', params: { id: props.id } })
  else void router.replace({ name: 'catalog' })
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>{{ isNew ? 'Новый рецепт' : 'Редактирование' }}</h1>
    </header>

    <p v-if="loading" class="muted">Загрузка…</p>
    <div v-else-if="notFound" class="empty">
      <p>Рецепт не найден.</p>
      <RouterLink class="btn" to="/">К рецептам</RouterLink>
    </div>

    <form v-else class="recipe-form" novalidate @submit.prevent="save">
      <div class="field">
        <label for="title">Название</label>
        <input
          id="title"
          v-model="draft.title"
          class="input"
          :class="{ 'has-error': errors?.title }"
          autocomplete="off"
        />
        <span v-if="errors?.title" class="error">{{ errors.title }}</span>
      </div>

      <div class="field">
        <span class="field-label">Картинка</span>
        <div v-if="imageUrl" class="recipe-form__image">
          <img :src="imageUrl" alt="" />
        </div>
        <div class="recipe-form__image-actions">
          <label class="btn">
            {{ image ? 'Заменить' : 'Добавить картинку' }}
            <input type="file" accept="image/*" class="visually-hidden" data-testid="image-input" @change="onImagePicked" />
          </label>
          <button v-if="image" type="button" class="btn btn-danger" @click="removeImage">Удалить</button>
          <span v-if="imageProcessing" class="muted">Обработка…</span>
        </div>
        <span v-if="imageError" class="error">{{ imageError }}</span>
      </div>

      <div class="field">
        <label for="base-servings">Порций в рецепте</label>
        <input
          id="base-servings"
          v-model="draft.baseServings"
          class="input recipe-form__servings"
          :class="{ 'has-error': errors?.baseServings }"
          inputmode="numeric"
        />
        <span v-if="errors?.baseServings" class="error">{{ errors.baseServings }}</span>
        <span class="muted recipe-form__hint">Количества ингредиентов указываются на это число порций</span>
      </div>

      <section class="field">
        <span class="field-label">Ингредиенты</span>
        <IngredientEditor
          v-for="(row, index) in draft.ingredients"
          :key="row.id"
          v-model="draft.ingredients[index]!"
          :index="index"
          :total="draft.ingredients.length"
          :errors="ingredientErrors(row.id)"
          @move-up="moveIngredient(index, -1)"
          @move-down="moveIngredient(index, 1)"
          @remove="removeIngredient(index)"
        />
        <button type="button" class="btn recipe-form__add" @click="addIngredient">+ Ингредиент</button>
      </section>

      <div class="field">
        <span class="field-label">Коллекции</span>
        <CollectionPicker v-model="draft.collectionIds" />
      </div>

      <div class="field">
        <label for="description">Описание</label>
        <textarea id="description" v-model="draft.description" class="input" rows="8" />
      </div>

      <p v-if="errors" class="error" role="alert">Исправьте ошибки в отмеченных полях</p>
      <p v-if="saveError" class="error" role="alert">{{ saveError }}</p>

      <div class="recipe-form__footer">
        <button type="button" class="btn" @click="cancel">Отмена</button>
        <button type="submit" class="btn btn-primary" :disabled="saving || imageProcessing">Сохранить</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.recipe-form__image {
  border-radius: var(--radius);
  overflow: hidden;
  max-height: 240px;
}

.recipe-form__image img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
}

.recipe-form__image-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.recipe-form__servings {
  max-width: 120px;
}

.recipe-form__hint {
  font-size: 14px;
}

.recipe-form__add {
  margin-top: var(--space-3);
  align-self: flex-start;
}

.recipe-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
</style>
