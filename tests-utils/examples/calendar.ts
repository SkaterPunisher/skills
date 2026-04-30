import { ICalendar } from '@sber-space-ui/react';

import { format, isValid, parse, parseISO, startOfSecond } from 'date-fns';

/** Конвертирует строку с датой в формате dd.MM.yyyy в миллисекунды */
export const getMsFromStringDate = (stringDate: string) => {
  // Проверка формата переданной строки
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(stringDate)) return null;

  const dateObj = parse(stringDate, 'dd.MM.yyyy', new Date());

  // Проверка, что распарсенная дата является корректной
  if (!isValid(dateObj)) return null;

  const milliseconds = startOfSecond(dateObj).getTime();

  return milliseconds;
};

/** Проверяет строку на соответствие формату dd.mm.yyyy и тот ли это день после парсинга в Date */
export const isValidStringDate = (dateString: string) => {
  if (dateString === undefined) return false;

  // Проверка формата переданной строки
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) return false;

  const parsedDate = parse(dateString, 'dd.MM.yyyy', new Date());

  return isValid(parsedDate) && dateString === format(parsedDate, 'dd.MM.yyyy');
};

/** Проверяет валидность периода переданного в строке */
export const isValidPeriod = (period: string | undefined) => {
  if (!period) return false;

  const [startDate, endDate] = period.split(' - ');
  const start = parse(startDate, 'dd.MM.yyyy', new Date());
  const end = endDate ? parse(endDate, 'dd.MM.yyyy', new Date()) : 0;

  return isValidStringDate(startDate) && isValidStringDate(endDate) && start <= end;
};

/** Преобразует строку вида 'dd.mm.yyyy' в объект Date */
export const getDateFromString = (dateString: string) => {
  const [day, month, year] = dateString.split('.').map(Number);

  if (
    !year ||
    !month ||
    !day ||
    !/^\d{4}$/.test(year?.toString()) ||
    Number.isNaN(year) ||
    !/^\d{1,2}$/.test(month?.toString()) ||
    month > 12 ||
    Number.isNaN(year) ||
    !/^\d{1,2}$/.test(day?.toString()) ||
    day > 31 ||
    Number.isNaN(year)
  )
    return new Date();

  const validYear = year;
  const validMonth = month - 1;
  const validDay = day;

  return new Date(validYear, validMonth, validDay);
};

/** Конвертирует строку с периодом в формате dd.MM.yyyy - dd.MM.yyyy в массив из двух дат */
export const getPeriodFromString = (dateString: string | undefined): [Date | null, Date | null] => {
  if (dateString === undefined) return [null, null];

  const [start, end] = dateString.split('-');

  const trimmedStart = start?.trim();
  const trimmedEnd = end?.trim();

  if (!isValidStringDate(trimmedStart) && !isValidStringDate(trimmedEnd)) {
    return [null, null];
  }

  if (!isValidStringDate(trimmedStart)) {
    return [null, getDateFromString(trimmedEnd)];
  }

  if (!isValidStringDate(trimmedEnd)) {
    return [getDateFromString(start), null];
  }

  if (dateString.length < 10) return [null, null];

  return [getDateFromString(trimmedStart), getDateFromString(trimmedEnd)];
};

/** Преобразует дату в строку в формате dd.mm.yyyy */
export const getStringFromDate = (date: Date | null) => {
  if (!date) return '';

  if (!isValid(date)) return '';

  return format(date, 'dd.MM.yyyy');
};

/** Преобразует период в формате [Date, Date] в строку формата dd.mm.yyyy - dd.mm.yyyy */
export const getStringFromPeriod = (dates: ICalendar['value'], placeholder?: string): string => {
  const [start, end] = dates;

  if (!end) {
    return start ? `${getStringFromDate(start)}${placeholder ?? ''}` : '';
  }

  return `${getStringFromDate(start)} - ${getStringFromDate(end)}`;
};

/** Преобразует строку в формате dd.mm.yyyy в формат ISO 8601 */
export const getISO8601FromDateString = (stringDate: string | undefined): string => {
  if (stringDate === undefined) return '';

  if (!isValidStringDate(stringDate)) return '';

  const parsed = parse(stringDate, 'dd.MM.yyyy', new Date());
  if (!isValid(parsed)) return '';

  return format(parsed, "yyyy-MM-dd'T'HH:mm:ss");
};

/** Разделяет строку периода в формате dd.MM.yyyy - dd.MM.yyyy и возвращает массив из двух строк в формате ISO 8601 */
export const splitPeriod = (stringPeriod: string): [string, string] => {
  if (!stringPeriod.length) return ['', ''];

  const [start, end] = stringPeriod.split(' - ');

  const formatedStart = isValidStringDate(start.trim()) ? getISO8601FromDateString(start?.trim()) : '';
  const formatedEnd = isValidStringDate(end.trim()) ? getISO8601FromDateString(end?.trim()) : '';

  return [formatedStart, formatedEnd];
};

/** Принимает строку в формате ISO 8601 и возвращает строку в формате dd.mm.yyyy */
export const convertISOToDDMMYYYY = (isoDate: string | undefined | null) => {
  if (isoDate === undefined || isoDate === null) return '';

  const date = parseISO(isoDate);

  if (!isValid(date)) return '';

  return format(date, 'dd.MM.yyyy');
};
