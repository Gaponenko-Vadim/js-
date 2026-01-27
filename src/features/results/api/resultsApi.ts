import { baseApi } from '@/store/api/baseApi';
import type { TestResult, CombinedTestResult, ResultsStats } from '../types';

/**
 * API endpoints для работы с результатами тестов
 */
export const resultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Получить все результаты текущего пользователя
     */
    getResults: builder.query<TestResult[], void>({
      query: () => '/results',
      providesTags: ['Results'],
    }),

    /**
     * Получить результат по ID
     */
    getResultById: builder.query<TestResult, string>({
      query: (id) => `/results/${id}`,
      providesTags: (result, error, id) => [{ type: 'Results', id }],
    }),

    /**
     * Получить результаты комбинированных тестов
     */
    getCombinedResults: builder.query<CombinedTestResult[], void>({
      query: () => '/combined-results',
      providesTags: ['CombinedResults'],
    }),

    /**
     * Получить статистику результатов
     */
    getResultsStats: builder.query<ResultsStats, void>({
      query: () => '/results/stats',
      providesTags: ['Results'],
    }),

    /**
     * Удалить результат теста
     */
    deleteResult: builder.mutation<void, string>({
      query: (id) => ({
        url: `/results/${id}`,
        method: 'DELETE',
      }),
      // После удаления инвалидируем список результатов
      invalidatesTags: ['Results'],
    }),
  }),
});

/**
 * Экспортируем auto-generated hooks
 */
export const {
  useGetResultsQuery,
  useGetResultByIdQuery,
  useGetCombinedResultsQuery,
  useGetResultsStatsQuery,
  useDeleteResultMutation,
} = resultsApi;
