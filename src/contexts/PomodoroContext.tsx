'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  startTimer as startTimerAction,
  pauseTimer as pauseTimerAction,
  resetTimer as resetTimerAction,
  switchMode as switchModeAction,
  tick,
  completeTimer,
  TimerMode,
  TIMER_SETTINGS
} from '@/store/pomodoroSlice';

interface PomodoroContextType {
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (newMode: TimerMode) => void;
  formatTime: (seconds: number) => string;
  progress: number;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { mode, timeLeft, isRunning, completedPomodoros } = useAppSelector((state) => state.pomodoro);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Создаем аудио элемент для уведомлений
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
    }

    // Запрашиваем разрешение на уведомления
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const handleTimerComplete = React.useCallback(async () => {
    dispatch(completeTimer());

    // Воспроизводим звук
    try {
      await audioRef.current?.play();
    } catch {
      console.log('Could not play notification sound');
    }

    // Показываем браузерное уведомление
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const modeText = mode === 'work' ? 'Работа' : mode === 'short_break' ? 'Короткий перерыв' : 'Длинный перерыв';
      new Notification('Таймер завершён!', {
        body: `${modeText} завершён. Время сделать перерыв!`,
        icon: '/favicon.ico',
      });
    }

    // Сохраняем сессию в БД
    if (mode === 'work') {
      try {
        await fetch('/api/pomodoro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: TIMER_SETTINGS[mode] / 60,
            type: mode,
          }),
        });
      } catch (err) {
        console.error('Failed to save pomodoro session:', err);
      }
    }
  }, [dispatch, mode]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      // Используем меньший интервал для более плавного обновления
      // даже на неактивных вкладках
      intervalRef.current = setInterval(() => {
        dispatch(tick());
      }, 100); // Обновляем каждые 100ms вместо 1000ms
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, dispatch, handleTimerComplete]);

  const startTimer = () => {
    dispatch(startTimerAction());
  };

  const pauseTimer = () => {
    dispatch(pauseTimerAction());
  };

  const resetTimer = () => {
    dispatch(resetTimerAction());
  };

  const switchMode = (newMode: TimerMode) => {
    dispatch(switchModeAction(newMode));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((TIMER_SETTINGS[mode] - timeLeft) / TIMER_SETTINGS[mode]) * 100;

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        timeLeft,
        isRunning,
        completedPomodoros,
        startTimer,
        pauseTimer,
        resetTimer,
        switchMode,
        formatTime,
        progress,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
