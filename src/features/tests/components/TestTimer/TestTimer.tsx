/**
 * TestTimer Component
 *
 * Отображение таймера для режима экзамена
 */

import styles from './TestTimer.module.scss';

export interface TestTimerProps {
  /** Оставшееся время в секундах */
  timeLeft: number;
  /** Предупреждение (осталось мало времени) */
  isWarning?: boolean;
  /** Формат времени (по умолчанию MM:SS) */
  formatTime?: (seconds: number) => string;
}

const defaultFormatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function TestTimer({
  timeLeft,
  isWarning = false,
  formatTime = defaultFormatTime
}: TestTimerProps) {
  return (
    <div className={`${styles.timer} ${isWarning ? styles.warning : ''}`}>
      <span className={styles.icon}>⏱️</span>
      <span className={styles.time}>{formatTime(timeLeft)}</span>
    </div>
  );
}
