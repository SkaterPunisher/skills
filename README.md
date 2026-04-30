# Тестовые скиллы

Набор скиллов для qwen_code_cli, фиксирующих формат и порядок написания тестов в проекте.

Стек, на который рассчитаны скиллы: React 17, TypeScript 5, Jest 29, `@testing-library/react@12`, `@testing-library/user-event@14`, `@testing-library/react-hooks@8`, `@tanstack/react-query@4`, `swr@2`, `formik@2`, `yup@1`, `zod@3`, `zustand@4`, `react-router-dom@6.2`, `axios@0.26` + `axios-mock-adapter@1`.

Каждый скилл лежит отдельной папкой `<name>/SKILL.md` с YAML-фронтматтером (`name`, `description`). qwen подбирает скилл автоматически, сопоставляя содержимое поля `description` с задачей: типом редактируемого файла, именами импортов или формулировкой запроса.

## Состав

Скиллы делятся на два класса.

**Формат теста по типу файла** — описывают как писать тест:

| Скилл                      | Когда применяется                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `tests-utils`              | Чистые функции в `utils`, `helpers`, `lib`, `functions`                                             |
| `tests-components`         | UI-компонент без сложных внешних зависимостей (поле формы, мелкий UI)                               |
| `tests-components-mocked`  | Контейнер или страница, использует кастомные хуки данных и тяжёлые обёртки, которые нужно мокать    |
| `tests-hooks-generic`      | Кастомные хуки без сети и без стора (`useToggle`, `useDebouncedValue`, `useOnClickOutside` и т. п.) |
| `tests-queries`            | Хуки-запросы на `@tanstack/react-query` или `swr` поверх `axios`                                    |
| `tests-store`              | Zustand-сторы                                                                                       |
| `tests-validation-schemas` | Схемы валидации `yup` или `zod` (без UI)                                                            |
| `tests-formik-form`        | Форма Formik целиком: submit-flow, ошибки полей, reset, disable                                     |
| `tests-routes`             | Компоненты с `react-router-dom@6` (`useParams`, `useNavigate`, `useSearchParams`, `<Link>`)         |

**Воркфлоу проверки и починки** — описывают порядок действий, а не формат:

| Скилл           | Когда применяется                                                                     |
| --------------- | ------------------------------------------------------------------------------------- |
| `tests-recheck` | Запрос вида «проверь / перепроверь / прогон / актуализируй / почини тесты у `<name>`» |

### Как выбрать формат-скилл по файлу

- Файл — обычная функция без React → `tests-utils`.
- Файл — `useX.ts` без сети и без стора → `tests-hooks-generic`.
- Файл — `useX.ts` с `useQuery`/`useMutation`/`useSWR` → `tests-queries`.
- Файл — zustand-стор (`create` из `zustand`) → `tests-store`.
- Файл — yup или zod схема → `tests-validation-schemas`.
- Файл — `<Component>.tsx`, простой UI без кастомных хуков → `tests-components`.
- Файл — контейнер, дёргает кастомные хуки и обёртки → `tests-components-mocked`.
- Файл — целиком форма Formik (есть submit) → `tests-formik-form`.
- Файл — страница/компонент, читает URL или навигирует → `tests-routes` (часто комбинируется с `tests-components-mocked`).

Скиллы композируемы: на странице с роутингом и хуками данных одновременно применяются `tests-components-mocked`, `tests-routes` и `frontend-rules` — это норма.

## Установка

Скопировать папки скиллов в директорию скиллов qwen — глобальную (`~/.qwen/skills/`) или проектную (`<repo>/.qwen/skills/`):

```
.qwen/skills/
  tests-utils/SKILL.md
  tests-components/SKILL.md
  tests-components-mocked/SKILL.md
  tests-hooks-generic/SKILL.md
  tests-queries/SKILL.md
  tests-store/SKILL.md
  tests-validation-schemas/SKILL.md
  tests-formik-form/SKILL.md
  tests-routes/SKILL.md
  tests-recheck/SKILL.md
```

Никакой конфигурации после копирования не требуется — qwen подхватывает скиллы автоматически по `description` во фронтматтере.

## Как запускать тесты

Команды из `package.json`:

```bash
npm run test                # полный прогон с проверкой покрытия
npm run test:only-changed   # только то, что менялось — для быстрой обратной связи
npm run test:watch          # активная разработка, без coverage
```

Запуск тестов конкретного файла или функции по имени:

```bash
npx jest --testPathPattern=<name>
```

`<name>` — имя файла, функции или компонента (без расширения, без пути). Jest найдёт любой тест-файл, чей путь содержит подстроку.

Полезные флаги при отладке:

```bash
npx jest --testPathPattern=<name> --runInBand              # последовательный прогон, читаемый вывод
npx jest --testPathPattern=<name> -t "<имя it/describe>"   # запуск одного it/describe
npx jest --testPathPattern=<name> --watch                  # перезапуск при сохранении
npx jest --testPathPattern=<name> --coverage=false         # быстрее, без отчёта покрытия
```

## Использование

**Написание тестов с нуля.** Достаточно сформулировать задачу в терминах файла или функции:

> «Напиши тесты для `mappedTransfersToTableData`».

qwen определит тип файла по импортам и подгрузит соответствующий скилл-формат.

**Проверка и починка существующих тестов.** Триггерные фразы для `tests-recheck`:

> «Проверь тесты у `mappedTransfersToTableData`».
> «Перепроверь тесты `DocumentsSidebar`».
> «Почини тесты у `useCalendarMOEXShift`».

Скилл сам выполнит `npx jest --testPathPattern=<name>`, разберёт падения и подтянет нужный формат-скилл по типу файла. При неоднозначности (поведение поменялось намеренно или это баг) скилл явно спросит, что чинить — тест или исходник, чтобы не угадывать молча.

## Связь с другими скиллами

Тестовые скиллы дополняют, а не заменяют общие правила проекта:

- `frontend-rules` — кодстайл, импорты, именование. Применяется поверх любого тестового скилла.
- `project-architecture` — структура и слои проекта (FSD).
- `local-verification` — локальная верификация (lint, typecheck, jest).
