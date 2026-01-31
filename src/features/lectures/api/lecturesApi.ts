import { baseApi } from '@/store/api/baseApi';
import type { Lecture } from '../types';

/**
 * API endpoints для работы с лекциями
 */
export const lecturesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Получить все лекции (опционально с фильтрацией по категории)
     */
    getLectures: builder.query<Lecture[], { category?: string } | void>({
      query: (params) => {
        if (!params || !params.category) {
          return '/lectures';
        }
        return `/lectures?category=${params.category}`;
      },
      providesTags: ['Lectures'],
    }),

    /**
     * Получить лекцию по ID
     */
    getLectureById: builder.query<Lecture, string>({
      query: (id) => `/lectures/${id}`,
      providesTags: (result, error, id) => [{ type: 'Lecture', id }],
    }),

    /**
     * Получить лекцию по ID вопроса
     */
    getLectureByQuestionId: builder.query<Lecture, string>({
      query: (questionId) => `/lectures/by-question/${questionId}`,
      providesTags: (result) =>
        result ? [{ type: 'Lecture', id: result.id }] : [],
    }),

    /**
     * Обновить прогресс выполнения задач в лекции
     */
    updateTaskProgress: builder.mutation<
      { success: boolean },
      {
        lectureId: string;
        completedTasks: string[];
      }
    >({
      query: ({ lectureId, completedTasks }) => ({
        url: `/lectures/${lectureId}/tasks-progress`,
        method: 'POST',
        body: { completedTasks },
      }),
      // Инвалидируем лекцию, чтобы обновить прогресс
      invalidatesTags: (result, error, { lectureId }) => [
        { type: 'Lecture', id: lectureId }
      ],
    }),

    /**
     * Получить прогресс выполнения задач в лекции
     */
    getTaskProgress: builder.query<
      { completedTasks: string[] },
      string
    >({
      query: (lectureId) => `/lectures/${lectureId}/tasks-progress`,
      providesTags: (result, error, lectureId) => [
        { type: 'Lecture', id: lectureId }
      ],
    }),
  }),
});

/**
 * Экспортируем auto-generated hooks
 */
export const {
  useGetLecturesQuery,
  useGetLectureByIdQuery,
  useGetLectureByQuestionIdQuery,
  useUpdateTaskProgressMutation,
  useGetTaskProgressQuery,
} = lecturesApi;
