# Рецепты

Личное приложение для рецептов: пересчёт ингредиентов по порциям, отметки «куплено», общий список покупок по нескольким рецептам, коллекции и оценки.

Работает без сервера: все данные хранятся в браузере на устройстве (IndexedDB), приложение устанавливается на телефон как PWA и работает офлайн. Чтобы не потерять данные, регулярно делайте экспорт на экране «Данные».

Приложение: https://maeglian.github.io/dar-recipes/

## Разработка

```bash
npm install
npm run dev        # dev-сервер
npm test           # unit- и компонентные тесты (Vitest)
npm run typecheck  # проверка типов
npm run build      # сборка в dist/
npm run preview    # просмотр собранной версии
```

Стек: Vue 3, TypeScript, Vite, Vue Router, Dexie (IndexedDB), vite-plugin-pwa.

## Деплой

Каждый пуш в `main` собирается и публикуется на GitHub Pages через GitHub Actions (`.github/workflows/deploy.yml`). В настройках репозитория должно быть выбрано Settings → Pages → Source: **GitHub Actions**.

## Планирование

Требования и дизайн описаны в OpenSpec: `openspec/changes/` и `openspec/specs/`.
