'use client';

import { usePomodoro } from '@/contexts/PomodoroContext';
import styles from './PomodoroTimer.module.scss';

export default function PomodoroTimer() {
  const {
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
  } = usePomodoro();

  return (
    <div className={styles.container}>
      <div className={styles.modeSelector}>
        <button
          className={`${styles.modeButton} ${mode === 'work' ? styles.active : ''}`}
          onClick={() => switchMode('work')}
        >
          Работа
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'short_break' ? styles.active : ''}`}
          onClick={() => switchMode('short_break')}
        >
          Короткий перерыв
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'long_break' ? styles.active : ''}`}
          onClick={() => switchMode('long_break')}
        >
          Длинный перерыв
        </button>
      </div>

      <div className={styles.timerCircle}>
        <svg className={styles.progressRing} width="300" height="300">
          <circle
            className={styles.progressRingBackground}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
            r="140"
            cx="150"
            cy="150"
          />
          <circle
            className={styles.progressRingProgress}
            stroke={mode === 'work' ? '#ef4444' : '#10b981'}
            strokeWidth="8"
            fill="transparent"
            r="140"
            cx="150"
            cy="150"
            style={{
              strokeDasharray: `${2 * Math.PI * 140}`,
              strokeDashoffset: `${2 * Math.PI * 140 * (1 - progress / 100)}`,
            }}
          />
        </svg>
        <div className={styles.timeDisplay}>
          <span className={styles.time}>{formatTime(timeLeft)}</span>
          <span className={styles.modeLabel}>
            {mode === 'work' ? 'Работа' : mode === 'short_break' ? 'Короткий перерыв' : 'Длинный перерыв'}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.controlButton} ${styles.primary}`}
          onClick={isRunning ? pauseTimer : startTimer}
        >
          {isRunning ? 'Пауза' : 'Старт'}
        </button>
        <button
          className={`${styles.controlButton} ${styles.secondary}`}
          onClick={resetTimer}
        >
          Сброс
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{completedPomodoros}</span>
          <span className={styles.statLabel}>Завершено помодоро</span>
        </div>
      </div>

      <div className={styles.infoBox}>
        <p className={styles.infoText}>
          💡 После запуска таймер будет виден в правом верхнем углу на всех страницах
        </p>
      </div>
    </div>
  );
}
