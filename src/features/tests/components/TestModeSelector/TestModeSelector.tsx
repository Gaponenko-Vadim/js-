/**
 * TestModeSelector Component
 *
 * Экран выбора режима прохождения теста (обучение или экзамен)
 */

import { Test, TestMode } from '@/features/tests/types';
import styles from './TestModeSelector.module.scss';

export interface TestModeSelectorProps {
  /** Данные теста */
  test: Test;
  /** Callback при выборе режима */
  onSelectMode: (mode: TestMode) => void;
  /** Callback для кнопки "Назад" */
  onBack: () => void;
}

export function TestModeSelector({
  test,
  onSelectMode,
  onBack
}: TestModeSelectorProps) {
  const examDurationMinutes = Math.floor((test.questions.length * 20) / 60);
  const examDurationSeconds = (test.questions.length * 20) % 60;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Выберите режим прохождения</h1>
        <p className={styles.testTitle}>{test.title}</p>
        <p className={styles.testDescription}>{test.description}</p>

        <div className={styles.modeCards}>
          {/* Learning Mode Card */}
          <div className={styles.modeCard}>
            <div className={styles.modeIcon}>📚</div>
            <h2 className={styles.modeTitle}>Режим обучения</h2>
            <ul className={styles.modeFeatures}>
              <li className={styles.featurePositive}>
                ✅ Доступ к лекциям во время теста
              </li>
              <li className={styles.featurePositive}>
                ✅ Без ограничения по времени
              </li>
              <li className={styles.featurePositive}>
                ✅ Можно учиться в своём темпе
              </li>
              <li className={styles.featureNegative}>
                ❌ Результаты не сохраняются
              </li>
            </ul>
            <button
              className={styles.learningButton}
              onClick={() => onSelectMode('learning')}
            >
              Начать обучение
            </button>
          </div>

          {/* Exam Mode Card */}
          <div className={styles.modeCard}>
            <div className={styles.modeIcon}>🎯</div>
            <h2 className={styles.modeTitle}>Режим экзамена</h2>
            <ul className={styles.modeFeatures}>
              <li className={styles.featurePositive}>
                ⏱️ Ограничение: {examDurationMinutes} мин{' '}
                {examDurationSeconds > 0 && `${examDurationSeconds} сек`}
              </li>
              <li className={styles.featurePositive}>
                ✅ Результаты сохраняются
              </li>
              <li className={styles.featurePositive}>
                ✅ Засчитывается в статистику
              </li>
              <li className={styles.featureNegative}>
                ❌ Нет доступа к лекциям
              </li>
            </ul>
            <button
              className={styles.examButton}
              onClick={() => onSelectMode('exam')}
            >
              Начать экзамен
            </button>
          </div>
        </div>

        <button className={styles.backButton} onClick={onBack}>
          ← Назад к списку тестов
        </button>
      </div>
    </div>
  );
}
