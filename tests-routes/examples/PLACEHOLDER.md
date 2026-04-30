# Канонические примеры — `tests-routes`

В этой папке должны лежать реальные примеры из проекта, на которые скилл будет опираться. Сейчас их нет — нужно добавить.

## Что положить

Минимум одну пару, желательно две, чтобы покрыть и чтение URL, и навигацию.

### Обязательная пара (чтение URL)

- `<Page>.tsx` — страница, которая использует `useParams` или `useSearchParams` (например, страница документа `/documents/:id`).
- `<Page>.test.tsx` — тест к ней. Должен показывать:
  - хелпер `renderWithRouter` с `MemoryRouter` + `Routes` + `Route`,
  - `initialEntries=['/documents/42']`, `path={'/documents/:id'}`,
  - проверку, что компонент корректно прочитал параметр.

### Желательно ещё (навигация)

- `<Component>.tsx` — компонент с `useNavigate` (кнопка «открыть документ», «назад», переход после submit).
- `<Component>.test.tsx` — тест с моком:
  ```ts
  jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
  });
  ```
  и проверкой `expect(mockNavigate).toHaveBeenCalledWith(...)`.

## Как сослаться из SKILL.md

Раздел `Канонические примеры` уже добавлен в `../SKILL.md` и ссылается на эту папку. Когда положишь файлы — qwen подхватит их автоматически.

## Что не нужно

- Не клади тесты страниц, которые в основном про данные и моки хуков, — они идут в `tests-components-mocked/examples/`. Здесь — только то, что про роутинг.
- Не клади E2E-тесты cypress — для них (когда добавим) будет отдельная папка.
