---
name: tests-components-mocked
description: |
  Используй этот скилл, когда нужно написать тесты на «контейнерный» React-компонент, который дёргает кастомные
  хуки данных (`useCalendarMOEXShift`, `useConfoByParamsAndTradeByParams` и т.п.), вложенные провайдеры или
  тяжёлые UI-обёртки (`SidebarWrapper`, `LoaderRmOc`), и эти зависимости нужно МОКАТЬ через `jest.mock`.
  Триггеры: компонент импортирует кастомные хуки из `./hooks/*`, оборачивает в `QueryClientProvider`, рендерит
  внутри `Formik` через `SidebarWrapper`, использует `ProtectedProvider` / `UfsUserProvider` и подобные доступы.
  Если компонент простой (никаких моков не требуется) — используй `tests-components`. Для самих хуков-запросов —
  `tests-queries`.
---

# tests-components-mocked — формат тестов для компонентов с моками хуков и провайдеров

## Канонические примеры

В первую очередь сверяйся с файлами в `./examples/` — это эталон для проекта, имеющий приоритет над абстрактными шаблонами ниже. Если стиль расходится — пиши как в примерах.

## Цель

Изолировать компонент от реальных хуков данных, контекстов и тяжёлых обёрток — мокать их через `jest.mock`,
и проверять только поведение самого компонента: что он рендерит при разных состояниях моков, и какие пропсы
передаёт детям.

## Стек

- `@testing-library/react@^12`
- `@tanstack/react-query` v4 — для оборачивания в `QueryClientProvider`, если компонент дёргает хуки на нём
- `jest.mock` (имя модуля) и `jest.fn()` — для моков
- `@jest/globals`

## Соглашения именования

- Файл: `<Component>.test.tsx` рядом с компонентом.
- `describe` — короткое имя компонента: `describe('DocumentsSidebar', ...)` ИЛИ
  `describe('проверка компонента <Component>', ...)`. Оба варианта валидны (см. эталонные тесты).
- `it` — по-русски, описывает наблюдаемое поведение: «должен отображать ...», «должен вызывать ...».

## Шапка теста

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';

import { expect } from '@jest/globals';

import { <Component> } from '../<Component>';
import { useSomeHook } from '../hooks/useSomeHook';
```

## Шаблон моков

```tsx
// 1) Тяжёлые обёртки: заменяем на простой div с data-testid и пробросом пропсов
jest.mock('@shared/components/common', () => ({
  SidebarWrapper: jest.fn(({ description, filters, isFetching, onReset, table, title }) => (
    <div data-testid={'sidebar-wrapper'}>
      <h1>{title}</h1>
      <p>{description}</p>
      <div data-testid={'filters'}>{filters}</div>
      <div data-testid={'table'}>{table}</div>
      <div data-testid={'isFetching'}>{isFetching ? 'Loading...' : 'Not loading'}</div>
      <button type={'button'} onClick={onReset}>Reset</button>
    </div>
  )),
}));

jest.mock('@shared/components/ui', () => ({
  LoaderRmOc: jest.fn(() => <div data-testid={'loader'}>Loading...</div>),
}));

// 2) Кастомные хуки данных — мокаем сам модуль
jest.mock('../hooks/useSomeHook');

// 3) Дочерние компоненты, рендер которых мешает изоляции
jest.mock('../components/Filters/Filters', () => ({
  Filters: jest.fn(() => <div data-testid={'filters-component'}>Mock Filters</div>),
}));

// 4) Кастим к jest.Mock, чтобы менять возвращаемые значения в тестах
const mockUseSomeHook = useSomeHook as jest.Mock;
```

## Хелпер обёртки в QueryClient

Если компонент или его дети используют react-query, всегда оборачивай в свежий `QueryClient`:

```tsx
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        cacheTime: 0,
        retry: false,
      },
    },
  });

const renderWithQuery = (ui: ReactElement) => {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};
```

## Шаблон `beforeEach`

ВСЕГДА чистим моки и ставим дефолтные «удачные» возвраты, чтобы каждый `it` был изолирован:

```tsx
beforeEach(() => {
  jest.clearAllMocks();

  mockUseCalendarMOEXShift.mockReturnValue({
    data: { nextDay: new Date('2023-01-02'), pastDay: new Date('2023-01-01') },
    isLoading: false,
  });

  mockUseConfoByParamsAndTransfersForNettings.mockReturnValue({
    count: 10,
    isError: false,
    isFetching: false,
    isIdle: false,
    refetch: jest.fn(),
    tableData: [],
  });
});
```

В отдельном `it` переопределяй то, что нужно: `mockUseCalendarMOEXShift.mockReturnValue({ data: null, isLoading: true })`.

## Что обязательно покрывать

1. **Состояние загрузки**: один из хуков возвращает `isLoading: true` / `isFetching: true` → ожидаем
   loader или соответствующий UI.
2. **Дефолтный рендер**: «успешные» моки → ожидаем что обёртка/контейнер появилась (`getByTestId('sidebar-wrapper')`).
3. **Передача данных дочкам**: переопределяем хук с непустыми `tableData` → проверяем, что таблица отрендерилась.
4. **Колбэки**: симулируем клик/действие → проверяем что мок-функция была вызвана (`expect(MockedWrapper).toHaveBeenCalled()`).
5. **Тексты/`data-testid` от моков**: дополнительные проверки на содержимое (`toHaveTextContent`).

## Шаблон для компонента с access-провайдером

По образцу `ProtectedProvider`: оборачиваем в провайдер пользователя, проверяем рендер children
для разрешённой роли и fallback для запрещённой.

```tsx
import { render } from '@testing-library/react';
import { expect } from '@jest/globals';

import { UfsUser } from '@sber-rmoc/lib.utils';
import { AccessError } from '@shared/components/common/plugsAndErrors/AccessError';
import { UserRoles } from '@shared/constants';

import { ProtectedProvider } from '../ProtectedProvider';
import { UfsUserProvider } from '../UfsUserProvider';

const demoUserAllowed = { userRoles: [UserRoles.SECOPERATIONS] } as unknown as UfsUser;
const demoUserForbidden = { userRoles: ['AnotherRole'] } as unknown as UfsUser;

describe('проверка контейнера ProtectedProvider', () => {
  it('отображает children, если у пользователя есть нужная роль', () => {
    const { container } = render(
      <UfsUserProvider user={demoUserAllowed}>
        <ProtectedProvider allowedRoles={[UserRoles.SECOPERATIONS]} fallback={<AccessError />}>
          <div>children</div>
        </ProtectedProvider>
      </UfsUserProvider>,
    );

    expect(container).toHaveTextContent('children');
  });

  it('отображает fallback, если у пользователя нет нужной роли', () => {
    const { container } = render(
      <UfsUserProvider user={demoUserForbidden}>
        <ProtectedProvider allowedRoles={[UserRoles.SECOPERATIONS]} fallback={<AccessError />}>
          <div>children</div>
        </ProtectedProvider>
      </UfsUserProvider>,
    );

    expect(container).not.toHaveTextContent('children');
    expect(container).toHaveTextContent('Нет доступа к компоненту');
  });
});
```

## Антипаттерны (не делать)

- НЕ ходить в реальный `axios`/сеть. Если хук в моке возвращает данные — этого достаточно.
- НЕ мокать ВСЁ подряд. Мокать только то, что мешает изоляции (внешние хуки, тяжёлые обёртки, дочерние
  компоненты с собственными запросами).
- НЕ забывать `jest.clearAllMocks()` в `beforeEach` — иначе моки протекают между `it`.
- НЕ создавать ОДИН глобальный `QueryClient` на все тесты — у каждого рендера свой свежий клиент.
- НЕ опираться на внутреннее имя пропса в моке — вытаскивай по имени из деструктуризации (`({ title, table }) => ...`).

## Чек-лист перед сдачей

- [ ] Все внешние хуки и тяжёлые обёртки замоканы через `jest.mock(...)`.
- [ ] Касты `as jest.Mock` для управления возвратами.
- [ ] `beforeEach` со `jest.clearAllMocks()` и дефолтными `mockReturnValue`.
- [ ] Если есть react-query — обёртка `renderWithQuery` со свежим клиентом.
- [ ] Покрыты состояния: loading, default, с данными, обработка колбэка.
- [ ] `expect` из `@jest/globals`.
- [ ] Локально: `npm run test:only-changed`.
