# Канонические примеры — `tests-queries`

В этой папке должны лежать реальные примеры из проекта, на которые скилл будет опираться. Сейчас их нет — нужно добавить.

## Что положить

Минимум одну пару «хук-запрос + тест к нему». В идеале — три разных хука, чтобы покрыть основные сценарии.

### Обязательная пара (любой `useQuery`-хук)

- `useSomeData.ts` — кастомный хук на `@tanstack/react-query` v4, который дёргает GET-эндпоинт через общий `axiosInstance`. Лучше всего — хук, у которого есть маппинг ответа в удобную форму (например, `tableData`, `count`).
- `useSomeData.test.ts` — тест к нему. Должен показывать:
  - создание `MockAdapter(axiosInstance)` в `beforeEach`,
  - `mock.reset()` + `mock.restore()` в `afterEach`,
  - свежий `QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } })` на каждый `renderHook`,
  - `renderHook` из `@testing-library/react-hooks`,
  - покрытие success / error / idle (если есть `enabled`).

### Желательно ещё

- **`useMutation`-хук** + тест — пример с `mutate(...)`, проверкой success-колбэка и инвалидации (`queryClient.invalidateQueries`).
- **`useSWR`-хук** + тест — обёртка `<SWRConfig provider={() => new Map()} dedupingInterval={0}>`, та же логика с `axios-mock-adapter`.

## Как сослаться из SKILL.md

Раздел `Канонические примеры` уже добавлен в `../SKILL.md` и ссылается на эту папку. Когда положишь файлы — qwen подхватит их автоматически.

## Что не нужно

- Не клади тесты компонентов, которые ПОТРЕБЛЯЮТ хук — они тестируются как `tests-components-mocked` (хук мокается через `jest.mock`).
- Не клади тесты самого `axios`-инстанса (interceptors, base URL) — это отдельная история.
