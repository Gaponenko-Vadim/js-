import { baseApi } from '@/store/api/baseApi';
import type { Test, CombinedTest } from '../types';

/**
 * API endpoints для работы с тестами
 * Использует RTK Query для автоматического кэширования и инвалидации
 */
export const testsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Получить список всех тестов с фильтрацией
     */
    getTests: builder.query<Test[], {
      difficulty?: string;
      category?: string;
      tags?: string[];
    } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
        if (params?.category) searchParams.append('category', params.category);
        if (params?.tags?.length) {
          params.tags.forEach(tag => searchParams.append('tags', tag));
        }
        const queryString = searchParams.toString();
        return `/tests${queryString ? `?${queryString}` : ''}`;
      },
      // Тег для кэширования - при инвалидации 'Tests' все запросы перезагрузятся
      providesTags: ['Tests'],
    }),

    /**
     * Получить один тест по ID с перемешанными вопросами
     */
    getTestById: builder.query<Test, string>({
      query: (id) => `/tests/${id}`,
      // Специфичный тег для этого теста
      providesTags: (result, error, id) => [{ type: 'Test', id }],
    }),

    /**
     * Получить комбинированный тест из нескольких тестов
     */
    getCombinedTest: builder.query<CombinedTest, string>({
      query: (testIds) => `/combined-test?tests=${testIds}`,
      // Кэшируем по testIds
      providesTags: (result, error, testIds) => [
        { type: 'Test', id: `combined_${testIds}` }
      ],
    }),

    /**
     * Отправить результаты теста
     */
    submitTest: builder.mutation<
      { score: number; correctAnswers: number[]; testResultId?: string },
      {
        testId: string;
        answers: number[];
        mode: 'learning' | 'exam';
      }
    >({
      query: ({ testId, answers, mode }) => ({
        url: `/tests/${testId}/submit`,
        method: 'POST',
        body: { answers, mode },
      }),
      // После отправки теста инвалидируем результаты, чтобы они перезагрузились
      invalidatesTags: ['Results', 'Tests'],
    }),

    /**
     * Отправить результаты комбинированного теста
     */
    submitCombinedTest: builder.mutation<
      { score: number; correctAnswers: number[]; testResultId?: string },
      {
        testIds: string;
        listName: string;
        answers: number[];
        mode: 'learning' | 'exam';
        sourceTests?: Array<{ testId: string; questionIds: string[] }>;
      }
    >({
      query: ({ testIds, listName, answers, mode, sourceTests }) => ({
        url: '/combined-test/submit',
        method: 'POST',
        body: { testIds, listName, answers, mode, sourceTests },
      }),
      // Инвалидируем результаты комбинированных тестов
      invalidatesTags: ['CombinedResults', 'Results'],
    }),
  }),
});

/**
 * Экспортируем auto-generated hooks
 * Они автоматически создаются RTK Query на основе endpoints
 */
export const {
  useGetTestsQuery,
  useGetTestByIdQuery,
  useGetCombinedTestQuery,
  useSubmitTestMutation,
  useSubmitCombinedTestMutation,
} = testsApi;
