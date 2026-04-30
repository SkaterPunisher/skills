import React, { useState } from 'react';

import { SidebarWrapper } from '@shared/components/common';
import { LoaderRmOc } from '@shared/components/ui';

import type { TableRowData, ValuesPaymentsFilter } from '@documents-sidebar/DocumentsSidebar.types';

import { DocumentsTable, Filters } from './components';
import { initialValues } from './config/payments-sidebar.config';
import { getValidationSchema } from './config/validation-schema';
import { useCalendarMOEXShift } from './hooks/useCalendarMOEXShift';
import { useConfoByParamsAndTradeByParams } from './hooks/useConfoByParamsAndTradeByParams';
import { useConfoByParamsAndTransfersForNettings } from './hooks/useConfoByParamsAndTransfersForNettings';

/**
 * Сайдбар документов — обёртка над SidebarWrapper с фильтрами и таблицей документов
 */
export const DocumentsSidebar: React.FC = () => {
  const [submitParams, setSubmitParams] = useState<ValuesPaymentsFilter | null>(null);
  const [selectedDocumentsMap, setSelectedDocumentsMap] = useState<Record<string, TableRowData>>({});

  const [formKey, setFormKey] = useState(0);
  const { documentType, сonfoSubtype } = submitParams ?? {};
  const documentTypeKey = documentType?.map(type => type.meta).join(',');
  const сonfoSubtypeKey = сonfoSubtype?.map(type => type.meta).join(',');

  // Подгружаем календарь со сдвигом и используем валидацию диапазона дат подачи документов
  const { data: calendarData, isError: isErrorCalendar, isFetching: isLoadingCalendarData } = useCalendarMOEXShift(2);

  // Состояние пагинации таблицы
  const [pagination, setPagination] = useState({ index: 0, size: 100 });

  // Запросы данных для таблицы платежей и для confo
  const {
    count,
    isError: isErrorPayments,
    isFetching,
    isIdle,
    refetch,
    tableData: tableDataSettlement,
  } = useConfoByParamsAndTransfersForNettings(pagination.size, pagination.index * pagination.size, submitParams);

  const {
    count: countConfo,
    isError: isErrorConfo,
    isFetching: isFetchingConfo,
    isIdle: isisIdleConfo,
    refetch: refetchConfo,
    tableData: tableDataConfo,
  } = useConfoByParamsAndTradeByParams(pagination.size, pagination.index * pagination.size, submitParams);

  const isError = isErrorPayments || isErrorConfo || isErrorCalendar;

  // Рендер таблицы только если выполнены условия
  const table =
    isIdle || isisIdleConfo || isError ? (
      <DocumentsTable
        isLoading={isFetching || isFetchingConfo}
        handlerPageIndexChange={index => setPagination(prev => ({ ...prev, index }))}
        handlerPageSizeChange={size => setPagination(prev => ({ ...prev, size }))}
        pageSize={pagination.size}
        pageIndex={pagination.index}
        count={count}
        countConfo={countConfo}
        refetch={() => {
          refetch();
          refetchConfo();
        }}
        isError={isError}
        tableDataConfo={tableDataConfo}
        tableDataSettlement={tableDataSettlement}
        documentType={documentType}
        сonfoSubtype={сonfoSubtype}
        key={`${documentTypeKey}-${сonfoSubtypeKey}`}
        selectedDocumentsMap={selectedDocumentsMap}
        setSelectedDocumentsMap={setSelectedDocumentsMap}
      />
    ) : null;

  // Получаем схему валидации
  const validationSchema = getValidationSchema(calendarData);

  // Показать лоадер пока подгружается календарь
  if (isLoadingCalendarData) {
    return <LoaderRmOc />;
  }

  return (
    <SidebarWrapper<ValuesPaymentsFilter>
      title={'Документы'}
      description={'Чтобы начать поиск, заполните обязательные поля: Время документа и Тип документа'}
      initialValues={initialValues}
      setSubmitParams={params => {
        setSubmitParams(params);
        setSelectedDocumentsMap({});
      }}
      filters={<Filters calendarData={calendarData} isFetching={isFetching} />}
      validationSchema={validationSchema}
      table={table}
      isFetching={isFetching || isFetchingConfo}
      key={formKey}
      onReset={() => {
        setFormKey(value => value + 1);
      }}
    />
  );
};
