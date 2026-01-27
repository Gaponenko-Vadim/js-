import { baseApi } from '@/store/api/baseApi';
import type { Category } from '../types';

/**
 * API endpoints для работы с категориями
 */
export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Получить все категории с вложенными тестами
     */
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    /**
     * Получить категорию по slug
     */
    getCategoryBySlug: builder.query<Category, string>({
      query: (slug) => `/categories/${slug}`,
      providesTags: (result, error, slug) => [
        { type: 'Categories', id: slug }
      ],
    }),
  }),
});

/**
 * Экспортируем auto-generated hooks
 */
export const {
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
} = categoriesApi;
