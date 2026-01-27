/**
 * useTestTimer Hook
 *
 * Управление таймером для режима экзамена
 * Использует endTime pattern для точного отсчета времени
 */

import { useState, useEffect, useRef } from 'react';

export interface UseTestTimerOptions {
  /** Активен ли таймер */
  isActive: boolean;
  /** Длительность в секундах */
  duration: number;
  /** Callback при истечении времени */
  onTimeUp?: () => void;
}

export interface UseTestTimerReturn {
  /** Оставшееся время в секундах */
  timeLeft: number;
  /** Время истекло */
  isTimeUp: boolean;
  /** Точное время окончания (timestamp) */
  endTime: number | null;
  /** Форматированное время (MM:SS) */
  formattedTime: string;
  /** Сбросить таймер */
  reset: () => void;
  /** Установить новое endTime (для восстановления) */
  setEndTime: (time: number) => void;
}

/**
 * Hook для точного таймера теста
 *
 * @example
 * ```tsx
 * const { timeLeft, formattedTime, isTimeUp } = useTestTimer({
 *   isActive: testMode === 'exam' && testStarted,
 *   duration: questions.length * 20, // 20 секунд на вопрос
 *   onTimeUp: () => submitTest(answers)
 * });
 *
 * return (
 *   <div>
 *     <span>{formattedTime}</span>
 *     {isTimeUp && <p>Время вышло!</p>}
 *   </div>
 * );
 * ```
 */
export function useTestTimer({
  isActive,
  duration,
  onTimeUp
}: UseTestTimerOptions): UseTestTimerReturn {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [endTime, setEndTimeState] = useState<number | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Обновляем ref при изменении callback
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Устанавливаем endTime при активации таймера
  useEffect(() => {
    if (isActive && !endTime) {
      const end = Date.now() + timeLeft * 1000;
      setEndTimeState(end);
    }
  }, [isActive, endTime, timeLeft]);

  // Основной таймер с проверкой каждые 100мс
  useEffect(() => {
    if (!isActive || !endTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        onTimeUpRef.current?.();
      }
    }, 100); // 100мс для точности

    return () => clearInterval(timer);
  }, [isActive, endTime]);

  // Обработка переключения вкладок (visibility change)
  useEffect(() => {
    if (!isActive || !endTime) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Пользователь вернулся на вкладку - пересчитываем время
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining === 0) {
          onTimeUpRef.current?.();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, endTime]);

  // Форматирование времени MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setTimeLeft(duration);
    setEndTimeState(null);
  };

  const setEndTime = (time: number) => {
    setEndTimeState(time);
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((time - now) / 1000));
    setTimeLeft(remaining);
  };

  return {
    timeLeft,
    isTimeUp: timeLeft === 0,
    endTime,
    formattedTime: formatTime(timeLeft),
    reset,
    setEndTime
  };
}
