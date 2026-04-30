---
name: tests-hooks-generic
description: |
  Используй этот скилл, когда нужно протестировать кастомный React-хук БЕЗ сети, БЕЗ react-query/swr и
  БЕЗ zustand-стора. Это хуки на чистом `useState`/`useReducer`/`useEffect`/`useMemo`/`useCallback`/`useRef` —
  типа `useToggle`, `useDebounce`, `useDebouncedValue`, `useOnClickOutside`, `usePrevious`, `useDisclosure`,
  `useLocalStorage`-обёртки, `useElementSize`, `useEventListener` и т.п. Триггеры: имя файла `use<Smth>.ts`,
  файл лежит в `**/hooks/**`, импортирует только `react` (без `axios`/`react-query`/`swr`/`zustand`).
  Если хук дёргает сеть — используй `tests-queries`. Если хук работает со стором — `tests-store`.
  Если хук завязан на роутинг — `tests-routes`.
---

# tests-hooks-generic — формат тестов для обычных хуков

## Канонические примеры

При наличии файлов в `./examples/` — приоритет у них над шаблонами ниже. Если папка содержит только `PLACEHOLDER.md` — примеры ещё не добавлены, в этом случае следуй только шаблонам отсюда.

## Цель

Проверить контракт и поведение чистого хука: что он возвращает на разных входах, как реагирует на пропсы,
правильно ли отрабатывают `useEffect`/таймеры, корректно ли возвращаются мемоизированные значения.

## Стек

- `@testing-library/react-hooks@^8` (для React 17 — это правильная либа; не использовать `renderHook` из
  `@testing-library/react@13+`).
- `act` из `@testing-library/react-hooks` для синхронных обновлений стейта.
- `jest.useFakeTimers()` / `jest.advanceTimersByTime` — для хуков с задержками (debounce/throttle).
- `@jest/globals`.

## Соглашения именования

- Файл: `<useHook>.test.ts` рядом с хуком (или `.test.tsx`, если в обёртке нужен JSX).
- `describe` — по-русски: `describe('проверка хука <useHook>', ...)`.
- `it` — описывает контракт: «возвращает начальное значение», «переключает флаг при вызове toggle»,
  «обновляет значение через 300 мс».

## Шапка теста

```ts
import { expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-hooks';

import { useToggle } from '../useToggle';
```

## Скелет: простой хук состояния

```ts
import { expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-hooks';

import { useToggle } from '../useToggle';

describe('проверка хука useToggle', () => {
  it('возвращает false по умолчанию', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('принимает initialValue=true', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('переключает значение при вызове toggle', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1](); // toggle
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(false);
  });
});
```

## Скелет: хук с таймерами (debounce)

```ts
import { expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-hooks';

import { useDebouncedValue } from '../useDebouncedValue';

describe('проверка хука useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('сразу возвращает начальное значение', () => {
    const { result } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    expect(result.current).toBe('a');
  });

  it('обновляет значение только после задержки', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('сбрасывает таймер при быстром повторном изменении', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: 'c' });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });
});
```

## Скелет: хук с подпиской на DOM-событие

```ts
import { expect } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-hooks';

import { useOnClickOutside } from '../useOnClickOutside';

describe('проверка хука useOnClickOutside', () => {
  it('вызывает handler при клике вне ref', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') } as React.MutableRefObject<HTMLDivElement>;
    document.body.appendChild(ref.current);

    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('не вызывает handler при клике внутри ref', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') } as React.MutableRefObject<HTMLDivElement>;
    document.body.appendChild(ref.current);

    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      ref.current.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
```

## Что обязательно покрывать

1. **Начальное значение** / форма возвращаемого объекта.
2. **Реакция на initialProps** через `initialProps` в `renderHook`.
3. **Каждое action**, которое хук экспортирует (`toggle`, `open`, `close`, `set`, `reset`).
4. **Реакция на изменение пропсов** через `rerender({ ... })`.
5. **Очистка эффектов** — для хуков с `useEffect` подпиской на события: проверь что при `unmount`
   подписка снимается (через `unmount()` и повторный dispatch — handler не должен сработать).
6. **Таймеры** — для debounce/throttle: `useFakeTimers` + `advanceTimersByTime`.

## Использование `act`

ВСЕГДА оборачивай в `act` любое изменение, которое может вызвать `setState`/таймер/событие:

- вызов action из `result.current.<method>()` — в `act`.
- `jest.advanceTimersByTime(...)` — в `act`.
- `dispatchEvent(...)` — в `act`.
- сам `renderHook(...)` оборачивать НЕ нужно.
- `rerender(...)` сам себя оборачивает в act (но если внутри есть таймер — `advanceTimersByTime` всё равно
  в `act`).

## Антипаттерны

- НЕ использовать `renderHook` из `@testing-library/react@13+` (требует React 18). Только из
  `@testing-library/react-hooks`.
- НЕ использовать `await waitFor(...)` для синхронных эффектов — используй `act`.
- НЕ забывать `jest.useRealTimers()` в `afterEach` для тестов с фейковыми таймерами.
- НЕ дёргать `result.current` после `unmount()` — будет ошибка.
- НЕ оборачивать тестируемый хук в свой компонент — `renderHook` сам это делает.

## Чек-лист перед сдачей

- [ ] `renderHook` из `@testing-library/react-hooks`.
- [ ] `act` для всех мутаций.
- [ ] Покрыт начальный возврат + каждое action + реакция на изменение пропсов.
- [ ] Для таймеров — `useFakeTimers/useRealTimers` в `beforeEach`/`afterEach`.
- [ ] Для подписок — проверка очистки на `unmount`.
- [ ] `expect` из `@jest/globals`.
- [ ] Локально: `npm run test:only-changed`.
