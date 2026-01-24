import { configureStore } from '@reduxjs/toolkit';
import pomodoroReducer from './pomodoroSlice';
import userListsReducer from './userListsSlice';

export const store = configureStore({
  reducer: {
    pomodoro: pomodoroReducer,
    userLists: userListsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
