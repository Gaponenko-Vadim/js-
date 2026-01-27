import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Базовый RTK Query API
 * Все endpoints будут инжектиться через injectEndpoints
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    // Автоматически добавляем credentials для NextAuth
    credentials: 'same-origin',
  }),
  // Определяем типы тегов для кэширования и инвалидации
  tagTypes: [
    'Tests',
    'Test',
    'Results',
    'CombinedResults',
    'Lectures',
    'Lecture',
    'Categories',
    'UserLists',
    'UserList',
    'UserSettings',
    'PomodoroSessions'
  ],
  // Пустые endpoints - будут добавлены через injectEndpoints
  endpoints: () => ({}),
});
