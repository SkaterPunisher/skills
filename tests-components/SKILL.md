---
name: tests-components
description: |
  Используй этот скилл, когда нужно написать или дополнить тесты на «обычный» React-компонент UI
  (без сложных внешних зависимостей, которые надо мокать). Триггеры: пользователь просит «написать тесты»
  для файла из `**/components/**`, `**/ui/**`, `**/fields/**` (`*.tsx`), компонент работает с формой
  (Formik), пользовательским вводом, рисует элементы из `@sber-space-ui/*`, и для проверки достаточно отрендерить
  и подёргать UI через `userEvent`. Если компонент ОПИРАЕТСЯ на кастомные хуки/контексты, которые нужно мокать —
  используй `tests-components-mocked`. Если это hook без UI — `tests-queries` (для запросов) или общий hook-skill.
---

# tests-components — формат тестов для UI-компонентов

## Канонические примеры

В первую очередь сверяйся с файлами в `./examples/` — это эталон для проекта, имеющий приоритет над абстрактными шаблонами ниже. Если стиль расходится — пиши как в примерах.

## Цель

Тесты компонентов через `@testing-library/react` + `@testing-library/user-event`, которые имитируют реального
пользователя: клики, ввод, проверка отрендеренного UI по `data-testid` / `getByText` / ролям.

## Стек

- `@testing-library/react@^12` (React 17)
- `@testing-library/user-event@^14`
- `@testing-library/jest-dom`
- `formik` (если поле работает в форме)
- `@jest/globals` (`expect` импортируется явно)
- jest 29

## Соглашения именования

- Файл: `<Component>.test.tsx` рядом с исходником.
- `describe` — по-русски: `describe('проверка компонента <Component>', ...)`.
- `it` — описывает сценарий пользователя: «при клике на …», «когда введён …, отображает …».

## Обязательная шапка теста

```tsx
import { render, screen } from '@testing-library/react';
import { Form, Formik } from 'formik';

import { expect } from '@jest/globals';
import userEvent from '@testing-library/user-event';

import { <Component> } from '../<Component>';
```

`userEvent` ВСЕГДА инициализируется в начале describe:

```ts
const user = userEvent.setup();
```

## Скелет теста для поля Formik

```tsx
import { render, screen } from '@testing-library/react';
import { Form, Formik } from 'formik';

import { expect } from '@jest/globals';
import userEvent from '@testing-library/user-event';

import { CalendarField } from '../CalendarField';

describe('проверка компонента CalendarField', () => {
  const user = userEvent.setup();

  it('при вводе в поле даты отображается выбранный диапазон в календаре', async () => {
    render(
      <Formik initialValues={{ calendar: '' }} onSubmit={jest.fn()}>
        <Form>
          <CalendarField name={'calendar'} range label={'Выберите дату операции'} />
        </Form>
      </Formik>,
    );

    const input = await screen.findByTestId('field');

    await user.click(input);
    await user.clear(input);
    await user.type(input, '01.02.2025 - 05.02.2025');

    // ...assert через findByTestId / getByText
  });
});
```

## Что обязательно покрывать

1. Рендер с обязательными пропсами — компонент появился (smoke).
2. Основной сценарий пользователя (ввод, клик, выбор) → ожидаемое состояние UI.
3. Альтернативный путь ввода, если он есть (например, ввод текстом vs клик по календарю).
4. Граничные значения, если у компонента есть валидация (но валидаторы как функции тестируем отдельно
   через `tests-utils`).
5. `data-testid` подтверждаем через `findByTestId` / `findAllByTestId` (асинхронно — DOM может обновляться).

## Правила выборки элементов

- Приоритет: `findByTestId` → `findByRole` → `findByText`. Чем устойчивее к рефактору — тем лучше.
- `findBy*` (асинхронный) для элементов, которые появляются после действия пользователя.
- `getBy*` — только если элемент гарантированно уже в DOM на момент рендера.
- Для нескольких одинаковых элементов: `findAllByTestId(...)` + `.filter(el => ...)`.
- Прямой доступ к DOM (`querySelector`) — только если testId не доступен (например, для `<svg>` внутри обёртки).

## Работа с пользователем (userEvent v14)

- Сетап: `const user = userEvent.setup();` — один раз на `describe`.
- Все методы у `user` — async: `await user.click(el)`, `await user.type(el, '...')`, `await user.clear(el)`.
- НЕ использовать `fireEvent.*` для типовых пользовательских действий (только если нет аналога в userEvent —
  например, скролл).

## Антипаттерны (не делать)

- НЕ мокать ничего, что можно отрендерить «по-настоящему» (Formik, контексты UI-кита).
- НЕ дёргать стейт компонента напрямую — только через UI.
- НЕ полагаться на классы (`className.includes('...')`) для assert'ов, если есть `data-testid`.
  Исключение — состояния стилизованных UI-кит элементов (`selected-first`, `next` и т.п.) — в эталонных
  тестах это допустимо.
- НЕ оборачивать в `act` руками для async-сценариев — `userEvent` сам всё делает.

## Чек-лист перед сдачей

- [ ] Файл `<Component>.test.tsx`, лежит рядом с компонентом.
- [ ] `describe('проверка компонента <Component>', ...)`.
- [ ] `userEvent.setup()` на верхнем уровне `describe`.
- [ ] `expect` импортирован из `@jest/globals`.
- [ ] Покрыт минимум 1 happy-path сценарий + 1 альтернативный, если есть.
- [ ] `findByTestId` / `findAllByTestId` для асинхронного DOM.
- [ ] Если компонент в форме — обёрнут в `<Formik><Form>...</Form></Formik>` с минимальными `initialValues`
      и `onSubmit={jest.fn()}`.
- [ ] Локально проходит: `npm run test:only-changed`.
