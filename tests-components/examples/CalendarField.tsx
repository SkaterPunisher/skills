import { BasicCalendar } from './BasicCalendar/BasicCalendar';
import { IFormCalendarFieldProps } from './CalendarField.types';
import { FormikCalendar } from './FormikCalendar/FormikCalendar';

export const CalendarField = ({
  ...restFieldProps
}: Omit<IFormCalendarFieldProps, 'touched' | 'error' | 'setTouched'>) => {
  const { name } = restFieldProps;

  return name ? <FormikCalendar {...restFieldProps} /> : <BasicCalendar {...restFieldProps} />;
};
