'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { TIMER_SETTINGS } from '@/store/pomodoroSlice';

export default function PomodoroTitleUpdater() {
  const { mode, timeLeft, isRunning } = useAppSelector((state) => state.pomodoro);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Отслеживаем видимость вкладки
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getModeEmoji = () => {
      switch (mode) {
        case 'work':
          return '🎯';
        case 'short_break':
          return '☕';
        case 'long_break':
          return '🌟';
      }
    };

    // Показываем таймер в заголовке ТОЛЬКО когда вкладка неактивна
    if (!isPageVisible && (isRunning || timeLeft < TIMER_SETTINGS[mode])) {
      document.title = `${getModeEmoji()} ${formatTime(timeLeft)} | Мамин программист`;
    } else {
      // Когда вкладка активна - обычный заголовок
      document.title = 'Мамин программист';
    }
  }, [isRunning, timeLeft, mode, isPageVisible]);

  return null; // Этот компонент ничего не рендерит
}
