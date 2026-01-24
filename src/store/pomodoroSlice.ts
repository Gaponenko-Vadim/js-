import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TimerMode = 'work' | 'short_break' | 'long_break';

export const TIMER_SETTINGS = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

interface PomodoroState {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  hasStarted: boolean;
  endTime: number | null; // timestamp когда таймер должен завершиться
}

const initialState: PomodoroState = {
  mode: 'work',
  timeLeft: TIMER_SETTINGS.work,
  isRunning: false,
  completedPomodoros: 0,
  hasStarted: false,
  endTime: null,
};

const pomodoroSlice = createSlice({
  name: 'pomodoro',
  initialState,
  reducers: {
    startTimer: (state) => {
      state.isRunning = true;
      state.hasStarted = true;
      // Устанавливаем время окончания таймера
      state.endTime = Date.now() + state.timeLeft * 1000;
    },
    pauseTimer: (state) => {
      state.isRunning = false;
      state.endTime = null;
    },
    tick: (state) => {
      if (state.endTime && state.isRunning) {
        // Вычисляем оставшееся время на основе реального времени
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
        state.timeLeft = remaining;
      }
    },
    resetTimer: (state) => {
      state.isRunning = false;
      state.timeLeft = TIMER_SETTINGS[state.mode];
      state.endTime = null;
    },
    switchMode: (state, action: PayloadAction<TimerMode>) => {
      state.mode = action.payload;
      state.timeLeft = TIMER_SETTINGS[action.payload];
      state.isRunning = false;
      state.endTime = null;
    },
    completeTimer: (state) => {
      state.isRunning = false;
      state.endTime = null;

      if (state.mode === 'work') {
        state.completedPomodoros += 1;
        const nextMode = state.completedPomodoros % 4 === 0 ? 'long_break' : 'short_break';
        state.mode = nextMode;
        state.timeLeft = TIMER_SETTINGS[nextMode];
      } else {
        state.mode = 'work';
        state.timeLeft = TIMER_SETTINGS.work;
      }
    },
  },
});

export const {
  startTimer,
  pauseTimer,
  tick,
  resetTimer,
  switchMode,
  completeTimer,
} = pomodoroSlice.actions;

export default pomodoroSlice.reducer;
