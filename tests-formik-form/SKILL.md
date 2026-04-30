---
name: tests-formik-form
description: |
  Используй этот скилл, когда нужно протестировать ЦЕЛЬНУЮ форму на Formik (а не отдельное поле). То есть:
  submit-flow, ошибки полей при невалидных данных, поведение при reset, передача `validationSchema`,
  взаимодействие нескольких полей, дизейбл submit-кнопки. Триггеры: компонент использует `<Formik>` напрямую
  (не как обёртку для одного поля), имеет `onSubmit`, экспортирует форму или контейнер формы. Для тестов
  одного отдельного поля внутри Formik используй `tests-components`. Для тестов схемы валидации без UI —
  `tests-validation-schemas`.
---

# tests-formik-form — формат тестов для целиком форм Formik

## Канонические примеры

При наличии файлов в `./examples/` — приоритет у них над шаблонами ниже. Если папка содержит только `PLACEHOLDER.md` — примеры ещё не добавлены, в этом случае следуй только шаблонам отсюда.

## Цель

Проверить пользовательский сценарий с формой:
- ввести валидные данные → submit вызвался с правильным payload;
- ввести невалидные → отображается ошибка под полем, submit НЕ вызвался;
- reset очищает форму до initialValues;
- сабмит-кнопка дизейблится в правильных состояниях.

## Стек

- `formik@^2`
- `yup@^1` или `zod@^3` (через адаптер) — `validationSchema`
- `@testing-library/react@^12`
- `@testing-library/user-event@^14`
- `@testing-library/jest-dom`
- `@jest/globals`

## Соглашения именования

- Файл: `<FormName>.test.tsx`.
- `describe` — по-русски: `describe('проверка формы <FormName>', ...)`.
- `it` — описывает сценарий: «вызывает onSubmit с валидными данными», «показывает ошибку под полем при пустом X».

## Скелет

```tsx
import { render, screen, waitFor } from '@testing-library/react';

import { expect } from '@jest/globals';
import userEvent from '@testing-library/user-event';

import { PaymentsFilterForm } from '../PaymentsFilterForm';

describe('проверка формы PaymentsFilterForm', () => {
  const user = userEvent.setup();

  it('вызывает onSubmit с введёнными значениями при валидной форме', async () => {
    const handleSubmit = jest.fn();

    render(<PaymentsFilterForm initialValues={{ name: '', amount: '' }} onSubmit={handleSubmit} />);

    await user.type(screen.getByTestId('field-name'), 'Иван');
    await user.type(screen.getByTestId('field-amount'), '100');

    await user.click(screen.getByRole('button', { name: /применить/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Иван', amount: '100' }),
      expect.anything(), // FormikHelpers
    );
  });

  it('показывает ошибку под полем name при попытке submit без значения', async () => {
    const handleSubmit = jest.fn();

    render(<PaymentsFilterForm initialValues={{ name: '', amount: '' }} onSubmit={handleSubmit} />);

    await user.click(screen.getByRole('button', { name: /применить/i }));

    expect(await screen.findByText(/обязательное поле/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('по reset форма возвращается к initialValues', async () => {
    const handleSubmit = jest.fn();

    render(<PaymentsFilterForm initialValues={{ name: '', amount: '' }} onSubmit={handleSubmit} />);

    const nameField = screen.getByTestId('field-name') as HTMLInputElement;

    await user.type(nameField, 'Иван');
    expect(nameField.value).toBe('Иван');

    await user.click(screen.getByRole('button', { name: /сбросить/i }));

    expect(nameField.value).toBe('');
  });

  it('кнопка submit дизейблится, пока форма не валидна', async () => {
    render(<PaymentsFilterForm initialValues={{ name: '', amount: '' }} onSubmit={jest.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /применить/i });

    expect(submitBtn).toBeDisabled();

    await user.type(screen.getByTestId('field-name'), 'Иван');
    await user.type(screen.getByTestId('field-amount'), '100');

    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });
});
```

## Что обязательно покрывать

1. **Happy submit** — вводим валидные данные, кликаем submit, проверяем что `onSubmit` вызван с правильным payload.
2. **Невалидный submit** — для каждого обязательного/валидируемого поля: ошибка отображается, `onSubmit` НЕ вызван.
3. **Reset** — если кнопка ресета есть, проверяем что форма возвращается к `initialValues`.
4. **Дизейбл submit** — если есть `disabled={!isValid || !dirty}` или подобное.
5. **Кросс-полевые правила** — если в схеме есть зависимости (диапазон дат, «end > start»), тест на оба исхода.
6. **Динамика по `enableReinitialize`** — если форма перерисовывается при смене `initialValues`, отдельный кейс.

## Тонкости и грабли

- Formik асинхронен: после `submit` всегда `await waitFor(...)`, прежде чем проверять моки.
- `user.click` по submit-кнопке инициирует валидацию, но ошибки появляются в следующем тике —
  используй `findByText` (асинхронный), не `getByText`.
- Для `enableReinitialize` форма перерисуется при изменении пропсов — оборачивай `render` с обновлением пропсов,
  либо тестируй в рамках полноценного контейнера.
- Если форма обёрнута во внешние провайдеры (router, query) — добавь обёртку рендера, как в
  `tests-components-mocked` (`renderWithQuery` или аналог).

## Антипаттерны

- НЕ дёргать `formik`-API через `formikRef.current.setFieldValue(...)` для имитации ввода.
  Тест должен повторять действия пользователя через `userEvent`.
- НЕ мокать `Formik`. Если что-то мешает — мокается дочерняя вёрстка (как в `tests-components-mocked`),
  но не сам Formik.
- НЕ проверять, что вызывается внутренний `setFieldError` — проверяй то, что видит пользователь
  (текст ошибки в DOM).
- НЕ забывать про `await` перед `user.click`/`user.type` — иначе ввод не сработает.

## Чек-лист перед сдачей

- [ ] Покрыт хотя бы 1 happy submit.
- [ ] Покрыта хотя бы 1 ошибка валидации.
- [ ] Если есть reset — есть тест на reset.
- [ ] Если есть дизейбл submit — есть тест на оба состояния.
- [ ] `userEvent.setup()` на верхнем уровне.
- [ ] `await waitFor(...)` для async-ассертов.
- [ ] `expect` из `@jest/globals`.
- [ ] Локально: `npm run test:only-changed`.
