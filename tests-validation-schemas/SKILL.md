---
name: tests-validation-schemas
description: |
  Используй этот скилл, когда нужно протестировать схему валидации на yup или zod. Триггеры: файлы из
  `**/validation/**`, `**/schemas/**`, имена `validation-schema.ts`, `getValidationSchema.ts`, `*.schema.ts`,
  импорты `import * as yup from 'yup'`, `import { z } from 'zod'`, экспорты типа `getValidationSchema(...)`,
  `<smth>Schema`. У тебя в проекте есть оба пакета (`yup@^1`, `zod@^3`). Не использовать для тестов компонентов,
  которые ПРИМЕНЯЮТ схему — там используется `tests-formik-form` / `tests-components-mocked`. Здесь тестируется
  ТОЛЬКО сама схема как чистый объект.
---

# tests-validation-schemas — формат тестов для yup/zod схем

## Канонические примеры

При наличии файлов в `./examples/` — приоритет у них над шаблонами ниже. Если папка содержит только `PLACEHOLDER.md` — примеры ещё не добавлены, в этом случае следуй только шаблонам отсюда.

## Цель

Проверить, что схема:
- пропускает валидные данные;
- отклоняет невалидные с правильным сообщением;
- учитывает зависимости полей (`when`/`refine`/`superRefine`);
- учитывает динамические параметры (если схема — функция-фабрика типа `getValidationSchema(deps)`).

## Стек

- `yup@^1` — `validate`, `validateSync`, `isValid`, `cast`.
- `zod@^3` — `parse`, `safeParse`, `parseAsync`, `safeParseAsync`.
- `@jest/globals`.

## Соглашения именования

- Файл: `<schema>.test.ts` рядом со схемой.
- `describe` — по-русски: `describe('проверка схемы <name>', ...)`.
- Внутри — два под-`describe`: `describe('успешная валидация', ...)` и `describe('ошибки валидации', ...)`.

## Шаблон для yup

```ts
import { expect } from '@jest/globals';

import { paymentsFilterSchema } from '../validation-schema';

describe('проверка схемы paymentsFilterSchema', () => {
  describe('успешная валидация', () => {
    it('принимает корректные значения', async () => {
      const data = {
        documentType: [{ meta: 'TYPE_A' }],
        period: '01.07.2025 - 31.07.2025',
      };
      await expect(paymentsFilterSchema.validate(data)).resolves.toEqual(expect.objectContaining(data));
    });

    it('isValid возвращает true для валидных данных', async () => {
      const data = { documentType: [{ meta: 'TYPE_A' }], period: '01.07.2025 - 31.07.2025' };
      await expect(paymentsFilterSchema.isValid(data)).resolves.toBe(true);
    });
  });

  describe('ошибки валидации', () => {
    it('кидает ошибку, если documentType пустой', async () => {
      const data = { documentType: [], period: '01.07.2025 - 31.07.2025' };
      await expect(paymentsFilterSchema.validate(data)).rejects.toThrow('Выберите тип документа');
    });

    it('собирает все ошибки при abortEarly=false', async () => {
      const data = { documentType: [], period: 'мусор' };
      try {
        await paymentsFilterSchema.validate(data, { abortEarly: false });
        throw new Error('Должна была упасть валидация');
      } catch (e: any) {
        expect(e.errors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Выберите тип документа'),
            expect.stringContaining('Некорректный период'),
          ]),
        );
      }
    });

    it('сообщает об ошибке, если period вне разрешённого диапазона MOEX', async () => {
      const data = { documentType: [{ meta: 'TYPE_A' }], period: '01.01.2099 - 02.01.2099' };
      await expect(paymentsFilterSchema.validate(data)).rejects.toThrow(/диапазона/);
    });
  });
});
```

### Если схема — фабрика (зависит от внешних данных)

```ts
import { expect } from '@jest/globals';
import { getValidationSchema } from '../validation-schema';

describe('проверка схемы getValidationSchema', () => {
  const calendarData = { nextDay: new Date('2025-07-31'), pastDay: new Date('2025-07-01') };

  it('пропускает дату внутри диапазона calendarData', async () => {
    const schema = getValidationSchema(calendarData);
    await expect(schema.validate({ period: '15.07.2025 - 20.07.2025', documentType: [{ meta: 'A' }] })).resolves.toBeTruthy();
  });

  it('отклоняет дату вне диапазона calendarData', async () => {
    const schema = getValidationSchema(calendarData);
    await expect(schema.validate({ period: '01.06.2025 - 15.06.2025', documentType: [{ meta: 'A' }] })).rejects.toThrow();
  });
});
```

## Шаблон для zod

```ts
import { expect } from '@jest/globals';
import { z } from 'zod';

import { userSchema } from '../user.schema';

describe('проверка схемы userSchema', () => {
  describe('успешная валидация', () => {
    it('parse возвращает данные при корректном вводе', () => {
      const data = { id: '1', email: 'a@a.ru', age: 18 };
      expect(userSchema.parse(data)).toEqual(data);
    });

    it('safeParse возвращает success: true', () => {
      const result = userSchema.safeParse({ id: '1', email: 'a@a.ru', age: 18 });
      expect(result.success).toBe(true);
    });
  });

  describe('ошибки валидации', () => {
    it('safeParse возвращает success: false при невалидном email', () => {
      const result = userSchema.safeParse({ id: '1', email: 'not-an-email', age: 18 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['email'], code: 'invalid_string' }),
          ]),
        );
      }
    });

    it('parse кидает ZodError при отсутствии обязательного поля', () => {
      expect(() => userSchema.parse({ email: 'a@a.ru' })).toThrow(z.ZodError);
    });
  });
});
```

## Что обязательно покрывать

1. **Happy path** — каждый набор валидных входных данных, который встречается в реальной форме.
2. **Каждое поле в отдельном `it`**: что валидно и что невалидно (длина, формат, тип).
3. **Кросс-полевые правила** (`when`/`refine`/`superRefine`): минимум 2 кейса (срабатывает / не срабатывает).
4. **Сообщения об ошибках** — проверять текст через `toThrow(/regex/)` (yup) или `path`+`code` в issues (zod).
5. **Опции схемы**: для yup — `abortEarly: false`, чтобы убедиться, что собираются все ошибки.
6. **Динамические параметры** для фабрик `getSchema(deps)`.

## Антипаттерны

- НЕ рендерить React. Схема — это чистый объект.
- НЕ полагаться на дефолтное поведение `validate` с `abortEarly: true` для проверки нескольких ошибок —
  оно вернёт только первую.
- НЕ дублировать тест поля во всех схемах — если поле проверяется одной и той же re-usable схемой,
  тестируй её саму отдельно.
- НЕ забывать про `await` для асинхронных yup-методов (`validate`, `isValid`).

## Чек-лист перед сдачей

- [ ] Покрыт happy path и хотя бы одна ошибка на каждое поле.
- [ ] Если есть кросс-полевые правила — отдельный блок тестов.
- [ ] Для yup — есть тест с `abortEarly: false`.
- [ ] Для zod — проверены `path` и `code` в `issues` для ошибок.
- [ ] Сообщения об ошибках совпадают с тем, что видит пользователь в UI.
- [ ] `expect` из `@jest/globals`.
- [ ] Локально: `npm run test:only-changed`.
