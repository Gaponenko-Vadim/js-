'use client';

import { Provider } from 'react-redux';
import { ReactNode, useEffect } from 'react';
import { store } from '@/store/store';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '@/store/localStorage';

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Загружаем состояние из localStorage при инициализации на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = loadStateFromLocalStorage();
      if (savedState) {
        // Здесь можно инициализировать состояние, если нужно
        // Но обычно preloadedState передается в configureStore
      }

      // Подписываемся на изменения и сохраняем только pomodoro state
      const unsubscribe = store.subscribe(() => {
        const state = store.getState();
        saveStateToLocalStorage(state);
      });

      return () => unsubscribe();
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
