import { configureStore } from '@reduxjs/toolkit';
import pomodoroReducer from './pomodoroSlice';
import userListsReducer from './userListsSlice';
import { baseApi } from './api/baseApi';

export const store = configureStore({
  reducer: {
    pomodoro: pomodoroReducer,
    userLists: userListsReducer,
    // Добавляем RTK Query API reducer
    [baseApi.reducerPath]: baseApi.reducer,
  },
  // Добавляем RTK Query middleware для кэширования, инвалидации и других функций
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
