# Канонические примеры — `tests-components-mocked`

При написании теста на контейнер с моками хуков и провайдеров сначала смотри сюда, потом — в `../SKILL.md`. Если стиль расходится — приоритет у файлов в этой папке.

## Файлы

### Сценарий «контейнер + кастомные хуки данных + тяжёлые обёртки»

- `DocumentsSidebar.tsx` — контейнерный компонент: использует три кастомных хука (`useCalendarMOEXShift`, `useConfoByParamsAndTransfersForNettings`, `useConfoByParamsAndTradeByParams`) и обёртку `SidebarWrapper`.
- `DocumentsSidebar.test.tsx` — эталонный тест: `jest.mock` хуков, `jest.mock` обёрток, кастинг к `jest.Mock`, `beforeEach` с дефолтными `mockReturnValue`, хелпер `renderWithQuery` с свежим `QueryClient`.

### Сценарий «контейнер с провайдером доступа»

- `ProtectedProvider.tsx` — компонент-ограничитель доступа на основе хука `useCheckAccess`.
- `ProtectedProvider.test.tsx` — эталонный тест: оборачивание в `<UfsUserProvider>` с разными ролями, проверка рендера children и fallback.

> Файлы — копия рабочих компонентов из проекта. При переносе в репозиторий замени их на актуальную версию.
