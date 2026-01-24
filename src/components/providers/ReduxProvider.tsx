'use client';

import { Provider } from 'react-redux';
import { ReactNode, useState } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import pomodoroReducer from '@/store/pomodoroSlice';
import userListsReducer from '@/store/userListsSlice';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '@/store/localStorage';

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Используем ленивую инициализацию useState для создания store один раз
  const [store] = useState(() => makeStore());

  return <Provider store={store}>{children}</Provider>;
}

function makeStore() {
  // Загружаем состояние из localStorage только на клиенте
  const preloadedState = typeof window !== 'undefined'
    ? (() => {
        const savedState = loadStateFromLocalStorage();
        return savedState ? { pomodoro: savedState } : undefined;
      })()
    : undefined;

  const store = configureStore({
    reducer: {
      pomodoro: pomodoroReducer,
      userLists: userListsReducer,
    },
    preloadedState,
  });

  // Сохраняем состояние в localStorage при каждом изменении (только на клиенте)
  if (typeof window !== 'undefined') {
    store.subscribe(() => {
      saveStateToLocalStorage(store.getState());
    });
  }

  return store;
}
