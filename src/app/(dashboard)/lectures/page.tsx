'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import LectureModal from '@/components/lecture/LectureModal';
import { useGetCategoriesQuery, type Category } from '@/features/categories';
import { useGetLecturesQuery, type Lecture } from '@/features/lectures';
import styles from './lectures.module.scss';

function LecturesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // RTK Query hooks
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: lectures = [], isLoading: lecturesLoading } = useGetLecturesQuery();

  const loading = categoriesLoading || lecturesLoading;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  const currentCategory = categories.find((c) => c.slug === selectedCategory);

  if (!selectedCategory) {
    return (
      <div className={styles.container}>
        <DashboardHeader />

        <div className={styles.pageHeader}>
          <h1>Выберите категорию</h1>
          <p>Выберите категорию лекций для изучения</p>
        </div>

        <main className={styles.main}>
          <div className={styles.categorySelector}>
            <div className={styles.categoryButtons}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={styles.categoryButton}
                  onClick={() => {
                    router.push(`/lectures?category=${category.slug}`);
                    setSelectedCategory(category.slug);
                  }}
                >
                  <div className={styles.bookSpine}>
                    <span className={styles.categoryIcon}>{category.icon}</span>
                    <div className={styles.categoryInfo}>
                      <span className={styles.categoryName}>{category.name}</span>
                      <span className={styles.categoryDescription}>{category.description}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DashboardHeader />

      <div className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => {
            router.push('/lectures');
            setSelectedCategory(null);
            setSelectedLecture(null);
          }}
        >
          ← Назад к категориям
        </button>
        <h1>
          {currentCategory ? `${currentCategory.icon} ${currentCategory.name} - Лекции` : 'Лекции'}
        </h1>
        <p>
          {currentCategory
            ? `Теоретические материалы по ${currentCategory.name}`
            : 'Выберите лекцию для изучения'}
        </p>
      </div>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingLectures}>Загрузка лекций...</div>
        ) : (
          <>
            <div className={styles.lecturesCount}>
              <p>Всего лекций: {lectures.length}</p>
            </div>

            <div className={styles.lecturesList}>
              {lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className={styles.lectureCard}
                  onClick={() => setSelectedLecture(lecture)}
                >
                  <div className={styles.lectureCardHeader}>
                    <span className={styles.lectureCardTopic}>{lecture.topic}</span>
                  </div>
                  <h3>{lecture.title}</h3>
                  <div className={styles.lectureCardFooter}>
                    <span className={styles.questionsCount}>
                      📖 {lecture.questionsCount} вопросов
                    </span>
                    <span className={styles.readButton}>Читать →</span>
                  </div>
                </div>
              ))}
            </div>

            {lectures.length === 0 && (
              <div className={styles.noLectures}>
                <p>Лекции не найдены</p>
              </div>
            )}
          </>
        )}

        {selectedLecture && (
          <LectureModal
            lectureId={selectedLecture.id}
            isOpen={true}
            onClose={() => setSelectedLecture(null)}
          />
        )}
      </main>
    </div>
  );
}

export default function LecturesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>}>
      <LecturesPageContent />
    </Suspense>
  );
}
