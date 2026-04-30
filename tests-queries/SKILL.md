---
name: tests-queries
description: |
  Используй этот скилл, когда нужно написать тесты на кастомный хук-запрос на `@tanstack/react-query` v4
  (`useQuery`, `useMutation`, `useInfiniteQuery`) или на хук-обёртку над `swr`. Триггеры: имя файла
  `use<Smth>.ts`, файл импортирует `useQuery` / `useMutation` / `useSWR`, лежит в `**/hooks/**` или
  `**/api/**`/`**/queries/**`. HTTP-вызовы делаются через общий axios-инстанс — мокаются через
  `axios-mock-adapter`. Не подходит для UI-компонентов (там моки самих хуков — см. `tests-components-mocked`)
  и для чистых утилит (`tests-utils`).
---

# tests-queries — формат тестов для хуков-запросов (react-query / swr)

## Канонические примеры

При наличии файлов в `./examples/` — приоритет у них над шаблонами ниже. Если папка содержит только `PLACEHOLDER.md` — примеры ещё не добавлены, в этом случае следуй только шаблонам отсюда.

## Цель

Проверить контракт кастомного хука: какие данные он возвращает в success / error / loading,
как он реагирует на параметры (вкл/выкл через `enabled`, инвалидация, рефетч), и что он передаёт правильные
параметры в HTTP-запрос.

## Стек

- `@tanstack/react-query@^4`
- `@testing-library/react-hooks@^8` (для React 17 — не использовать `renderHook` из `@testing-library/react@13+`,
  он не совместим)
- `axios@0.26` + `axios-mock-adapter@^1`
- `@jest/globals`
- jest 29

## Соглашения именования

- Файл: `<useHook>.test.ts` (или `.test.tsx`, если в обёртке нужны JSX-провайдеры).
- `describe` — по-русски: `describe('проверка хука <useHook>', ...)`.
- `it` — описывает контракт: «возвращает данные при успешном ответе», «возвращает isError при 500», и т.д.

## Хелперы (один раз на файл)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-hooks';
import { ReactNode } from 'react';

import MockAdapter from 'axios-mock-adapter';
import { axiosInstance } from '@shared/api/axios'; // ваш общий axios

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false },
    },
  });

const wrapperWith = (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
```

## Скелет файла

```tsx
import { expect } from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';

import { axiosInstance } from '@shared/api/axios';
import { useTransfersForNettings } from '../useTransfersForNettings';

describe('проверка хука useTransfersForNettings', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(axiosInstance);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  it('возвращает данные и tableData при успешном ответе', async () => {
    mock.onGet(/\/api\/transfers/).reply(200, {
      items: [{ id: '1' }, { id: '2' }],
      total: 2,
    });

    const queryClient = createQueryClient();
    const { result, waitFor } = renderHook(() => useTransfersForNettings(100, 0, null), {
      wrapper: wrapperWith(queryClient),
    });

    await waitFor(() => result.current.isSuccess);

    expect(result.current.tableData).toHaveLength(2);
    expect(result.current.count).toBe(2);
    expect(result.current.isError).toBe(false);
  });

  it('возвращает isError при ответе 500', async () => {
    mock.onGet(/\/api\/transfers/).reply(500);

    const queryClient = createQueryClient();
    const { result, waitFor } = renderHook(() => useTransfersForNettings(100, 0, null), {
      wrapper: wrapperWith(queryClient),
    });

    await waitFor(() => result.current.isError);

    expect(result.current.isError).toBe(true);
    expect(result.current.tableData).toEqual([]);
  });

  it('не делает запрос, пока params=null (enabled=false)', async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTransfersForNettings(100, 0, null), {
      wrapper: wrapperWith(queryClient),
    });

    expect(result.current.isIdle).toBe(true);
    expect(mock.history.get).toHaveLength(0);
  });
});
```

## Что обязательно покрывать

1. **Success**: успешный ответ → проверяем форму данных, `isSuccess`, маппинг в `tableData/count` и т.п.
2. **Error**: 4xx/5xx → `isError: true`, fallback-значения.
3. **Idle/disabled**: если у хука есть `enabled: !!params` — проверяем, что без параметров запрос не уходит
   (`mock.history.get.length === 0`).
4. **Параметры запроса**: проверяем `mock.history.get[0].params` / `.url`, что пагинация и фильтры
   передались корректно.
5. **Refetch / invalidate**: если хук экспортирует `refetch` — вызываем и убеждаемся, что новый запрос ушёл.
6. **Mutation**: для `useMutation` — `mutate(...)`, проверка success-колбэка и побочного `invalidateQueries`,
   если он есть.

## Шаблон для SWR

```tsx
import { SWRConfig } from 'swr';

const wrapperSWR = ({ children }: { children: ReactNode }) =>
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;
```

Дальше всё аналогично: `axios-mock-adapter` на запросах, `renderHook(..., { wrapper: wrapperSWR })`,
`waitFor(() => result.current.data)`.

## Антипаттерны (не делать)

- НЕ использовать `renderHook` из `@testing-library/react` версии 13+ — она требует React 18.
  В этом проекте — `@testing-library/react-hooks`.
- НЕ переиспользовать один `QueryClient` между `it` — кэш утечёт. Создавай новый клиент в каждом тесте.
- НЕ мокать сам `useQuery`/`useMutation`. Мокается транспорт (axios), хук работает по-настоящему.
- НЕ ставить `retry` по умолчанию — тесты ошибок будут висеть. Всегда `retry: false`.
- НЕ забывать `mock.reset()` / `mock.restore()` в `afterEach`.

## Чек-лист перед сдачей

- [ ] `MockAdapter(axiosInstance)` создан в `beforeEach`, сброшен в `afterEach`.
- [ ] `createQueryClient()` с `retry: false`, `cacheTime: 0` — новый на каждый рендер.
- [ ] `renderHook` из `@testing-library/react-hooks`.
- [ ] Покрыты success / error / idle (если есть `enabled`).
- [ ] Проверены параметры запроса через `mock.history`.
- [ ] `expect` из `@jest/globals`.
- [ ] Локально: `npm run test:only-changed`.
