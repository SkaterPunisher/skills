---
name: tests-store
description: |
  Используй этот скилл, когда нужно написать тесты на zustand-стор. Триггеры: файл `**/store/**`, `**/stores/**`,
  `*.store.ts`, импорт `create` из `zustand`, наличие у файла `getState()` / экспорт хука `use<Smth>Store`.
  Не подходит для react-query/swr-хуков (используй `tests-queries`) и не подходит для UI-компонентов,
  которые лишь ЧИТАЮТ стор (они тестируются как компоненты — `tests-components` / `tests-components-mocked`,
  с моком стора через `jest.mock`).
---

# tests-store — формат тестов для zustand-стора

## Канонические примеры

При наличии файлов в `./examples/` — приоритет у них над шаблонами ниже. Если папка содержит только `PLACEHOLDER.md` — примеры ещё не добавлены, в этом случае следуй только шаблонам отсюда.

## Цель

Проверить, что:
- начальное состояние корректно;
- каждое action правильно меняет стейт;
- селекторы возвращают правильные срезы;
- между тестами стор сбрасывается, чтобы они были изолированы.

## Стек

- `zustand@4`
- `@jest/globals`
- jest 29

## Соглашения именования

- Файл: `<store>.test.ts` рядом с самим стором.
- `describe` — по-русски: `describe('проверка стора <имя>', ...)`.
- `it` — описывает действие/чтение: «action `setX` устанавливает X», «селектор `selectY` возвращает Y».

## Шаблон сброса стора

zustand-сторы — singleton-ы между тестами. ВСЕГДА сохраняй initial state и сбрасывай в `beforeEach`:

```ts
import { expect } from '@jest/globals';
import { useExampleStore } from '../exampleStore';

const initialState = useExampleStore.getState();

beforeEach(() => {
  useExampleStore.setState(initialState, true); // true = заменить целиком
});
```

> Если стор использует `persist` middleware — дополнительно очищай хранилище:
> `useExampleStore.persist?.clearStorage?.();`.

## Чтение и запись стейта в тестах

Без рендера React — работаем с API стора напрямую:

```ts
// чтение
const { count, items } = useExampleStore.getState();
expect(count).toBe(0);

// вызов action
useExampleStore.getState().increment();
expect(useExampleStore.getState().count).toBe(1);
```

## Скелет файла теста

```ts
import { expect } from '@jest/globals';

import { useExampleStore } from '../exampleStore';

const initialState = useExampleStore.getState();

describe('проверка стора useExampleStore', () => {
  beforeEach(() => {
    useExampleStore.setState(initialState, true);
  });

  it('содержит корректное начальное состояние', () => {
    const state = useExampleStore.getState();
    expect(state.count).toBe(0);
    expect(state.items).toEqual([]);
  });

  describe('action setItems', () => {
    it('устанавливает массив items', () => {
      useExampleStore.getState().setItems([{ id: '1' }]);
      expect(useExampleStore.getState().items).toEqual([{ id: '1' }]);
    });
  });

  describe('action increment', () => {
    it('увеличивает count на 1', () => {
      useExampleStore.getState().increment();
      useExampleStore.getState().increment();
      expect(useExampleStore.getState().count).toBe(2);
    });
  });

  describe('селектор selectHasItems', () => {
    it('возвращает false при пустом массиве', () => {
      expect(useExampleStore.getState().selectHasItems()).toBe(false);
    });

    it('возвращает true, если есть хотя бы один элемент', () => {
      useExampleStore.getState().setItems([{ id: '1' }]);
      expect(useExampleStore.getState().selectHasItems()).toBe(true);
    });
  });
});
```

## Что обязательно покрывать

1. Начальное состояние (один `it`, проверка ключевых полей).
2. Каждое action — отдельный `describe` с 1+ `it` (happy + edge: например «не падает при пустом входе»).
3. Каждый нетривиальный селектор — `describe` + минимум 2 `it` на разных стейтах.
4. Композиция actions, если она встречается в коде (последовательно вызвать a → b → проверить).
5. Reset/clear-action, если он есть в сторе.

## Тесты компонентов, читающих стор

Не в этом скилле. В компонентном тесте стор мокается:

```ts
jest.mock('@features/example/store', () => ({
  useExampleStore: jest.fn(),
}));

const mockUseExampleStore = useExampleStore as unknown as jest.Mock;
mockUseExampleStore.mockImplementation(selector =>
  selector({ count: 5, items: [], setItems: jest.fn(), increment: jest.fn() }),
);
```

## Антипаттерны (не делать)

- НЕ забывать сброс — иначе тесты текут друг в друга.
- НЕ рендерить React, если это не требуется. Стор тестируется как обычный объект.
- НЕ мокать сам zustand. Мокаются только сторы из проекта в тестах потребителей.
- НЕ менять стейт напрямую через `setState({ count: 999 })` в качестве «теста» action — вызывай само action.

## Чек-лист перед сдачей

- [ ] `initialState` сохранён до `describe`, `setState(initialState, true)` в `beforeEach`.
- [ ] По одному `describe` на action / селектор.
- [ ] Покрыт начальный стейт + все публичные actions + ключевые селекторы.
- [ ] `expect` из `@jest/globals`.
- [ ] Если есть `persist` — очистка хранилища.
- [ ] Локально: `npm run test:only-changed`.
