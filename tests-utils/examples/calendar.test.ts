import { expect } from '@jest/globals';
import { TCalendarValue } from '@sber-space-ui/calendar';
import {
  convertISOToDDMMYYYY,
  getDateFromString,
  getISO8601FromDateString,
  getMsFromStringDate,
  getPeriodFromString,
  getStringFromDate,
  getStringFromPeriod,
  isValidPeriod,
  isValidStringDate,
  splitPeriod,
} from '@shared/utils/functions/calendar';

describe('проверка функции convertISOToDDMMYYYY', () => {
  it('возвращает строку в формате dd.mm.yyyy при передаче даты в формате ISO 8601', () => {
    const date = '2022-07-15T00:00:00';
    const result = convertISOToDDMMYYYY(date);
    expect(result).toBe('15.07.2022');
  });

  it('возвращает пустую строку при передаче undefined', () => {
    const date = undefined;
    const result = convertISOToDDMMYYYY(date);
    expect(result).toBe('');
  });

  it('возвращает пустую строку при передаче null', () => {
    const date = null;
    const result = convertISOToDDMMYYYY(date);
    expect(result).toBe('');
  });

  it('возвращает пустую строку при передаче некорректного формата даты', () => {
    const date = '20223-07-15';
    const result = convertISOToDDMMYYYY(date);
    expect(result).toBe('');
  });

  it('возвращает пустую строку при передаче некорректного формата даты 2', () => {
    const date = 'abc';
    const result = convertISOToDDMMYYYY(date);
    expect(result).toBe('');
  });
});

describe('проверка функции getDateFromString', () => {
  it('возвращает дату в формате Date', () => {
    const date = '15.07.2022';
    const result = getDateFromString(date);
    expect(result).toEqual(new Date(2022, 6, 15));
  });

  it('если функция получает мусор вместо даты, возвращает текущую дату', () => {
    const date = '2025.05.30';
    const result = getDateFromString(date);

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

    const formattedDate = result.toLocaleDateString('ru-RU', options);

    expect(formattedDate).toEqual(new Date().toLocaleDateString('ru-RU', options));

    const date2 = 'некорректно';
    const result2 = getDateFromString(date2);

    const formattedDate2 = result2.toLocaleDateString('ru-RU', options);

    expect(formattedDate2).toEqual(new Date().toLocaleDateString('ru-RU', options));
  });
});

describe('проверка функции getISO8601FromDateString', () => {
  it('возвращает строку в формате ISO8601 при передаче строки корректного формата даты', () => {
    const date = '15.07.2022';
    const result = getISO8601FromDateString(date);
    expect(result).toBe('2022-07-15T00:00:00');
  });

  it('возвращает пустую строку при передаче некорректного формата даты 1', () => {
    const date = '15.07.20222';
    const result = getISO8601FromDateString(date);
    expect(result).toBe('');
  });

  it('возвращает пустую строку при передаче некорректного формата даты 2', () => {
    const date = 'abc';
    const result = getISO8601FromDateString(date);
    expect(result).toBe('');
  });

  it('возвращает пустую строку при передаче undefined', () => {
    const date = undefined;
    const result = getISO8601FromDateString(date);
    expect(result).toBe('');
  });
});

describe('проверка функции getMsFromStringDate', () => {
  it('возвращает миллисекунды при передаче строки корректного формата даты', () => {
    const date = '15.07.2022';
    const result = getMsFromStringDate(date);
    expect(result).toEqual(new Date(2022, 6, 15).getTime());
  });

  it('возвращает null при передаче некорректного формата даты 1', () => {
    const date = '15.07.20222';
    const result = getMsFromStringDate(date);
    expect(result).toBeNull();
  });

  it('возвращает null при передаче некорректного формата даты 2', () => {
    const date = 'abc';
    const result = getMsFromStringDate(date);
    expect(result).toBeNull();
  });

  it('возвращает null при передаче некорректного формата даты 3', () => {
    const date = '15.13.2022';
    const result = getMsFromStringDate(date);
    expect(result).toBeNull();
  });
});

describe('проверка функции getPeriodFromString', () => {
  it('возвращает период в формате [Date, Date]', () => {
    const period = '15.07.2022 - 20.07.2022';
    const result = getPeriodFromString(period);
    expect(result).toEqual([new Date(2022, 6, 15), new Date(2022, 6, 20)]);
  });

  it('возвращает [Date, null], если конечная дата невалидна', () => {
    const period = '15.07.2022 - 20.07.20222';
    const result = getPeriodFromString(period);
    expect(result).toEqual([new Date(2022, 6, 15), null]);
  });

  it('возвращает [null, null], если строка не содержит ни одной валидной даты', () => {
    const period = 'abc';
    const result = getPeriodFromString(period);
    expect(result).toEqual([null, null]);
  });

  it('возвращает [null, Date], если начальная дата невалидна', () => {
    const period = '15.07.20222 - 20.07.2022';
    const result = getPeriodFromString(period);
    expect(result).toEqual([null, new Date(2022, 6, 20)]);
  });

  it('возвращает [null, null], если обе даты невалидны', () => {
    const period = '15.07.20222 - 20.07.20222';
    const result = getPeriodFromString(period);
    expect(result).toEqual([null, null]);
  });

  it('возвращает [null, Date], если начальная дата некорректной длины', () => {
    const period = '1.07.2022 - 20.07.2022';
    const result = getPeriodFromString(period);
    expect(result).toEqual([null, new Date(2022, 6, 20)]);
  });

  it('возвращает [Date, null], если конечная дата некорректной длины', () => {
    const period = '15.07.2022 - 2.07.20222';
    const result = getPeriodFromString(period);
    expect(result).toEqual([new Date(2022, 6, 15), null]);
  });
});

describe('проверка функции getStringFromDate', () => {
  it('возвращает строку в формате dd.mm.yyyy', () => {
    const date = new Date(2022, 6, 15);
    const result = getStringFromDate(date);
    expect(result).toBe('15.07.2022');
  });

  it('возвращает пустую строку, если передано пустое значение', () => {
    const date = null;
    const result = getStringFromDate(date);
    expect(result).toBe('');
  });
});

describe('проверка функции getStringFromPeriod', () => {
  it('возвращает строку в формате dd.mm.yyyy - dd.mm.yyyy', () => {
    const period: TCalendarValue = [new Date(2025, 6, 15), new Date(2025, 6, 20)];
    const result = getStringFromPeriod(period);
    expect(result).toBe('15.07.2025 - 20.07.2025');
  });

  it('возвращает пустую строку, если период целиком пустой', () => {
    const period: TCalendarValue = [null, null];
    const result = getStringFromPeriod(period);
    expect(result).toBe('');
  });

  it('возвращает строку с тире и конечной датой, если начальная дата отсутствует', () => {
    const period: TCalendarValue = [null, new Date(2025, 6, 20)];
    const result = getStringFromPeriod(period);
    expect(result).toBe(' - 20.07.2025');
  });

  it('возвращает только начальную дату, если конечная дата отсутствует', () => {
    const period: TCalendarValue = [new Date(2025, 6, 15), null];
    const result = getStringFromPeriod(period);
    expect(result).toBe('15.07.2025');
  });
});

describe('проверка функции isValidPeriod', () => {
  it('возвращает true при передаче строки корректного периода', () => {
    const period = '15.07.2022 - 20.07.2022';
    const result = isValidPeriod(period);
    expect(result).toBe(true);
  });

  it('возвращает false при передаче некорректного формата периода 1', () => {
    const period = '15.07.2022 - 20.07.20222';
    const result = isValidPeriod(period);
    expect(result).toBe(false);
  });

  it('возвращает false при передаче некорректного формата периода 2', () => {
    const period = 'abc';
    const result = isValidPeriod(period);
    expect(result).toBe(false);
  });
});

describe('проверка функции isValidStringDate', () => {
  it('возвращает true при передаче строки корректного формата даты', () => {
    const date = '15.07.2022';
    const result = isValidStringDate(date);
    expect(result).toBe(true);
  });

  it('возвращает false при передаче некорректного формата даты 1', () => {
    const date = '15.07.20222';
    const result = isValidStringDate(date);
    expect(result).toBe(false);
  });

  it('возвращает false при передаче некорректного формата даты 2', () => {
    const date = 'abc';
    const result = isValidStringDate(date);
    expect(result).toBe(false);
  });
});

describe('проверка функции splitPeriod', () => {
  it('возвращает массив из двух дат в формате ISO 8601 при передаче строки в формате dd.mm.yyyy - dd.mm.yyyy', () => {
    const period = '15.07.2022 - 20.07.2022';
    const result = splitPeriod(period);
    expect(result).toEqual(['2022-07-15T00:00:00', '2022-07-20T00:00:00']);
  });

  it('возвращает массив из двух пустых строк при передаче пустой строки', () => {
    const period = '';
    const result = splitPeriod(period);
    expect(result).toEqual(['', '']);
  });

  it('возвращает первую пустую строку при невалидной начальной дате', () => {
    const period = 'abc - 20.07.2022';
    const result = splitPeriod(period);
    expect(result).toEqual(['', '2022-07-20T00:00:00']);
  });

  it('возвращает вторую пустую строку при невалидной конечной дате', () => {
    const period = '15.07.2022 - abc';
    const result = splitPeriod(period);
    expect(result).toEqual(['2022-07-15T00:00:00', '']);
  });
});
