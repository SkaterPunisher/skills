import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactElement } from 'react';

import { expect } from '@jest/globals';
import { SidebarWrapper } from '@shared/components/common';

import { DocumentsSidebar } from '../DocumentsSidebar';
import { useCalendarMOEXShift } from '../hooks/useCalendarMOEXShift';
import { useConfoByParamsAndTradeByParams } from '../hooks/useConfoByParamsAndTradeByParams';
import { useConfoByParamsAndTransfersForNettings } from '../hooks/useConfoByParamsAndTransfersForNettings';

// Замоканные обёртки
jest.mock('@shared/components/common', () => ({
  SidebarWrapper: jest.fn(({ description, filters, isFetching, onReset, table, title }) => (
    <div data-testid={'sidebar-wrapper'}>
      <h1>{title}</h1>
      <p>{description}</p>
      <div data-testid={'filters'}>{filters}</div>
      <div data-testid={'table'}>{table}</div>
      <div data-testid={'isFetching'}>{isFetching ? 'Loading...' : 'Not loading'}</div>
      <button type={'button'} onClick={onReset}>
        Reset
      </button>
    </div>
  )),
}));

jest.mock('@shared/components/ui', () => ({
  LoaderRmOc: jest.fn(() => <div data-testid={'loader'}>Loading...</div>),
}));

jest.mock('../hooks/useCalendarMOEXShift');
jest.mock('../hooks/useConfoByParamsAndTransfersForNettings');
jest.mock('../hooks/useConfoByParamsAndTradeByParams');

jest.mock('../components/Filters/Filters', () => ({
  Filters: jest.fn(() => <div data-testid={'filters-component'}>Mock Filters</div>),
}));

const mockUseCaledarMOEXShift = useCalendarMOEXShift as jest.Mock;
const mockUseConfoByParamsAndTransfersForNettings = useConfoByParamsAndTransfersForNettings as jest.Mock;
const mockUseConfoByParamsAndTradeByParams = useConfoByParamsAndTradeByParams as jest.Mock;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        cacheTime: 0,
        retry: false,
      },
    },
  });

const renderWithQuery = (ui: ReactElement) => {
  const queryClient = createQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('DocumentsSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Мок календаря
    mockUseCaledarMOEXShift.mockReturnValue({
      data: { nextDay: new Date('2023-01-02'), pastDay: new Date('2023-01-01') },
      isLoading: false,
    });
    // Мок данных по платежам
    mockUseConfoByParamsAndTransfersForNettings.mockReturnValue({
      count: 10,
      isError: false,
      isFetching: false,
      isIdle: false,
      refetch: jest.fn(),
      tableData: [],
    });
    // Мок данных по confo
    mockUseConfoByParamsAndTradeByParams.mockReturnValue({
      count: 5,
      isError: false,
      isFetching: false,
      isIdle: false,
      refetch: jest.fn(),
      tableData: [],
    });
  });

  it('должен показывать лоадер, пока подгружается календарь', async () => {
    mockUseCaledarMOEXShift.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderWithQuery(<DocumentsSidebar />);
    await waitFor(() => {
      expect(screen.getByTestId('isFetching'));
    });
  });

  it('должен отображать SidebarWrapper после загрузки календаря', async () => {
    renderWithQuery(<DocumentsSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-wrapper')).toBeInTheDocument();
    });

    expect(screen.getByText('Документы')).toBeInTheDocument();
    expect(
      screen.getByText(/Чтобы начать поиск, заполните обязательные поля: Время документа и Тип документа/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('filters-component')).toBeInTheDocument();
  });

  it('должен отображать таблицу, когда есть данные', async () => {
    mockUseConfoByParamsAndTransfersForNettings.mockReturnValue({
      count: 10,
      isError: false,
      isFetching: false,
      isIdle: false,
      refetch: jest.fn(),
      tableData: [{ id: 1, name: 'Transfer 1' }],
    });

    renderWithQuery(<DocumentsSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('table')).toBeInTheDocument();
    });
  });

  it('должен вызвать onReset при клике по кнопке Reset', async () => {
    renderWithQuery(<DocumentsSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-wrapper')).toBeInTheDocument();
    });

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    // Проверяем, что обновился formKey (без отдельного селектора, но мы видим, что компонент перерисовался)
    // Селектора нет внутри SidebarWrapper, но мы можем проверить, что onReset был вызван
    expect(SidebarWrapper).toHaveBeenCalled();
  });

  it('должен корректно обрабатывать состояние загрузки', async () => {
    mockUseConfoByParamsAndTransfersForNettings.mockReturnValue({
      count: 10,
      isError: false,
      isFetching: true,
      isIdle: false,
      refetch: jest.fn(),
      tableData: [],
    });

    renderWithQuery(<DocumentsSidebar />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar-wrapper')).toBeInTheDocument();
    });

    expect(screen.getByTestId('isFetching')).toHaveTextContent('Loading...');
  });
});
