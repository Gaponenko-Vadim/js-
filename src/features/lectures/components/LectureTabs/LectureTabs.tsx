/**
 * LectureTabs Component
 *
 * Vertical tabs navigation for lecture sections
 */

import styles from './LectureTabs.module.scss';
import type { LectureTabsProps } from '../../types';

export function LectureTabs({
  activeTab,
  onTabChange,
  hasScenarios,
  hasExample,
  hasTasks
}: LectureTabsProps) {
  // Don't render tabs if there's nothing to show
  if (!hasScenarios && !hasExample && !hasTasks) {
    return null;
  }

  return (
    <div className={styles.tabsBar}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'lecture' ? styles.activeTab : ''}`}
          onClick={() => onTabChange('lecture')}
          type="button"
        >
          Лекция
        </button>
        {hasScenarios && (
          <button
            className={`${styles.tabButton} ${activeTab === 'scenarios' ? styles.activeTab : ''}`}
            onClick={() => onTabChange('scenarios')}
            type="button"
          >
            Сценарии
          </button>
        )}
        {hasExample && (
          <button
            className={`${styles.tabButton} ${activeTab === 'example' ? styles.activeTab : ''}`}
            onClick={() => onTabChange('example')}
            type="button"
          >
            Пример
          </button>
        )}
        {hasTasks && (
          <button
            className={`${styles.tabButton} ${activeTab === 'tasks' ? styles.activeTab : ''}`}
            onClick={() => onTabChange('tasks')}
            type="button"
          >
            Задания
          </button>
        )}
      </div>
    </div>
  );
}
