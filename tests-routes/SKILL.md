---
name: tests-routes
description: |
  Используй этот скилл, когда нужно протестировать компонент или хук, завязанный на `react-router-dom@6`:
  использует `useParams`, `useNavigate`, `useLocation`, `useSearchParams`, `<Link>`, `<NavLink>`, `<Outlet>`,
  объявляет `<Routes>`/`<Route>`. Триггеры: импорт из `react-router-dom`, файл лежит в `**/pages/**`,
  `**/routes/**`, или содержит роутер-конфиг. Если компонент только использует `<Link>` визуально, без
  реальной навигации, тестируй как обычный UI через `tests-components`. Для контейнеров с роутом + хуками
  данных можно комбинировать с `tests-components-mocked` (моки хуков + MemoryRouter обёртка).
---

# tests-routes — формат тестов для компонентов c react-router-dom v6

## Канонические примеры

При наличии файлов в `./examples/` — приоритет у них над шаблонами ниже. Если папка содержит только `PLACEHOLDER.md` — примеры ещё не добавлены, в этом случае следуй только шаблонам отсюда.

## Цель

Проверить:
- что компонент корректно читает параметры из URL (`useParams`, `useSearchParams`);
- что навигация (`useNavigate`, `<Link>`) уводит на ожидаемый URL;
- что `<Outlet>` рендерит вложенные роуты;
- что условный рендер по пути (`Routes` + `Route`) работает.

## Стек

- `react-router-dom@6.2.2`
- `@testing-library/react@^12`
- `@testing-library/user-event@^14`
- `@jest/globals`

## Соглашения именования

- Файл: `<Component>.test.tsx`.
- `describe` — по-русски: `describe('проверка страницы <Page>', ...)` или
  `describe('проверка хука useXxx (роуты)', ...)`.

## Хелпер обёртки в `MemoryRouter`

ВСЕГДА оборачивай в `MemoryRouter` со стартовым `initialEntries`:

```tsx
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReactElement } from 'react';

const renderWithRouter = (
  ui: ReactElement,
  { route = '/', path = '/' }: { route?: string; path?: string } = {},
) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
```

## Скелет: чтение `useParams`

```tsx
import { render, screen } from '@testing-library/react';

import { expect } from '@jest/globals';

import { DocumentPage } from '../DocumentPage';

import { renderWithRouter } from './test-utils';

describe('проверка страницы DocumentPage', () => {
  it('отображает id документа из URL', () => {
    renderWithRouter(<DocumentPage />, { route: '/documents/42', path: '/documents/:id' });

    expect(screen.getByText('Документ #42')).toBeInTheDocument();
  });
});
```

## Скелет: проверка `useNavigate`

Самый частый кейс — клик уводит куда-то. Делать через подмену `useNavigate`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { expect } from '@jest/globals';
import userEvent from '@testing-library/user-event';

import { OpenDocumentButton } from '../OpenDocumentButton';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('проверка кнопки OpenDocumentButton', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('переходит на страницу документа при клике', async () => {
    render(
      <MemoryRouter>
        <OpenDocumentButton id={'42'} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /открыть/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/documents/42');
  });
});
```

## Скелет: переход по `<Link>`

Если ссылка — обычный `<Link to="...">`, тестируй через реальный `MemoryRouter` с несколькими `<Route>`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { expect } from '@jest/globals';
import userEvent from '@testing-library/user-event';

import { Sidebar } from '../Sidebar';

describe('проверка перехода по ссылкам в Sidebar', () => {
  const user = userEvent.setup();

  it('после клика по «Документы» открывается /documents', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
        <Routes>
          <Route path={'/'} element={<div>Главная</div>} />
          <Route path={'/documents'} element={<div data-testid={'documents-page'}>Страница документов</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: /документы/i }));

    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
  });
});
```

## Скелет: `useSearchParams`

```tsx
it('читает фильтр из ?status=done', () => {
  render(
    <MemoryRouter initialEntries={['/list?status=done']}>
      <Routes>
        <Route path={'/list'} element={<List />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Статус: done')).toBeInTheDocument();
});
```

## Что обязательно покрывать

1. **Чтение URL**: `useParams` / `useSearchParams` — отдельный `it` на каждый параметр.
2. **Навигация**: для `useNavigate` — мок и проверка вызова с правильным аргументом. Для `<Link>` —
   реальный переход с проверкой нового рендера.
3. **Условный рендер по пути**: если в компоненте есть `<Routes>` — отдельные `it` на каждый роут.
4. **404 / fallback**: если есть catch-all `<Route path="*">` — проверка fallback'а.
5. **Outlet**: если родитель использует `<Outlet />` — рендер внутри `<Route>` с `children`.

## Антипаттерны

- НЕ оборачивать в `BrowserRouter` в тестах. Только `MemoryRouter` с `initialEntries`.
- НЕ ходить в `window.location` напрямую — пользуйся router-API.
- НЕ забывать `jest.requireActual('react-router-dom')` при моке: иначе сломаются `MemoryRouter`/`Routes`/`Route`.
- НЕ мокать `useNavigate` глобально. Мок объявляй в файле теста, и `mockReset()` в `beforeEach`.
- НЕ полагаться на конкретный URL после `useNavigate` без мока: если нужно проверить URL — используй
  паттерн с реальным `<Routes>` и проверяй рендер.

## Чек-лист перед сдачей

- [ ] Все рендеры обёрнуты в `MemoryRouter` (или хелпер `renderWithRouter`).
- [ ] При моке `useNavigate` — `jest.requireActual('react-router-dom')` и `mockReset` в `beforeEach`.
- [ ] Проверены все читаемые параметры URL.
- [ ] Покрыт хотя бы 1 переход (через мок navigate ИЛИ реальный `<Routes>`).
- [ ] `expect` из `@jest/globals`.
- [ ] Локально: `npm run test:only-changed`.
