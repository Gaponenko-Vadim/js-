import { RootState } from './store';

const STORAGE_KEY = 'pomodoro_state';

// Сохранение состояния в localStorage
export const saveStateToLocalStorage = (state: RootState) => {
  try {
    const serializedState = JSON.stringify(state.pomodoro);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Could not save state to localStorage:', err);
  }
};

// Загрузка состояния из localStorage
export const loadStateFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Could not load state from localStorage:', err);
    return undefined;
  }
};

// Очистка состояния из localStorage
export const clearStateFromLocalStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Could not clear state from localStorage:', err);
  }
};
