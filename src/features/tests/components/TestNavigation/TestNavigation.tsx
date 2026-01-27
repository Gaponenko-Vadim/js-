/**
 * TestNavigation Component
 *
 * Кнопки навигации между вопросами теста
 */

import styles from './TestNavigation.module.scss';

export interface TestNavigationProps {
  /** Текущий индекс вопроса */
  currentIndex: number;
  /** Общее количество вопросов */
  totalQuestions: number;
  /** Есть ли выбранный ответ */
  hasAnswer: boolean;
  /** Callback для кнопки "Назад" */
  onPrevious: () => void;
  /** Callback для кнопки "Далее" / "Завершить" */
  onNext: () => void;
  /** Отключить кнопки */
  disabled?: boolean;
}

export function TestNavigation({
  currentIndex,
  totalQuestions,
  hasAnswer,
  onPrevious,
  onNext,
  disabled = false
}: TestNavigationProps) {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className={styles.navigation}>
      <button
        className={styles.secondaryButton}
        onClick={onPrevious}
        disabled={isFirstQuestion || disabled}
      >
        ← Назад
      </button>

      <button
        className={styles.primaryButton}
        onClick={onNext}
        disabled={!hasAnswer || disabled}
      >
        {isLastQuestion ? 'Завершить' : 'Далее →'}
      </button>
    </div>
  );
}
