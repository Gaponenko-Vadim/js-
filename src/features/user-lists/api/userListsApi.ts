import { baseApi } from '@/store/api/baseApi';
import type {
  UserTestList,
  CreateListDto,
  UpdateListDto,
  AddTestToListDto
} from '../types';

/**
 * API endpoints для работы с пользовательскими списками тестов
 */
export const userListsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Получить все списки текущего пользователя
     */
    getUserLists: builder.query<UserTestList[], void>({
      query: () => '/user-lists',
      providesTags: ['UserLists'],
    }),

    /**
     * Получить список по ID
     */
    getUserListById: builder.query<UserTestList, string>({
      query: (id) => `/user-lists/${id}`,
      providesTags: (result, error, id) => [{ type: 'UserList', id }],
    }),

    /**
     * Создать новый список
     */
    createUserList: builder.mutation<UserTestList, CreateListDto>({
      query: (body) => ({
        url: '/user-lists',
        method: 'POST',
        body,
      }),
      // После создания инвалидируем список всех списков
      invalidatesTags: ['UserLists'],
    }),

    /**
     * Обновить список
     */
    updateUserList: builder.mutation<
      UserTestList,
      { id: string; data: UpdateListDto }
    >({
      query: ({ id, data }) => ({
        url: `/user-lists/${id}`,
        method: 'PATCH',
        body: data,
      }),
      // Инвалидируем конкретный список и весь список
      invalidatesTags: (result, error, { id }) => [
        { type: 'UserList', id },
        'UserLists'
      ],
    }),

    /**
     * Удалить список
     */
    deleteUserList: builder.mutation<void, string>({
      query: (id) => ({
        url: `/user-lists/${id}`,
        method: 'DELETE',
      }),
      // После удаления инвалидируем списки
      invalidatesTags: ['UserLists'],
    }),

    /**
     * Добавить тест в список
     */
    addTestToList: builder.mutation<
      void,
      { listId: string; data: AddTestToListDto }
    >({
      query: ({ listId, data }) => ({
        url: `/user-lists/${listId}/tests`,
        method: 'POST',
        body: data,
      }),
      // Инвалидируем конкретный список
      invalidatesTags: (result, error, { listId }) => [
        { type: 'UserList', id: listId },
        'UserLists'
      ],
    }),

    /**
     * Удалить тест из списка
     */
    removeTestFromList: builder.mutation<
      void,
      { listId: string; testId: string }
    >({
      query: ({ listId, testId }) => ({
        url: `/user-lists/${listId}/tests/${testId}`,
        method: 'DELETE',
      }),
      // Инвалидируем конкретный список
      invalidatesTags: (result, error, { listId }) => [
        { type: 'UserList', id: listId },
        'UserLists'
      ],
    }),
  }),
});

/**
 * Экспортируем auto-generated hooks
 */
export const {
  useGetUserListsQuery,
  useGetUserListByIdQuery,
  useCreateUserListMutation,
  useUpdateUserListMutation,
  useDeleteUserListMutation,
  useAddTestToListMutation,
  useRemoveTestFromListMutation,
} = userListsApi;
