import { render, screen } from '@testing-library/react';

import { Form, Formik } from 'formik';

import { expect } from '@jest/globals';
import userEvent from '@testing-library/user-event';

import { CalendarField } from '../CalendarField';

describe('проверка компонента CalendarField', () => {
  // Создаём объект для имитации пользовательских действий
  const user = userEvent.setup();

  it('при вводе строки с диапазоном в поле даты в календаре отображаются соответствующие элементы', async () => {
    render(
      <Formik initialValues={{ calendar: '' }} onSubmit={jest.fn()}>
        <Form>
          <CalendarField name={'calendar'} range label={'Выберите дату операции'} />
        </Form>
      </Formik>,
    );

    // Находим поле ввода
    const input = await screen.findByTestId('field');

    // Кликаем по полю ввода
    await user.click(input);

    // Очищаем поле ввода
    await user.clear(input);

    // Вводим диапазон в поле
    await user.type(input, '01.02.2025 - 05.02.2025');

    // Иконка календаря в поле ввода
    const calendarIconWrapper = await screen.findByTestId('field-after');

    const svgIcon = calendarIconWrapper.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();

    // Клик по иконке
    if (svgIcon) await user.click(svgIcon);

    // Берём все ячейки в окне выбора дат
    const buttons = await screen.findAllByTestId('calendar-element');

    // Находим выбранные начальную и конечную ячейки диапазона
    const firstButtonsText = buttons.filter(el => el.classList.contains('selected-first'))[0].textContent;
    const secondButtonText = buttons.filter(el => el.classList.contains('selected-second'))[0].textContent;

    expect(firstButtonsText).toBe('1');
    expect(secondButtonText).toBe('5');

    // Берём текст текущего месяца в окне календаря
    const month = await screen.findByTestId('calendar-current-month');

    expect(month.textContent?.trim()).toBe('февраль');

    // Берём год
    const year = await screen.findByTestId('function-button');

    expect(year.textContent?.trim()).toBe('2025');
  });

  it('при выборе диапазона в окне календаря соответствующая строка отображается в поле ввода', async () => {
    render(
      <Formik initialValues={{ calendar: '' }} onSubmit={jest.fn()}>
        <Form>
          <CalendarField name={'calendar'} range label={'Выберите дату операции'} />
        </Form>
      </Formik>,
    );

    // Иконка календаря в поле ввода
    const calendarIconWrapper = await screen.findByTestId('field-after');

    const svgIcon = calendarIconWrapper.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();

    // Клик по иконке
    if (svgIcon) await user.click(svgIcon);

    // Находим кнопку 1 числа в окне выбора дат
    const startButtons = (await screen.findAllByTestId('calendar-element'))
      .filter(el => !el.classList.contains('next'))
      .filter(el => el.textContent === '1');

    await user.click(startButtons[0]);

    // Находим кнопку 5 числа в окне выбора дат
    const endButtons = (await screen.findAllByTestId('calendar-element'))
      .filter(el => !el.classList.contains('next'))
      .filter(el => el.textContent === '5');

    await user.click(endButtons[0]);

    // Берём поле ввода
    const input: HTMLInputElement = await screen.findByTestId('field');

    // Получаем текст из поля ввода
    const inputText = input.value;

    const splitPeriod = inputText?.split('-')?.map(el => el.trim());

    const start = splitPeriod?.[0].split('.').map(el => el.trim());
    const end = splitPeriod?.[1].split('.').map(el => el.trim());
    const startDay = start[0];
    const endDay = end[0];
    const startMonth = start[1];
    const entMonth = end[1];
    const startYear = start[2];
    const endYear = end[2];

    expect(startDay).toBe('01');
    expect(endDay).toBe('05');

    // Месяц и год должны соответствовать текущим
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = new Date().getFullYear().toString().padStart(4, '0');

    expect(currentMonth).toBe(startMonth);
    expect(currentMonth).toBe(entMonth);
    expect(currentYear).toBe(startYear);
    expect(currentYear).toBe(endYear);
  });
});
