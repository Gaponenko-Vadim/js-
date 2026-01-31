'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import styles from './dashboard.module.scss';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <DashboardHeader />

      <main className={styles.main}>
        <div className={styles.welcomeCard}>
          <h2>Добро пожаловать в Мамин программист!</h2>
          <p>Изучайте информационные технологии с интерактивными тестами и таймером Помодоро.</p>
        </div>

        <div className={styles.quickLinks}>
          <a href="/tests" className={styles.linkCard}>
            <h3>📚 Тесты</h3>
            <p>Интерактивные тесты по REST API и требованиям к ПО</p>
          </a>
          <a href="/lectures" className={styles.linkCard}>
            <h3>📖 Лекции</h3>
            <p>Теоретические материалы по каждой теме</p>
          </a>
          <a href="/pomodoro" className={styles.linkCard}>
            <h3>⏱️ Помодоро</h3>
            <p>Таймер для продуктивности</p>
          </a>
          <a href="/results" className={styles.linkCard}>
            <h3>📊 Результаты</h3>
            <p>История пройденных тестов</p>
          </a>
        </div>

        <div className={styles.comingSoon}>
          <p>🚧 Полная функциональность скоро будет добавлена!</p>
        </div>
      </main>
    </div>
  );
}
