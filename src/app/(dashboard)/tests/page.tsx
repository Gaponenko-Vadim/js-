'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import AddToListModal from '@/components/lists/AddToListModal';
import { useGetCategoriesQuery, type Category } from '@/features/categories';
import { useGetTestsQuery, type Test } from '@/features/tests';
import { useGetResultsQuery } from '@/features/results';
import styles from './tests.module.scss';

type TestResult = {
  id: string;
  testId: string;
  score: number;
  completedAt: string;
};

function TestsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [showMarathons, setShowMarathons] = useState<boolean>(false);
  const [addToListModal, setAddToListModal] = useState<{ isOpen: boolean; testId: string; testTitle: string }>({
    isOpen: false,
    testId: '',
    testTitle: '',
  });

  // RTK Query hooks
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: tests = [], isLoading: testsLoading } = useGetTestsQuery(
    selectedCategory ? { category: selectedCategory } : {}
  );
  const { data: results = [], isLoading: resultsLoading } = useGetResultsQuery();

  const loading = categoriesLoading || testsLoading || resultsLoading;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Читаем query параметр category из URL при монтировании
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Фильтрация тестов через useMemo
  const filteredTests = useMemo(() => {
    let filtered = tests;

    // Разделяем марафоны и обычные тесты
    if (showMarathons) {
      // Показываем только марафоны
      filtered = filtered.filter((test) => test.title.includes('Марафон:'));
    } else {
      // Показываем только обычные тесты (исключаем марафоны)
      filtered = filtered.filter((test) => !test.title.includes('Марафон:'));

      // Фильтрация по уровню сложности
      if (selectedDifficulty !== 'all') {
        filtered = filtered.filter((test) => test.difficulty === selectedDifficulty);
      }
    }

    // Фильтрация по профессии (работает для обоих режимов)
    if (selectedProfession !== 'all') {
      filtered = filtered.filter((test) => test.tags?.includes(selectedProfession));
    }

    return filtered;
  }, [selectedDifficulty, selectedProfession, tests, showMarathons]);

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Начальный';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return styles.beginner;
      case 'intermediate':
        return styles.intermediate;
      case 'advanced':
        return styles.advanced;
      default:
        return '';
    }
  };

  const getProfessionLabel = (profession: string) => {
    switch (profession) {
      case 'system-analyst':
        return 'Системный аналитик';
      case 'qa-engineer':
        return 'QA Engineer';
      case 'frontend':
        return 'Frontend';
      case 'backend':
        return 'Backend';
      case 'fullstack':
        return 'Fullstack';
      default:
        return profession;
    }
  };

  const getProfessionColor = (profession: string) => {
    switch (profession) {
      case 'system-analyst':
        return styles.systemAnalyst;
      case 'qa-engineer':
        return styles.qaEngineer;
      case 'frontend':
        return styles.frontend;
      case 'backend':
        return styles.backend;
      case 'fullstack':
        return styles.fullstack;
      default:
        return '';
    }
  };

  // Проверяем, есть ли незавершенный прогресс для теста
  const hasInProgressTest = (testId: string): boolean => {
    const savedState = sessionStorage.getItem(`test_${testId}_state`);
    if (!savedState) return false;

    try {
      const state = JSON.parse(savedState);
      // Для экзамена проверяем, не истекло ли время
      if (state.testMode === 'exam' && state.endTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
        return remaining > 0;
      }
      // Для режима обучения просто проверяем наличие состояния
      return state.testMode === 'learning';
    } catch {
      return false;
    }
  };

  // Получить лучший результат для теста
  const getBestScoreForTest = (testId: string): number | null => {
    const testResults = results.filter((result) => result.testId === testId);
    if (testResults.length === 0) return null;

    return Math.max(...testResults.map((result) => result.score));
  };

  // Получить цвет для результата
  const getScoreColor = (score: number): string => {
    if (score >= 80) return styles.excellent;
    if (score >= 60) return styles.good;
    return styles.needsWork;
  };

  const currentCategory = categories.find((c) => c.slug === selectedCategory);

  // Если категория не выбрана, показываем только экран выбора категории
  if (!selectedCategory) {
    return (
      <div className={styles.container}>
        <DashboardHeader />

        <div className={styles.pageHeader}>
          <h1>Выберите категорию</h1>
          <p>Выберите категорию тестов для прохождения</p>
        </div>

        <main className={styles.main}>
          <div className={styles.categorySelector}>
            <div className={styles.categoryButtons}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={styles.categoryButton}
                  onClick={() => {
                    // Обновляем URL с параметром category
                    router.push(`/tests?category=${category.slug}`);
                    setSelectedCategory(category.slug);
                    setSelectedDifficulty('all');
                    setSelectedProfession('all');
                    setShowMarathons(false);
                  }}
                >
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <div className={styles.categoryInfo}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryDescription}>{category.description}</span>
                    <span className={styles.categoryCount}>
                      {category._count?.tests ?? 0} {category._count?.tests === 1 ? 'тест' : 'тестов'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Если категория выбрана, показываем тесты этой категории
  return (
    <div className={styles.container}>
      <DashboardHeader />

      <div className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => {
            // Возвращаемся к странице выбора категорий
            router.push('/tests');
            setSelectedCategory(null);
            setSelectedDifficulty('all');
            setSelectedProfession('all');
            setShowMarathons(false);
          }}
        >
          ← Назад к категориям
        </button>
        <h1>
          {currentCategory ? `${currentCategory.icon} ${currentCategory.name}` : 'Тесты'}
        </h1>
        <p>
          {currentCategory ? currentCategory.description : 'Выберите тест для прохождения'}
        </p>
      </div>

      <main className={styles.main}>
        <div className={styles.filtersContainer}>
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Уровень сложности:</h3>
            <div className={styles.filters}>
              <button
                className={`${styles.filterButton} ${!showMarathons && selectedDifficulty === 'all' ? styles.active : ''}`}
                onClick={() => {
                  setShowMarathons(false);
                  setSelectedDifficulty('all');
                }}
              >
                Все ({tests.filter((t) => !t.title.includes('Марафон:')).length})
              </button>
              <button
                className={`${styles.filterButton} ${!showMarathons && selectedDifficulty === 'beginner' ? styles.active : ''}`}
                onClick={() => {
                  setShowMarathons(false);
                  setSelectedDifficulty('beginner');
                }}
              >
                Начальный ({tests.filter((t) => t.difficulty === 'beginner' && !t.title.includes('Марафон:')).length})
              </button>
              <button
                className={`${styles.filterButton} ${!showMarathons && selectedDifficulty === 'intermediate' ? styles.active : ''}`}
                onClick={() => {
                  setShowMarathons(false);
                  setSelectedDifficulty('intermediate');
                }}
              >
                Средний ({tests.filter((t) => t.difficulty === 'intermediate' && !t.title.includes('Марафон:')).length})
              </button>
              <button
                className={`${styles.filterButton} ${!showMarathons && selectedDifficulty === 'advanced' ? styles.active : ''}`}
                onClick={() => {
                  setShowMarathons(false);
                  setSelectedDifficulty('advanced');
                }}
              >
                Продвинутый ({tests.filter((t) => t.difficulty === 'advanced' && !t.title.includes('Марафон:')).length})
              </button>
              <button
                className={`${styles.filterButton} ${styles.marathonButton} ${showMarathons ? styles.active : ''}`}
                onClick={() => {
                  setShowMarathons(true);
                  setSelectedDifficulty('all');
                }}
              >
                🏃 Марафоны ({tests.filter((t) => t.title.includes('Марафон:')).length})
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Профессия:</h3>
            <div className={styles.filters}>
              <button
                className={`${styles.filterButton} ${selectedProfession === 'all' ? styles.active : ''}`}
                onClick={() => setSelectedProfession('all')}
              >
                Все профессии
              </button>
              <button
                className={`${styles.filterButton} ${selectedProfession === 'system-analyst' ? styles.active : ''}`}
                onClick={() => setSelectedProfession('system-analyst')}
              >
                Системный аналитик
              </button>
              <button
                className={`${styles.filterButton} ${selectedProfession === 'qa-engineer' ? styles.active : ''}`}
                onClick={() => setSelectedProfession('qa-engineer')}
              >
                QA Engineer
              </button>
              <button
                className={`${styles.filterButton} ${selectedProfession === 'frontend' ? styles.active : ''}`}
                onClick={() => setSelectedProfession('frontend')}
              >
                Frontend
              </button>
              <button
                className={`${styles.filterButton} ${selectedProfession === 'backend' ? styles.active : ''}`}
                onClick={() => setSelectedProfession('backend')}
              >
                Backend
              </button>
              <button
                className={`${styles.filterButton} ${selectedProfession === 'fullstack' ? styles.active : ''}`}
                onClick={() => setSelectedProfession('fullstack')}
              >
                Fullstack
              </button>
            </div>
          </div>
        </div>

        <div className={styles.testsList}>
          {filteredTests.map((test) => {
            const bestScore = getBestScoreForTest(test.id);
            const testUrl = selectedCategory
              ? `/tests/${test.id}?category=${selectedCategory}`
              : `/tests/${test.id}`;
            return (
              <div key={test.id} className={styles.testCard}>
                <div className={styles.testCardHeader}>
                  <h3>{test.title}</h3>
                  <div className={styles.badgesContainer}>
                    <span className={`${styles.badge} ${getDifficultyColor(test.difficulty)}`}>
                      {getDifficultyLabel(test.difficulty)}
                    </span>
                    {bestScore !== null && (
                      <div className={`${styles.scoreCircleBadge} ${getScoreColor(bestScore)}`}>
                        <span className={styles.scoreText}>{bestScore}%</span>
                      </div>
                    )}
                  </div>
                </div>
                <p>{test.description}</p>

              {/* Теги профессий */}
              {test.tags && test.tags.length > 0 && (
                <div className={styles.professionTags}>
                  {test.tags.length === 5 ? (
                    <span className={`${styles.professionBadge} ${styles.allProfessions}`}>
                      🌟 Для всех профессий
                    </span>
                  ) : (
                    test.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`${styles.professionBadge} ${getProfessionColor(tag)}`}
                      >
                        {getProfessionLabel(tag)}
                      </span>
                    ))
                  )}
                </div>
              )}

                <div className={styles.testCardFooter}>
                  <Link href={testUrl} className={styles.testLink}>
                    {hasInProgressTest(test.id) ? (
                      <span className={styles.continueButton}>🔄 Продолжить</span>
                    ) : (
                      <span className={styles.startButton}>Начать тест</span>
                    )}
                  </Link>
                  <button
                    className={styles.addToListButton}
                    onClick={() => setAddToListModal({ isOpen: true, testId: test.id, testTitle: test.title })}
                    title="Добавить в мой список"
                  >
                    <span className={styles.bookmarkIcon}>📋</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className={styles.noTests}>
            <p>Тесты не найдены</p>
          </div>
        )}

        {addToListModal.isOpen && (
          <AddToListModal
            testId={addToListModal.testId}
            testTitle={addToListModal.testTitle}
            isOpen={addToListModal.isOpen}
            onClose={() => setAddToListModal({ isOpen: false, testId: '', testTitle: '' })}
          />
        )}
      </main>
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Загрузка...</div>}>
      <TestsPageContent />
    </Suspense>
  );
}
